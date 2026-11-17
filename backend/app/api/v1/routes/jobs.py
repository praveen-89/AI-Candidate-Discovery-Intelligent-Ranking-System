from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.dependencies import AuthContext, get_current_user
from app.schemas.jobs import JobCreateRequest, JobListResponse, JobDetailResponse, ExistingMatchesResponse
from app.schemas.resumes import ResumeListResponse
from app.services.job_service import JobService
from app.utils.helpers import format_response

router = APIRouter()


@router.post("", response_model=JobDetailResponse, status_code=201)
async def create_job(payload: JobCreateRequest, auth: AuthContext = Depends(get_current_user)) -> JobDetailResponse:
    """
    Creates a job (company requirement) from pasted description text, parses it
    into skills/experience/semantic query, and stores it for resumes to be scored
    against.
    """
    job = JobService.create_job(auth.client, auth.user_id, title=payload.title, description_text=payload.description_text)
    return JobDetailResponse(**format_response(data=job, message="Job created successfully."))


@router.post("/upload", response_model=JobDetailResponse, status_code=201)
async def create_job_from_file(
    title: str = Form(...),
    file: UploadFile = File(...),
    auth: AuthContext = Depends(get_current_user),
) -> JobDetailResponse:
    """
    Creates a job from an uploaded job-description file (.pdf/.docx/.txt) instead
    of pasted text — same parsing/storage as `POST /jobs`.
    """
    content = await file.read()
    job = JobService.create_job_from_file(
        auth.client, auth.user_id, title=title, original_filename=file.filename or "job_description", content=content
    )
    return JobDetailResponse(**format_response(data=job, message="Job created successfully from uploaded file."))


@router.get("", response_model=JobListResponse, status_code=200)
async def list_jobs(auth: AuthContext = Depends(get_current_user)) -> JobListResponse:
    """
    Lists the signed-in user's jobs.
    """
    jobs = JobService.list_jobs(auth.client)
    return JobListResponse(**format_response(data=jobs, message="Jobs retrieved successfully."))


@router.get("/{job_id}", response_model=JobDetailResponse, status_code=200)
async def get_job(job_id: str, auth: AuthContext = Depends(get_current_user)) -> JobDetailResponse:
    """
    Fetches a single job by id (only if it belongs to the signed-in user).
    """
    job = JobService.get_job(auth.client, job_id)
    return JobDetailResponse(**format_response(data=job, message="Job retrieved successfully."))


@router.get("/{job_id}/results", response_model=ResumeListResponse, status_code=200)
async def get_job_results(job_id: str, auth: AuthContext = Depends(get_current_user)) -> ResumeListResponse:
    """
    Lists every resume scored against this job, best score first.
    """
    results = JobService.get_results_for_job(auth.client, job_id)
    return ResumeListResponse(**format_response(data=results, message="Job results retrieved successfully."))


@router.get("/{job_id}/existing-matches", response_model=ExistingMatchesResponse, status_code=200)
async def get_existing_matches(
    job_id: str,
    page: int = 1,
    page_size: int = 10,
    auth: AuthContext = Depends(get_current_user),
) -> ExistingMatchesResponse:
    """
    Searches and ranks existing base-pool (100k) candidates against this job —
    no upload required. Uses the already-warm FAISS index + base features.
    Paginated: `page` (1-indexed) and `page_size` (default 10, max 100).
    """
    page_data = JobService.search_existing_candidates(auth.client, job_id, page=page, page_size=page_size)
    return ExistingMatchesResponse(**format_response(data=page_data, message="Existing candidate matches retrieved successfully."))
