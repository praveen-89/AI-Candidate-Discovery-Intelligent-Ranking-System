import json
import os
from typing import Generator, Dict, Any
from config.settings import settings
from utils.logger import get_logger
from core.exceptions import DataValidationError

logger = get_logger(__name__)

def stream_candidates(file_path: str = None) -> Generator[Dict[str, Any], None, None]:
    """
    Streams candidates one by one from a JSONL file to minimize memory usage.
    Yields parsed JSON objects.
    """
    path = file_path or os.path.join(settings.DATA_RAW_DIR, "candidates.jsonl")
    
    if not os.path.exists(path):
        logger.error(f"Dataset not found at {path}")
        raise FileNotFoundError(f"Dataset not found at {path}")

    logger.info(f"Starting to stream candidates from {path}")
    
    processed = 0
    with open(path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            
            try:
                cand = json.loads(line)
                yield cand
                processed += 1
                
                # Log progress occasionally
                if processed % 20000 == 0:
                    logger.info(f"Streamed {processed} candidates so far...")
                    
            except json.JSONDecodeError as e:
                logger.exception(f"Failed to decode JSON on line {line_num}")
                continue

    logger.info(f"Finished streaming. Total candidates yielded: {processed}")

def stream_candidate_batches(file_path: str = None, batch_size: int = None) -> Generator[list, None, None]:
    """
    Streams candidates in batches to minimize memory footprint.
    """
    bs = batch_size or settings.BATCH_SIZE
    batch = []
    for cand in stream_candidates(file_path):
        batch.append(cand)
        if len(batch) >= bs:
            yield batch
            batch = []
    if batch:
        yield batch
