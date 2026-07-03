import os
import sys
import time
import json
import gc
import hashlib
from datetime import datetime

def get_file_checksum(filepath: str) -> str:
    hash_md5 = hashlib.md5()
    if os.path.exists(filepath):
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
    return hash_md5.hexdigest()

# Compute paths relative to the monorepo root
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_AI_ENGINE_DIR = os.path.abspath(os.path.join(_SCRIPT_DIR, ".."))
_ROOT_DIR = os.path.abspath(os.path.join(_AI_ENGINE_DIR, ".."))

# Ensure the src directory is on the path so imports resolve correctly
sys.path.insert(0, os.path.join(_AI_ENGINE_DIR, "src"))

# Ensure the working directory is the repo root so relative config paths resolve
os.chdir(_ROOT_DIR)

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
    ids_file = os.path.join(embed_dir, "candidate_ids.npy")
    meta_file = os.path.join(embed_dir, "metadata.json")
    faiss_file = os.path.join(embed_dir, "candidates.faiss")
    mock_file = faiss_file + ".mock"
    
    from retrieval.dense_search import HAS_FAISS
    
    dataset_checksum = get_file_checksum(data_path)
    
    cache_valid = False
    cache_reason = "Cache files missing"
    has_index_file = os.path.exists(faiss_file) or os.path.exists(mock_file)
    expected_count = "Unknown"
    
    if os.path.exists(ids_file) and has_index_file and os.path.exists(meta_file):
        try:
            with open(meta_file, 'r', encoding='utf-8') as f:
                meta = json.load(f)
                
            expected_count = meta.get("candidate_count", "Unknown")
            
            if meta.get("cache_version") != 2:
                cache_reason = f"Cache version mismatch\nExpected\n2\nFound\n{meta.get('cache_version')}"
            elif meta.get("dataset_checksum") != dataset_checksum:
                cache_reason = f"Dataset checksum mismatch\nExpected\n{dataset_checksum}\nFound\n{meta.get('dataset_checksum')}"
            elif meta.get("model") != settings.EMBEDDING_MODEL_NAME:
                cache_reason = f"Model changed\nExpected\n{settings.EMBEDDING_MODEL_NAME}\nFound\n{meta.get('model')}"
            elif meta.get("embedding_dimension") != settings.EMBEDDING_DIMENSION:
                cache_reason = f"Embedding dimension changed\nExpected\n{settings.EMBEDDING_DIMENSION}\nFound\n{meta.get('embedding_dimension')}"
            elif meta.get("faiss_enabled") != HAS_FAISS:
                cache_reason = f"FAISS mode changed\nExpected\n{HAS_FAISS}\nFound\n{meta.get('faiss_enabled')}"
            else:
                expected_c = meta.get("candidate_count", -1)
                try:
                    import numpy as np
                    candidate_ids_len = len(np.load(ids_file, allow_pickle=True))
                except Exception as e:
                    logger.warning(f"Failed to load numpy array from {ids_file}", exc_info=True)
                    import pickle
                    try:
                        with open(ids_file, "rb") as f:
                            candidate_ids_len = len(pickle.load(f))
                    except Exception as e:
                        logger.warning(f"Failed to load pickle array from {ids_file}", exc_info=True)
                        candidate_ids_len = -1
                
                if candidate_ids_len != expected_c:
                    cache_reason = f"Candidate count mismatch\nExpected\n{expected_c}\nFound\n{candidate_ids_len}"
                else:
                    if HAS_FAISS:
                        import faiss
                        try:
                            idx = faiss.read_index(faiss_file)
                            index_ntotal = idx.ntotal
                        except Exception as e:
                            logger.warning(f"Failed to read FAISS index from {faiss_file}", exc_info=True)
                            index_ntotal = -1
                        if index_ntotal != expected_c:
                            cache_reason = f"FAISS vectors mismatch\nExpected\n{expected_c}\nFound\n{index_ntotal}"
                        else:
                            cache_valid = True
                            cache_reason = "VALID"
                    else:
                        cache_valid = True
                        cache_reason = "VALID"
        except Exception as e:
            logger.exception("Failed to parse metadata.json")
            cache_reason = "Failed to parse metadata.json"

    print("\n" + "="*30)
    print("AI ENGINE STARTUP")
    print("="*30)
    print(f"Dataset\n{data_path}")
    print(f"Candidates\n{expected_count}")
    print(f"Batch Size\n{settings.BATCH_SIZE}")
    print(f"Embedding Model\n{settings.EMBEDDING_MODEL_NAME}")
    print(f"FAISS\n{'Enabled' if HAS_FAISS else 'Disabled (Mock Mode)'}")
    print(f"Cache\n{'VALID' if cache_valid else 'INVALID'}")
    if not cache_valid:
        print(f"Reason\n{cache_reason}")
    print("="*30 + "\n")
                
                
    if cache_valid:
        logger.info("Cache is valid. Loading FAISS index and IDs from disk...")
        retriever.load_index(faiss_file, ids_file)
        
        logger.info("Extracting features from stream (skipping embeddings)...")
        for cand in valid_stream:
            features = extract_all_features(cand)
            candidates_features[features["candidate_id"]] = features
            
    else:
        logger.info(f"Rebuilding cache. Reason:\n{cache_reason}")
        
        batch_size = settings.BATCH_SIZE
        batch_ids = []
        batch_texts = []
        all_ids = []
        
        total_streamed = 0
        total_valid = 0
        total_embedded = 0
        total_indexed = 0
        batch_num = 1
        
        def counting_raw_stream(stream):
            for cand in stream:
                nonlocal total_streamed
                total_streamed += 1
                yield cand
                
        counted_valid_stream = stream_valid_candidates(counting_raw_stream(raw_stream))
        
        for cand in counted_valid_stream:
            total_valid += 1
            features = extract_all_features(cand)
            cid = features["candidate_id"]
            candidates_features[cid] = features
            
            batch_ids.append(cid)
            batch_texts.append(build_candidate_text(cand))
            
            if len(batch_ids) >= batch_size:
                batch_embeddings = embedder.embed_texts(batch_texts)
                total_embedded += len(batch_embeddings)
                
                retriever.add_to_index(batch_ids, batch_embeddings)
                total_indexed += len(batch_embeddings)
                
                all_ids.extend(batch_ids)
                
                print(f"Batch {batch_num}\nIndexed\n{len(batch_embeddings)}\nTotal\n{total_indexed}")
                batch_num += 1
                
                batch_ids.clear()
                batch_texts.clear()
                del batch_embeddings
                gc.collect()
                
        if batch_ids:
            batch_embeddings = embedder.embed_texts(batch_texts)
            total_embedded += len(batch_embeddings)
            
            retriever.add_to_index(batch_ids, batch_embeddings)
            total_indexed += len(batch_embeddings)
            
            all_ids.extend(batch_ids)
            
            print(f"Final Batch\nIndexed\n{len(batch_embeddings)}\nTotal\n{total_indexed}")
            
            batch_ids.clear()
            batch_texts.clear()
            del batch_embeddings
            gc.collect()
            
        total_saved_ids = len(all_ids)
        print("\n==============================")
        print("DATASET VERIFICATION")
        print("==============================")
        print(f"Candidates streamed\n{total_streamed}")
        print(f"Valid\n{total_valid}")
        print(f"Embedded\n{total_embedded}")
        print(f"Indexed\n{total_indexed}")
        print(f"IDs saved\n{total_saved_ids}")
        print("==============================\n")
            
        logger.info("Saving FAISS index and IDs to cache...")
        logger.info("Entering cache-saving block.")
        logger.info(f"faiss_file: {faiss_file}")
        logger.info(f"ids_file: {ids_file}")
        logger.info(f"meta_file: {meta_file}")
        logger.info(f"HAS_FAISS: {HAS_FAISS}")
        if HAS_FAISS:
            logger.info(f"retriever.index.ntotal before save: {retriever.index.ntotal}")

        try:
            import numpy as np
            np.save(ids_file, np.array(all_ids))
        except Exception as e:
            logger.exception("Failed to save numpy array for IDs")
            raise
                
        retriever.save_index(faiss_file)
        
        # Cleanup obsolete files
        obsolete_npy = os.path.join(embed_dir, "embeddings.npy")
        if os.path.exists(obsolete_npy):
            os.remove(obsolete_npy)
            
        if HAS_FAISS and os.path.exists(mock_file):
            os.remove(mock_file)
        
        try:
            with open(meta_file, 'w', encoding='utf-8') as f:
                json.dump({
                    "cache_version": 2,
                    "dataset": os.path.basename(data_path),
                    "dataset_checksum": dataset_checksum,
                    "candidate_count": len(all_ids),
                    "embedding_dimension": settings.EMBEDDING_DIMENSION,
                    "model": settings.EMBEDDING_MODEL_NAME,
                    "faiss_enabled": HAS_FAISS,
                    "created_at": datetime.utcnow().isoformat() + "Z"
                }, f, indent=2)
        except Exception as e:
            logger.exception("Failed to write metadata.json")
            raise
            
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
    data_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(_ROOT_DIR, "datasets", "raw", "candidates.jsonl")
    out_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(_ROOT_DIR, "ai_engine", "outputs", "submission.json")
    man_path = sys.argv[3] if len(sys.argv) > 3 else os.path.join(_ROOT_DIR, "ai_engine", "outputs", "manifest.json")
    
    run_inference(data_path, out_path, man_path)
