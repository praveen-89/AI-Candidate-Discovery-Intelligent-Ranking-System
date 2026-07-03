import os
import sys
import time
import json
from datetime import datetime

# Ensure the src directory is on the path so imports resolve correctly
# per pyproject.toml: package-dir = {"" = "src"}
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from data.loader import stream_candidates
from data.validator import stream_valid_candidates
from preprocessing.feature_extractor import extract_all_features
from embeddings.embedder import CandidateEmbedder, build_candidate_text
from retrieval.dense_search import DenseRetriever
from ranking.scorer import HybridRanker
from explainability.explainer import CandidateExplainer
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

def run_inference(data_path: str, output_path: str, manifest_path: str):
    """
    End-to-end inference script. Reads the dataset, scores all candidates,
    and outputs the Top-100 ranked list with explainability payloads to JSON.
    """
    logger.info("Starting Inference Pipeline...")
    
    start_time = time.time()
    
    t0 = time.time()
    
    # Initialize components
    embedder = CandidateEmbedder()
    retriever = DenseRetriever()
    ranker = HybridRanker()
    explainer = CandidateExplainer()
    
    raw_stream = stream_candidates(data_path)
    valid_stream = stream_valid_candidates(raw_stream)
    
    candidates_features = {}
    
    embed_dir = settings.DATA_EMBEDDINGS_DIR
    os.makedirs(embed_dir, exist_ok=True)
    embeddings_file = os.path.join(embed_dir, "embeddings.npy")
    ids_file = os.path.join(embed_dir, "candidate_ids.npy")
    meta_file = os.path.join(embed_dir, "metadata.json")
    faiss_file = os.path.join(embed_dir, "candidates.faiss")
    
    cache_valid = False
    if os.path.exists(embeddings_file) and os.path.exists(ids_file) and os.path.exists(faiss_file) and os.path.exists(meta_file):
        with open(meta_file, 'r', encoding='utf-8') as f:
            meta = json.load(f)
            if meta.get("dataset") == os.path.basename(data_path) and meta.get("model") == settings.EMBEDDING_MODEL_NAME:
                cache_valid = True
                
    if cache_valid:
        logger.info("Cache is valid. Loading FAISS index and IDs from disk...")
        retriever.load_index(faiss_file, ids_file)
        
        logger.info("Extracting features from stream (skipping embeddings)...")
        for cand in valid_stream:
            features = extract_all_features(cand)
            candidates_features[features["candidate_id"]] = features
            
    else:
        logger.info("Extracting features, embedding, and building search index...")
        
        batch_size = settings.BATCH_SIZE
        batch_ids = []
        batch_texts = []
        all_embeddings = []
        all_ids = []
        
        for cand in valid_stream:
            features = extract_all_features(cand)
            cid = features["candidate_id"]
            candidates_features[cid] = features
            
            batch_ids.append(cid)
            batch_texts.append(build_candidate_text(cand))
            
            if len(batch_ids) >= batch_size:
                batch_embeddings = embedder.embed_texts(batch_texts)
                retriever.add_to_index(batch_ids, batch_embeddings)
                
                all_embeddings.extend(batch_embeddings)
                all_ids.extend(batch_ids)
                
                batch_ids.clear()
                batch_texts.clear()
                
        if batch_ids:
            batch_embeddings = embedder.embed_texts(batch_texts)
            retriever.add_to_index(batch_ids, batch_embeddings)
            all_embeddings.extend(batch_embeddings)
            all_ids.extend(batch_ids)
            batch_ids.clear()
            batch_texts.clear()
            
        logger.info("Saving embeddings and FAISS index to cache...")
        try:
            import numpy as np
            np.save(embeddings_file, np.array(all_embeddings, dtype=np.float32))
            np.save(ids_file, np.array(all_ids))
        except ImportError:
            import pickle
            with open(embeddings_file, "wb") as f:
                pickle.dump(all_embeddings, f)
            with open(ids_file, "wb") as f:
                pickle.dump(all_ids, f)
                
        retriever.save_index(faiss_file)
        
        with open(meta_file, 'w', encoding='utf-8') as f:
            json.dump({
                "model": settings.EMBEDDING_MODEL_NAME,
                "dataset": os.path.basename(data_path),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }, f)
            
    t1 = time.time()
    logger.info(f"[Timer] Caching & Feature Extraction took {t1 - t0:.2f} seconds.")
    
    from core.job_parser import JobParser
    
    logger.info("Parsing Job Description...")
    # Assume JD is in raw dir or a specific path, for now use a default
    jd_path = os.path.join(settings.DATA_RAW_DIR, "job_description.docx")
    job_parser = JobParser(jd_path)
    structured_job = job_parser.parse()
    query = structured_job["semantic_query"]
    
    t2 = time.time()
    logger.info(f"[Timer] Job Parsing took {t2 - t1:.2f} seconds.")
    
    logger.info(f"Retrieving top {settings.TOP_K_DENSE} candidates for generated query.")
    logger.info(f"Query snapshot: {query[:100]}...")
    q_emb = embedder.embed_texts([query])
    search_results = retriever.search(q_emb, top_k=settings.TOP_K_DENSE)
    
    logger.info(f"Applying retrieval metadata and skill filters to top {settings.TOP_K_DENSE}...")
    req_skills = set(s.lower() for s in structured_job.get("skills", []))
    req_exp = structured_job.get("experience_years") or 0
    req_ind = structured_job.get("industry", "").lower()
    
    filtered_results = []
    for cid, semantic_score in search_results:
        feat = candidates_features.get(cid, {})
        
        # Soft Metadata Filtering Score
        filter_score = semantic_score * 0.4
        
        # Skill matching
        cand_skills = feat.get("raw_skills", [])
        if req_skills and cand_skills:
            match_count = sum(1 for req_s in req_skills if any(req_s in cand_s for cand_s in cand_skills))
            skill_ratio = match_count / len(req_skills)
            filter_score += (skill_ratio * 0.3)
            
        # Experience matching
        yoe = feat.get("years_of_experience")
        if yoe is not None and req_exp:
            if float(yoe) >= req_exp:
                filter_score += 0.2
            elif float(yoe) >= req_exp - 2:
                filter_score += 0.1
                
        # Industry matching
        cand_ind = feat.get("industry", "")
        if req_ind and cand_ind and (req_ind in cand_ind or cand_ind in req_ind):
            filter_score += 0.1
                
        filtered_results.append((cid, filter_score, semantic_score))
        
    filtered_results.sort(key=lambda x: x[1], reverse=True)
    top_candidates = filtered_results[:settings.TOP_K_PRE_RANK]
    
    t3 = time.time()
    logger.info(f"[Timer] Dense Retrieval & Filtering took {t3 - t2:.2f} seconds.")
    
    logger.info(f"Filtered down to Top {settings.TOP_K_PRE_RANK} candidates. Scoring and Ranking...")
    semantic_scores = {cid: sem_score for cid, _, sem_score in top_candidates}
    candidates_to_score = {cid: candidates_features[cid] for cid in semantic_scores.keys()}
    final_rankings = ranker.score_candidates(candidates_to_score, semantic_scores, structured_job)
    
    t4 = time.time()
    logger.info(f"[Timer] Hybrid Ranking took {t4 - t3:.2f} seconds.")
    
    logger.info(f"Generating explanations for Top {settings.TOP_K_FINAL}...")
    top_100 = final_rankings[:settings.TOP_K_FINAL]
    for rank in top_100:
        cid = rank["candidate_id"]
        raw_feat = candidates_features[cid]
        explanation = explainer.generate_explanation(rank, raw_feat, structured_job)
        rank["reasons"] = explanation
        
    t5 = time.time()
    logger.info(f"[Timer] Explainability generation took {t5 - t4:.2f} seconds.")
    
    total_time = time.time() - start_time
    logger.info(f"[Timer] Total End-to-End Pipeline took {total_time:.2f} seconds.")
    
    # Write submission file
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"results": top_100}, f, indent=2)
    logger.info(f"Submission file saved to {output_path}")
    
    # Write manifest file
    manifest = {
        "dataset_version": os.path.basename(data_path),
        "model_used": settings.EMBEDDING_MODEL_NAME,
        "run_timestamp_utc": datetime.utcnow().isoformat() + "Z",
        "total_candidates_processed": len(candidates_features),
        "end_to_end_latency_seconds": round(total_time, 2)
    }
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    logger.info(f"Manifest file saved to {manifest_path}")
    
    print("\nInference complete. Artifacts generated successfully.")

if __name__ == "__main__":
    # Use default paths, can be overridden via CLI args in production
    data_path = sys.argv[1] if len(sys.argv) > 1 else "E:/India Run Hackathon/India_runs_data_and_ai_challenge/candidates.jsonl"
    out_path = sys.argv[2] if len(sys.argv) > 2 else "E:/India Run Hackathon/India_runs_data_and_ai_challenge/outputs/submission.json"
    man_path = sys.argv[3] if len(sys.argv) > 3 else "E:/India Run Hackathon/India_runs_data_and_ai_challenge/outputs/manifest.json"
    
    run_inference(data_path, out_path, man_path)
