import os
import tempfile
from typing import Any, Dict, List, Optional

from supabase import Client

from app.core.exceptions import APIException
from app.core.logging import get_logger
from app.database import supabase_store

logger = get_logger(__name__)

# Same set resume uploads accept — a job description is "just another document".
ALLOWED_JD_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_JD_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


def _write_temp_file(extension: str, content: bytes) -> str:
    """
    Writes bytes to a short-lived local temp file so ai_engine's file-based
    extractors (pypdf/python-docx, which need a real path) can read them. The
    durable copy lives in Supabase Storage, not this temp file.
    """
    fd, path = tempfile.mkstemp(suffix=extension)
    with os.fdopen(fd, "wb") as f:
        f.write(content)
    return path


class JobService:
    """
    Creates and retrieves company job requirements, parsed into the same
    structured_job shape ai_engine's ranking pipeline already consumes.
    Every call takes the requesting user's Supabase `client` (already
    authenticated as them) and `owner_user_id`, so all persistence is
    RLS-scoped to that user.
    """

    @staticmethod
    def _parse_and_store(
        client: Client,
        owner_user_id: str,
        title: str,
        raw_text: str,
        source_file_path: Optional[str] = None,
        job_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        from app.core import ai_engine_bootstrap  # noqa: F401
        from core.job_parser import JobParser

        if not raw_text or not raw_text.strip():
            raise APIException(status_code=400, message="The job description is empty.")

        job_id = job_id or supabase_store.new_job_id()
        parser = JobParser.from_text(raw_text, job_id=job_id)
        structured_job = parser.parse()
        structured_job["job_id"] = job_id

        record = supabase_store.create_job(
            client,
            owner_user_id,
            title=title,
            raw_text=raw_text,
            structured_job=structured_job,
            source_file_path=source_file_path,
        )
        logger.info(f"Created job {job_id}: '{title}'" + (" (from file)" if source_file_path else ""))
        return record

    @staticmethod
    def create_job(client: Client, owner_user_id: str, title: str, description_text: str) -> Dict[str, Any]:
        return JobService._parse_and_store(client, owner_user_id, title, description_text)

    @staticmethod
    def create_job_from_file(client: Client, owner_user_id: str, title: str, original_filename: str, content: bytes) -> Dict[str, Any]:
        """
        Accepts an uploaded job-description file (.pdf/.docx/.txt), extracts its
        text with the same generic extractor resume uploads use, then parses and
        stores it exactly like `create_job`.
        """
        from app.core import ai_engine_bootstrap  # noqa: F401
        from core.resume_parser import extract_text, UnsupportedResumeFormat

        ext = os.path.splitext(original_filename)[1].lower()
        if ext not in ALLOWED_JD_EXTENSIONS:
            raise APIException(
                status_code=400,
                message=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_JD_EXTENSIONS))}",
            )
        if len(content) == 0:
            raise APIException(status_code=400, message="Uploaded file is empty.")
        if len(content) > MAX_JD_UPLOAD_BYTES:
            raise APIException(status_code=400, message=f"File exceeds the {MAX_JD_UPLOAD_BYTES // (1024 * 1024)}MB upload limit.")

        job_id = supabase_store.new_job_id()

        temp_path = _write_temp_file(ext, content)
        try:
            raw_text = extract_text(temp_path)
        except UnsupportedResumeFormat as e:
            raise APIException(status_code=400, message=str(e)) from e
        finally:
            os.remove(temp_path)

        if not raw_text.strip():
            raise APIException(status_code=422, message="Could not extract any text from the uploaded job description.")

        stored_file_path = supabase_store.save_job_description_file(client, owner_user_id, job_id, ext, content)

        return JobService._parse_and_store(
            client, owner_user_id, title, raw_text, source_file_path=stored_file_path, job_id=job_id
        )

    @staticmethod
    def list_jobs(client: Client) -> List[Dict[str, Any]]:
        return supabase_store.list_jobs(client)

    @staticmethod
    def get_job(client: Client, job_id: str) -> Dict[str, Any]:
        job = supabase_store.get_job(client, job_id)
        if not job:
            raise APIException(status_code=404, message=f"Job {job_id} not found.")
        return job

    @staticmethod
    def get_results_for_job(client: Client, job_id: str) -> List[Dict[str, Any]]:
        JobService.get_job(client, job_id)  # 404s if missing (or not owned by this user)
        return supabase_store.list_resume_records_for_job(client, job_id)

    @staticmethod
    def search_existing_candidates(client: Client, job_id: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        """
        Finds and ranks existing base-pool (100k) candidates against this job,
        using the already-warm FAISS index — no upload required. Paginated;
        returns {"results": [...], "total": int, "page": int, "page_size": int}.
        """
        from app.core import ai_engine_bootstrap  # noqa: F401
        from app.services import ai_runtime
        from core.search_pool import search_existing_pool

        if page < 1:
            raise APIException(status_code=400, message="page must be >= 1.")
        if page_size < 1 or page_size > 100:
            raise APIException(status_code=400, message="page_size must be between 1 and 100.")

        job = JobService.get_job(client, job_id)  # 404s if missing/not owned
        structured_job = job["structured_job"]

        job_embedding = ai_runtime.get_or_embed_job_query(job_id, structured_job["semantic_query"])
        retriever = ai_runtime.get_retriever()
        base_features = ai_runtime.get_base_features()

        outcome = search_existing_pool(
            structured_job,
            job_embedding,
            retriever,
            base_features,
            offset=(page - 1) * page_size,
            limit=page_size,
        )
        return {"results": outcome["results"], "total": outcome["total"], "page": page, "page_size": page_size}
