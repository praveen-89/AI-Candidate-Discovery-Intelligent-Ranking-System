from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.dependencies import AuthContext, get_current_user
from app.schemas.ai import StandardResponse
from app.schemas.resumes import ResumeUploadResponse
from app.services.resume_service import ResumeService
from app.utils.helpers import format_response

router = APIRouter()


@router.post("/upload", response_model=ResumeUploadResponse, status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    job_id: Optional[str] = Form(default=None),
    auth: AuthContext = Depends(get_current_user),
) -> ResumeUploadResponse:
    """
    Uploads a resume (.pdf/.docx/.txt), parses it into a structured candidate
    record, and — if `job_id` is provided — scores it against that job
    immediately and adds it to the live FAISS index.
    """
    content = await file.read()
    record = ResumeService.upload_and_score(
        auth.client,
        auth.user_id,
        original_filename=file.filename or "resume",
        content=content,
        job_id=job_id,
    )
    return ResumeUploadResponse(**format_response(data=record, message="Resume processed successfully."))


@router.get("/{resume_id}", response_model=ResumeUploadResponse, status_code=200)
async def get_resume(resume_id: str, auth: AuthContext = Depends(get_current_user)) -> ResumeUploadResponse:
    """
    Fetches a previously uploaded resume's parsed data and score (only if it
    belongs to the signed-in user).
    """
    record = ResumeService.get_resume(auth.client, resume_id)
    return ResumeUploadResponse(**format_response(data=record, message="Resume retrieved successfully."))


@router.delete("/{resume_id}", response_model=StandardResponse, status_code=200)
async def delete_resume(resume_id: str, auth: AuthContext = Depends(get_current_user)) -> StandardResponse:
    """
    Deletes an uploaded resume (its file and its DB row) — only if it belongs
    to the signed-in user.
    """
    ResumeService.delete_resume(auth.client, resume_id)
    return StandardResponse(**format_response(data=None, message="Resume deleted successfully."))
