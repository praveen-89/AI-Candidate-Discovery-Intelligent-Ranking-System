import os
import sys
import time
import json
import tracemalloc
from typing import List, Dict, Any

# Ensure project root is on the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

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

def evaluate_pipeline(data_path: str, max_samples: int = None):
    """
    Runs the full end-to-end pipeline and tracks memory and latency
    to ensure the hackathon constraints (<16GB RAM, <5min) are met.
    """
    logger.info("Starting Evaluation Pipeline...")
    
    tracemalloc.start()
    start_time = time.time()
    
    # Initialize components
    embedder = CandidateEmbedder()
    retriever = DenseRetriever()
    ranker = HybridRanker()
    explainer = CandidateExplainer()
    
    raw_stream = stream_candidates(data_path)
    valid_stream = stream_valid_candidates(raw_stream)
    
    candidates_features = {}
    candidate_ids = []
    texts = []
    
    # 1. Processing and Feature Extraction
    proc_start = time.time()
    for i, cand in enumerate(valid_stream):
        if max_samples and i >= max_samples:
            break
        features = extract_all_features(cand)
        cid = features["candidate_id"]
        candidates_features[cid] = features
        candidate_ids.append(cid)
        texts.append(build_candidate_text(cand))
    proc_time = time.time() - proc_start
    
    # 2. Embedding
    embed_start = time.time()
    embeddings = embedder.embed_texts(texts)
    embed_time = time.time() - embed_start
    
    # 3. Indexing
    index_start = time.time()
    retriever.build_index(candidate_ids, embeddings)
    index_time = time.time() - index_start
    
    # 4. Search and Retrieval
    query = "Senior AI Engineer Python Vector Databases"
    q_emb = embedder.embed_texts([query])
    search_start = time.time()
    search_results = retriever.search(q_emb, top_k=settings.TOP_K_DENSE)
    search_time = time.time() - search_start
    
    # 5. Ranking
    semantic_scores = {cid: score for cid, score in search_results}
    candidates_to_score = {cid: candidates_features[cid] for cid in semantic_scores.keys()}
    
    rank_start = time.time()
    final_rankings = ranker.score_candidates(candidates_to_score, semantic_scores)
    rank_time = time.time() - rank_start
    
    # 6. Explainability
    explain_start = time.time()
    top_100 = final_rankings[:settings.TOP_K_FINAL]
    for rank in top_100:
        cid = rank["candidate_id"]
        raw_feat = candidates_features[cid]
        explanation = explainer.generate_explanation(rank, raw_feat)
        rank["reasons"] = explanation
    explain_time = time.time() - explain_start
    
    total_time = time.time() - start_time
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    peak_mb = peak / 1024 / 1024
    
    # Report Generation
    print("\n" + "="*50)
    print("EVALUATION REPORT")
    print("="*50)
    print(f"Total Candidates Processed: {len(candidate_ids)}")
    print(f"Constraints Check:")
    print(f"  - Peak Memory Usage: {peak_mb:.2f} MB (Limit: 16000 MB) -> {'PASS' if peak_mb < 16000 else 'FAIL'}")
    print(f"  - End-to-End Latency: {total_time:.2f} s (Limit: 300 s) -> {'PASS' if total_time < 300 else 'FAIL'}")
    
    print("\nLatency Breakdown:")
    print(f"  - Feature Extraction: {proc_time:.4f} s")
    print(f"  - Embedding Gen:      {embed_time:.4f} s")
    print(f"  - FAISS Indexing:     {index_time:.4f} s")
    print(f"  - Dense Search:       {search_time:.4f} s")
    print(f"  - Hybrid Ranking:     {rank_time:.4f} s")
    print(f"  - Explanations:       {explain_time:.4f} s")
    
    if top_100:
        scores = [r["final_score"] for r in top_100]
        print("\nScore Distribution (Top 100):")
        print(f"  - Max:  {max(scores):.4f}")
        print(f"  - Min:  {min(scores):.4f}")
        print(f"  - Mean: {sum(scores)/len(scores):.4f}")
    
    print("="*50)

if __name__ == "__main__":
    # Test on a 5000 candidate sample by default for rapid validation
    data_path = "E:/India Run Hackathon/India_runs_data_and_ai_challenge/candidates.jsonl"
    evaluate_pipeline(data_path, max_samples=5000)
