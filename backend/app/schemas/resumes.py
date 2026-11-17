from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class ResumeRecordResponse(BaseModel):
    resume_id: str
    job_id: Optional[str] = None
    original_filename: str
    status: str
    candidate: Optional[Dict[str, Any]] = None
    score_result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str
    updated_at: str


class ResumeUploadResponse(BaseModel):
    status: str
    message: str
    data: ResumeRecordResponse


class ResumeListResponse(BaseModel):
    status: str
    message: str
    data: List[ResumeRecordResponse]
