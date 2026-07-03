import os
import sys
import time
import json
import tracemalloc

# Ensure the src directory is on the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))

from data.loader import stream_candidates
from preprocessing.feature_extractor import extract_all_features
from embeddings.embedder import CandidateEmbedder, build_candidate_text
from retrieval.dense_search import DenseRetriever
from ranking.scorer import HybridRanker
from explainability.explainer import CandidateExplainer
from config.settings import settings
from core.job_parser import JobParser

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

def get_process_memory():
    if HAS_PSUTIL:
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024 # MB
    return 0

def get_cpu_percent():
    if HAS_PSUTIL:
        return psutil.cpu_percent(interval=None)
    return 0

def run_profiling(data_path: str, max_samples: int = 1024):
    print(f"Starting Profiling for {max_samples} candidates...")
    
    if HAS_PSUTIL:
        psutil.cpu_percent(interval=None) # Initialize
    
    results = {}
    
    # Initialize components
    embedder = CandidateEmbedder()
    retriever = DenseRetriever()
    ranker = HybridRanker()
    explainer = CandidateExplainer()
    
    # 1. Candidate Loading
    t0 = time.time()
    raw_stream = list(stream_candidates(data_path))[:max_samples]
    t1 = time.time()
    results["candidate_loading"] = {
        "total_time": t1 - t0,
        "count": len(raw_stream)
    }
    
    # 2. Feature Extraction
    t0 = time.time()
    candidates_features = {}
    for cand in raw_stream:
        feat = extract_all_features(cand)
        candidates_features[feat["candidate_id"]] = feat
    t1 = time.time()
    results["feature_extraction"] = {
        "total_time": t1 - t0,
        "count": len(raw_stream)
    }
    
    # 3. Candidate text generation
    t0 = time.time()
    texts = []
    ids = []
    for cand in raw_stream:
        texts.append(build_candidate_text(cand))
        ids.append(cand["candidate_id"])
    t1 = time.time()
    results["text_generation"] = {
        "total_time": t1 - t0,
        "count": len(raw_stream)
    }
    
    # 4. SentenceTransformer encoding
    batch_size = settings.BATCH_SIZE
    batches = [texts[i:i + batch_size] for i in range(0, len(texts), batch_size)]
    embeddings = []
    
    tracemalloc.start()
    t0 = time.time()
    for batch in batches:
        emb = embedder.embed_texts(batch)
        embeddings.extend(emb)
    t1 = time.time()
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    results["encoding"] = {
        "total_time": t1 - t0,
        "count": len(texts),
        "batches": len(batches),
        "peak_mem_mb": peak / 1024 / 1024
    }
    
    # 5. FAISS insertion
    t0 = time.time()
    for i in range(0, len(ids), batch_size):
        batch_ids = ids[i:i+batch_size]
        batch_embs = embeddings[i:i+batch_size]
        retriever.add_to_index(batch_ids, batch_embs)
    t1 = time.time()
    results["faiss_insertion"] = {
        "total_time": t1 - t0,
        "count": len(ids)
    }
    
    # 6. Cache serialization
    import tempfile
    with tempfile.TemporaryDirectory() as tmpdir:
        t0 = time.time()
        faiss_path = os.path.join(tmpdir, "index.faiss")
        retriever.save_index(faiss_path)
        
        # mock embeddings serialization
        import pickle
        with open(os.path.join(tmpdir, "emb.pkl"), "wb") as f:
            pickle.dump(embeddings, f)
        t1 = time.time()
    results["cache_serialization"] = {
        "total_time": t1 - t0,
        "count": len(ids)
    }
    
    # Parse JD for query
    jd_path = os.path.join(settings.DATA_RAW_DIR, "job_description.docx")
    job_parser = JobParser(jd_path)
    structured_job = job_parser.parse()
    query = structured_job["semantic_query"]
    q_emb = embedder.embed_texts([query])
    
    # 7. Retrieval
    t0 = time.time()
    search_results = retriever.search(q_emb, top_k=settings.TOP_K_DENSE)
    # mock filtering
    filtered_results = []
    for cid, semantic_score in search_results:
        filtered_results.append((cid, semantic_score * 0.4, semantic_score))
    filtered_results.sort(key=lambda x: x[1], reverse=True)
    top_candidates = filtered_results[:settings.TOP_K_PRE_RANK]
    t1 = time.time()
    results["retrieval"] = {
        "total_time": t1 - t0,
        "count": len(search_results)
    }
    
    # 8. Ranking
    semantic_scores = {cid: sem_score for cid, _, sem_score in top_candidates}
    candidates_to_score = {cid: candidates_features[cid] for cid in semantic_scores.keys()}
    t0 = time.time()
    final_rankings = ranker.score_candidates(candidates_to_score, semantic_scores, structured_job)
    t1 = time.time()
    results["ranking"] = {
        "total_time": t1 - t0,
        "count": len(candidates_to_score)
    }
    
    # 9. Explainability
    t0 = time.time()
    top_100 = final_rankings[:100]
    for rank in top_100:
        cid = rank["candidate_id"]
        raw_feat = candidates_features[cid]
        explainer.generate_explanation(rank, raw_feat, structured_job)
    t1 = time.time()
    results["explainability"] = {
        "total_time": t1 - t0,
        "count": len(top_100)
    }
    
    print(json.dumps(results, indent=2))
    
    with open("profiling_results.json", "w") as f:
        json.dump(results, f, indent=2)

if __name__ == "__main__":
    run_profiling("E:/India Run Hackathon/India_runs_data_and_ai_challenge/candidates.jsonl", 1024)
