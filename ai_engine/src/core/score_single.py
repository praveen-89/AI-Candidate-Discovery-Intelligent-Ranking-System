from typing import Dict, Any, List

from preprocessing.feature_extractor import extract_all_features
from embeddings.embedder import build_candidate_text
from ranking.scorer import HybridRanker
from explainability.explainer import CandidateExplainer
from utils.logger import get_logger

logger = get_logger(__name__)


def score_candidate_against_job(
    candidate_record: Dict[str, Any],
    structured_job: Dict[str, Any],
    job_embedding: List[float],
    embedder,
) -> Dict[str, Any]:
    """
    Scores a single candidate (e.g. a freshly parsed resume) against a single job,
    without touching the 100k base pool, the FAISS cache rebuild path, or any
    streaming/batch logic. Intended for the real-time "upload one resume, get one
    score" flow.

    `job_embedding` should be precomputed once per job (e.g. when the job is created)
    and reused across every resume scored against it, so this call only pays the cost
    of embedding the one candidate.
    """
    candidate_id = candidate_record["candidate_id"]

    features = extract_all_features(candidate_record)
    candidate_text = build_candidate_text(candidate_record)
    candidate_embedding = embedder.embed_texts([candidate_text])[0]

    semantic_score = max(0.0, min(1.0, sum(a * b for a, b in zip(candidate_embedding, job_embedding))))

    ranker = HybridRanker()
    ranked = ranker.score_candidates(
        {candidate_id: features},
        {candidate_id: semantic_score},
        structured_job,
    )
    result = ranked[0]

    explainer = CandidateExplainer()
    result["reasons"] = explainer.generate_explanation(result, features, structured_job)
    result["embedding"] = candidate_embedding
    result["features"] = features
    return result
