from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class JobCreateRequest(BaseModel):
    title: str
    description_text: str


class JobResponse(BaseModel):
    job_id: str
    title: str
    structured_job: Dict[str, Any]
    source_file_path: Optional[str] = None
    created_at: str


class JobListResponse(BaseModel):
    status: str
    message: str
    data: List[JobResponse]


class JobDetailResponse(BaseModel):
    status: str
    message: str
    data: JobResponse


class ExistingMatchesPage(BaseModel):
    results: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int


class ExistingMatchesResponse(BaseModel):
    status: str
    message: str
    data: ExistingMatchesPage
