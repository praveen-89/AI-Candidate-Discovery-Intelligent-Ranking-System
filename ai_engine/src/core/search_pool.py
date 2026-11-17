from typing import Any, Dict, List

from ranking.scorer import HybridRanker
from explainability.explainer import CandidateExplainer
from utils.logger import get_logger

logger = get_logger(__name__)


def search_existing_pool(
    structured_job: Dict[str, Any],
    job_embedding: List[float],
    retriever,
    base_features: Dict[str, Dict[str, Any]],
    top_k_dense: int = 500,
    offset: int = 0,
    limit: int = 10,
) -> Dict[str, Any]:
    """
    Finds and ranks existing base-pool candidates against a job, using the
    already-warm FAISS index and pre-extracted features — no re-streaming or
    re-embedding of the 100k dataset. Paginated via `offset`/`limit`; `total`
    in the return value is the number of ranked candidates available (capped
    at `top_k_dense`), for computing page count. Re-ranks on every call
    (a few ms against the warm index — not worth caching).

    1. Dense-retrieve the `top_k_dense` most semantically similar candidate
       vectors from the live index (this also reaches any previously
       uploaded resumes added to the same index, but those are skipped below
       since they have no entry in `base_features` — this function is
       specifically "search the existing pool").
    2. Score every retrieved candidate with the same HybridRanker used
       everywhere else, so results are directly comparable to uploaded-resume
       scores.
    3. Slice out just the requested page (`offset`/`limit`) and generate the
       explanation payload only for that page — not the whole ranked list.
    """
    # DenseRetriever.search expects a batch (list of embeddings); job_embedding
    # here is a single already-unwrapped vector from ai_runtime's per-job cache.
    search_results = retriever.search([job_embedding], top_k=top_k_dense)

    candidates_features: Dict[str, Dict[str, Any]] = {}
    semantic_scores: Dict[str, float] = {}
    for candidate_id, semantic_score in search_results:
        features = base_features.get(candidate_id)
        if features is None:
            continue  # not in the base pool (e.g. a previously uploaded resume) — skip
        candidates_features[candidate_id] = features
        semantic_scores[candidate_id] = semantic_score

    if not candidates_features:
        logger.warning("search_existing_pool found no base-pool candidates in the retrieved set.")
        return {"results": [], "total": 0}

    ranker = HybridRanker()
    ranked = ranker.score_candidates(candidates_features, semantic_scores, structured_job)
    total = len(ranked)
    page = ranked[offset:offset + limit]

    explainer = CandidateExplainer()
    for result in page:
        features = candidates_features[result["candidate_id"]]
        result["reasons"] = explainer.generate_explanation(result, features, structured_job)

    return {"results": page, "total": total}
