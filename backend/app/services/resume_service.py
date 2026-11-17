import os
import tempfile
from typing import Any, Dict, Optional

from supabase import Client

from app.core.exceptions import APIException
from app.core.logging import get_logger
from app.database import supabase_store
from app.services import ai_runtime

logger = get_logger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


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


class ResumeService:
    """
    Orchestrates the real-time "upload a resume, get a score" flow:
    save file -> parse -> extract features -> embed -> add to the live FAISS
    index -> score against the requested job -> persist the result.

    Deliberately bypasses the 100k base-pool streaming/caching machinery in
    ai_engine/scripts/inference.py — this only ever touches the one uploaded
    candidate. Every call takes the requesting user's Supabase `client`
    (already authenticated as them) and `owner_user_id`.
    """

    @staticmethod
    def _validate_upload(original_filename: str, content: bytes) -> str:
        ext = os.path.splitext(original_filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise APIException(
                status_code=400,
                message=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            )
        if len(content) == 0:
            raise APIException(status_code=400, message="Uploaded file is empty.")
        if len(content) > MAX_UPLOAD_BYTES:
            raise APIException(status_code=400, message=f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)}MB upload limit.")
        return ext

    @staticmethod
    def upload_and_score(
        client: Client,
        owner_user_id: str,
        original_filename: str,
        content: bytes,
        job_id: Optional[str],
    ) -> Dict[str, Any]:
        from app.core import ai_engine_bootstrap  # noqa: F401
        from core.resume_parser import ResumeParser
        from core.score_single import score_candidate_against_job

        ext = ResumeService._validate_upload(original_filename, content)

        structured_job = None
        if job_id:
            from app.services.job_service import JobService
            job_record = JobService.get_job(client, job_id)  # raises 404 if missing/not owned
            structured_job = job_record["structured_job"]

        resume_id = supabase_store.new_resume_id()
        candidate_id = f"CAND_UPLOAD_{resume_id.split('_', 1)[1]}"

        stored_file_path = supabase_store.save_resume_file(client, owner_user_id, resume_id, ext, content)

        record = supabase_store.create_resume_record(
            client,
            owner_user_id,
            resume_id=resume_id,
            job_id=job_id,
            original_filename=original_filename,
            stored_file_path=stored_file_path,
        )

        temp_path = _write_temp_file(ext, content)
        try:
            try:
                parser = ResumeParser(temp_path, candidate_id)
                candidate = parser.parse()
            finally:
                os.remove(temp_path)

            update_fields: Dict[str, Any] = {"status": "parsed", "candidate": candidate}

            if structured_job is not None and job_id is not None:
                embedder = ai_runtime.get_embedder()
                job_embedding = ai_runtime.get_or_embed_job_query(job_id, structured_job["semantic_query"])
                result = score_candidate_against_job(candidate, structured_job, job_embedding, embedder)

                retriever = ai_runtime.get_retriever()
                retriever.add_to_index([candidate_id], [result.pop("embedding")])
                try:
                    ai_runtime.persist_index()
                except Exception:
                    logger.exception("Failed to persist FAISS index after adding uploaded resume (continuing).")

                result.pop("features", None)
                update_fields["status"] = "scored"
                update_fields["score_result"] = result

            record = supabase_store.update_resume_record(client, resume_id, **update_fields)
            logger.info(f"Resume {resume_id} processed (status={record['status']}, job_id={job_id}).")
            return record

        except Exception as e:
            logger.exception(f"Failed to process uploaded resume {resume_id}")
            record = supabase_store.update_resume_record(client, resume_id, status="failed", error=str(e))
            raise APIException(status_code=422, message=f"Failed to parse/score resume: {e}") from e

    @staticmethod
    def get_resume(client: Client, resume_id: str) -> Dict[str, Any]:
        record = supabase_store.get_resume_record(client, resume_id)
        if not record:
            raise APIException(status_code=404, message=f"Resume {resume_id} not found.")
        return record

    @staticmethod
    def delete_resume(client: Client, resume_id: str) -> None:
        record = ResumeService.get_resume(client, resume_id)  # 404s if missing/not owned
        supabase_store.delete_resume_record(client, resume_id, record.get("stored_file_path"))
        logger.info(f"Deleted resume {resume_id}.")
