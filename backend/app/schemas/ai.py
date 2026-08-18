from pydantic import BaseModel
from typing import Any, Dict, List, Optional

class StandardResponse(BaseModel):
    status: str
    message: str
    data: Optional[Any] = None

class RankResponse(BaseModel):
    status: str
    processing_time: float
    total_candidates: int
    top_candidates: int

class CacheStatusResponse(BaseModel):
    cache: bool
    vectors: int
    model: str
    dataset: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "cache": True,
                "vectors": 100000,
                "model": "BAAI/bge-small-en-v1.5",
                "dataset": "candidates.jsonl"
            }
        }
    }

class AIStatusResponse(BaseModel):
    engine: str
    cache: str
    vectors: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "engine": "ready",
                "cache": "loaded",
                "vectors": 100000
            }
        }
    }
