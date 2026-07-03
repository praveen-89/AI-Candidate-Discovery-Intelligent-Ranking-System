from typing import Dict, Any, List
from utils.logger import get_logger

logger = get_logger(__name__)

# Required top-level keys based on schema
REQUIRED_KEYS = {
    "candidate_id",
    "profile",
    "career_history",
    "education",
    "skills",
    "redrob_signals"
}

def is_valid_candidate(cand: Dict[str, Any]) -> bool:
    """
    Lightweight validation to ensure the candidate has the minimum required structure
    so downstream feature engineering does not crash.
    """
    # Check top level keys
    missing_keys = REQUIRED_KEYS - cand.keys()
    if missing_keys:
        logger.debug(f"Candidate missing top-level keys: {missing_keys}")
        return False
        
    # Check that candidate_id exists and is a string
    cand_id = cand.get("candidate_id")
    if not cand_id or not isinstance(cand_id, str):
        return False
        
    return True

def filter_valid_candidates(candidates_stream) -> GeneratorExit: # We will use a regular generator
    pass # Replaced by below generator

def stream_valid_candidates(candidates_stream):
    """
    Takes an iterator of candidate dictionaries and yields only those
    that pass basic validation.
    """
    dropped = 0
    for cand in candidates_stream:
        if is_valid_candidate(cand):
            yield cand
        else:
            dropped += 1
            
    if dropped > 0:
        logger.warning(f"Dropped {dropped} invalid candidates during stream processing.")
