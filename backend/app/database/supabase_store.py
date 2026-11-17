"""
Supabase-backed persistence for jobs and uploaded resumes — the Phase 5
replacement for local_store.py's JSON files.

Every function takes an already user-scoped `Client` (from
app.core.supabase_client.client_for_user / AuthContext.client) as its first
argument, so every query runs under that user's RLS policies — there is no
admin/service-role bypass anywhere in this module, and no need to filter by
owner_user_id explicitly: RLS already guarantees a user only ever sees their
own rows. owner_user_id is still written on insert because the RLS `with check`
policies require it.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from supabase import Client

from app.core.logging import get_logger

logger = get_logger(__name__)

RESUMES_BUCKET = "resumes"
JOB_DESCRIPTIONS_BUCKET = "job-descriptions"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def new_job_id() -> str:
    return _new_id("job")


def new_resume_id() -> str:
    return _new_id("resume")


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

def save_job_description_file(client: Client, owner_user_id: str, job_id: str, extension: str, content: bytes) -> str:
    path = f"{owner_user_id}/{job_id}/original{extension}"
    client.storage.from_(JOB_DESCRIPTIONS_BUCKET).upload(
        path, content, {"content-type": "application/octet-stream", "upsert": "true"}
    )
    return path


def create_job(
    client: Client,
    owner_user_id: str,
    title: str,
    raw_text: str,
    structured_job: Dict[str, Any],
    source_file_path: Optional[str] = None,
) -> Dict[str, Any]:
    job_id = structured_job.get("job_id") or new_job_id()
    record = {
        "job_id": job_id,
        "owner_user_id": owner_user_id,
        "title": title,
        "raw_text": raw_text,
        "structured_job": structured_job,
        "source_file_path": source_file_path,
    }
    res = client.table("jobs").insert(record).execute()
    return res.data[0]


def list_jobs(client: Client) -> List[Dict[str, Any]]:
    res = client.table("jobs").select("*").order("created_at", desc=True).execute()
    return res.data or []


def get_job(client: Client, job_id: str) -> Optional[Dict[str, Any]]:
    res = client.table("jobs").select("*").eq("job_id", job_id).maybe_single().execute()
    return res.data if res else None


# ---------------------------------------------------------------------------
# Resumes
# ---------------------------------------------------------------------------

def save_resume_file(client: Client, owner_user_id: str, resume_id: str, extension: str, content: bytes) -> str:
    path = f"{owner_user_id}/{resume_id}/original{extension}"
    client.storage.from_(RESUMES_BUCKET).upload(
        path, content, {"content-type": "application/octet-stream", "upsert": "true"}
    )
    return path


def create_resume_record(
    client: Client,
    owner_user_id: str,
    resume_id: str,
    job_id: Optional[str],
    original_filename: str,
    stored_file_path: str,
) -> Dict[str, Any]:
    record = {
        "resume_id": resume_id,
        "owner_user_id": owner_user_id,
        "job_id": job_id,
        "original_filename": original_filename,
        "stored_file_path": stored_file_path,
        "status": "pending",
    }
    res = client.table("uploaded_resumes").insert(record).execute()
    return res.data[0]


def update_resume_record(client: Client, resume_id: str, **fields: Any) -> Dict[str, Any]:
    fields["updated_at"] = _now_iso()
    res = client.table("uploaded_resumes").update(fields).eq("resume_id", resume_id).execute()
    return res.data[0]


def get_resume_record(client: Client, resume_id: str) -> Optional[Dict[str, Any]]:
    res = client.table("uploaded_resumes").select("*").eq("resume_id", resume_id).maybe_single().execute()
    return res.data if res else None


def delete_resume_record(client: Client, resume_id: str, stored_file_path: Optional[str]) -> None:
    if stored_file_path:
        try:
            client.storage.from_(RESUMES_BUCKET).remove([stored_file_path])
        except Exception:
            logger.warning(f"Failed to remove stored file for resume {resume_id} (continuing with row delete).", exc_info=True)
    client.table("uploaded_resumes").delete().eq("resume_id", resume_id).execute()


def list_resume_records_for_job(client: Client, job_id: str) -> List[Dict[str, Any]]:
    res = client.table("uploaded_resumes").select("*").eq("job_id", job_id).execute()
    results = res.data or []
    results.sort(key=lambda r: (r.get("score_result") or {}).get("final_score", 0), reverse=True)
    return results
