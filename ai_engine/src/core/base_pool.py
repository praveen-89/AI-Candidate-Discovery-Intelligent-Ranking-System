import os
import json
import hashlib
from typing import Dict, Any, Optional

from config.settings import settings
from utils.logger import get_logger
from data.loader import stream_candidates
from data.validator import stream_valid_candidates
from preprocessing.feature_extractor import extract_all_features

logger = get_logger(__name__)

FEATURES_CACHE_VERSION = 1


def _get_file_checksum(filepath: str) -> str:
    hash_md5 = hashlib.md5()
    if os.path.exists(filepath):
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
    return hash_md5.hexdigest()


def _default_paths(data_path: Optional[str], cache_path: Optional[str]):
    data_path = data_path or os.path.join(settings.DATA_RAW_DIR, "candidates.jsonl")
    cache_path = cache_path or os.path.join(settings.DATA_EMBEDDINGS_DIR, "features_cache.json")
    return data_path, cache_path


def get_base_candidate_features(
    data_path: Optional[str] = None,
    cache_path: Optional[str] = None,
    force_rebuild: bool = False,
) -> Dict[str, Dict[str, Any]]:
    """
    Returns {candidate_id: features} for the entire base candidate pool
    (datasets/raw/candidates.jsonl), extracted via `extract_all_features`.

    This is independent of the FAISS embeddings cache used by
    ai_engine/scripts/inference.py — it only covers the cheap, numeric/boolean
    feature-extraction step (no embedding), so a long-lived backend process can load
    it once at startup instead of re-streaming 100k JSONL rows on every request.
    """
    data_path, cache_path = _default_paths(data_path, cache_path)
    checksum = _get_file_checksum(data_path)

    if not force_rebuild and os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                payload = json.load(f)
            if (
                payload.get("cache_version") == FEATURES_CACHE_VERSION
                and payload.get("dataset_checksum") == checksum
            ):
                logger.info(f"Loaded base candidate features cache from {cache_path} ({len(payload.get('features', {}))} candidates).")
                return payload["features"]
            logger.info("Base features cache is stale (checksum/version mismatch); rebuilding.")
        except Exception:
            logger.exception(f"Failed to load features cache from {cache_path}; rebuilding.")

    logger.info(f"Building base candidate features cache from {data_path}...")
    features: Dict[str, Dict[str, Any]] = {}
    raw_stream = stream_candidates(data_path)
    valid_stream = stream_valid_candidates(raw_stream)
    for cand in valid_stream:
        feat = extract_all_features(cand)
        features[feat["candidate_id"]] = feat

    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump({
                "cache_version": FEATURES_CACHE_VERSION,
                "dataset_checksum": checksum,
                "candidate_count": len(features),
                "features": features,
            }, f)
        logger.info(f"Saved base candidate features cache to {cache_path} ({len(features)} candidates).")
    except Exception:
        logger.exception(f"Failed to write features cache to {cache_path} (continuing without persisting it).")

    return features
