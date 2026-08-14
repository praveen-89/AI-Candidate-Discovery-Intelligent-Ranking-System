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

class AIStatusResponse(BaseModel):
    engine: str
    cache: str
    vectors: int
