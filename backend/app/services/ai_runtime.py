"""
Long-lived, in-process AI engine runtime: embedding model, FAISS index, and the
base 100k candidate pool's extracted features, all loaded once and kept warm for
the backend process's lifetime.

This exists so a resume upload can be parsed, embedded, and scored in real time
(sub-second to a couple of seconds) instead of paying model-load and full-dataset
re-streaming costs on every request, which is what the old subprocess-based
`/rank` endpoint does (and still does, for the "rebuild everything" admin path).
"""

import os
import threading

from app.core import ai_engine_bootstrap  # noqa: F401 (import side effect: sys.path + env)
from app.core.logging import get_logger

logger = get_logger(__name__)

_lock = threading.Lock()
_embedder = None
_retriever = None
_base_features = None
_job_embedding_cache: dict = {}


def init_runtime() -> None:
    """
    Loads the embedder, FAISS index, and base candidate features into memory.
    Safe to call multiple times (a no-op after the first successful call).
    """
    global _embedder, _retriever, _base_features

    if _embedder is not None and _retriever is not None and _base_features is not None:
        return

    with _lock:
        if _embedder is not None and _retriever is not None and _base_features is not None:
            return

        from config.settings import settings as ai_settings
        from embeddings.embedder import CandidateEmbedder
        from retrieval.dense_search import DenseRetriever
        from core.base_pool import get_base_candidate_features

        logger.info("Initializing AI engine runtime (embedder + FAISS index + base features)...")

        embedder = CandidateEmbedder()

        retriever = DenseRetriever()
        faiss_path = os.path.join(ai_settings.DATA_EMBEDDINGS_DIR, "candidates.faiss")
        ids_path = os.path.join(ai_settings.DATA_EMBEDDINGS_DIR, "candidate_ids.npy")
        if os.path.exists(faiss_path) and os.path.exists(ids_path):
            retriever.load_index(faiss_path, ids_path)
        else:
            logger.warning(
                "FAISS cache not found at %s. Retriever starts empty — run "
                "ai_engine/scripts/inference.py once to build the base 100k index.",
                faiss_path,
            )

        base_features = get_base_candidate_features()

        _embedder = embedder
        _retriever = retriever
        _base_features = base_features

        vector_count = retriever.index.ntotal if getattr(retriever, "index", None) is not None else len(getattr(retriever, "mock_db", []))
        logger.info(f"AI engine runtime ready. base_features={len(base_features)} indexed_vectors={vector_count}")


def get_embedder():
    init_runtime()
    return _embedder


def get_retriever():
    init_runtime()
    return _retriever


def get_base_features() -> dict:
    init_runtime()
    return _base_features


def get_or_embed_job_query(job_id: str, semantic_query: str):
    """
    Returns the cached embedding for a job's semantic query, embedding it once on
    first use. Every resume scored against this job reuses the same job embedding
    instead of re-embedding the job description each time.
    """
    if job_id in _job_embedding_cache:
        return _job_embedding_cache[job_id]

    embedder = get_embedder()
    embedding = embedder.embed_texts([semantic_query])[0]
    _job_embedding_cache[job_id] = embedding
    return embedding


def invalidate_job_embedding(job_id: str) -> None:
    _job_embedding_cache.pop(job_id, None)


def persist_index() -> None:
    """
    Saves the live FAISS index + id mapping back to disk, e.g. after one or more
    resumes have been added to it, so the additions survive a process restart.
    """
    from config.settings import settings as ai_settings

    retriever = get_retriever()
    faiss_path = os.path.join(ai_settings.DATA_EMBEDDINGS_DIR, "candidates.faiss")
    ids_path = os.path.join(ai_settings.DATA_EMBEDDINGS_DIR, "candidate_ids.npy")
    retriever.persist(faiss_path, ids_path)
