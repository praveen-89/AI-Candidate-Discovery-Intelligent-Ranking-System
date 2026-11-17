"""
Local, file-based persistence for jobs and uploaded resumes.

This is a deliberately temporary stand-in for Supabase Postgres (see
implementation.md, Phase 5). It exists so the backend/frontend/resume-upload
features can be built and exercised end-to-end before auth and a real database are
wired in. The only thing Phase 5 needs to change is this module's internals — the
function signatures below are what the Supabase-backed version will also expose, so
routes/services calling these functions won't need to change.

Storage layout:
  uploads/job_descriptions/jobs.json         — list of job records
  uploads/resumes/<resume_id>/original.<ext> — the uploaded file as-is
  uploads/resumes/<resume_id>/record.json    — parsed candidate + score + status
"""

import json
import os
import threading
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.abspath(os.path.join(_THIS_DIR, "..", ".."))
ROOT_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))

JOBS_DIR = os.path.join(ROOT_DIR, "uploads", "job_descriptions")
JOBS_FILE = os.path.join(JOBS_DIR, "jobs.json")
RESUMES_DIR = os.path.join(ROOT_DIR, "uploads", "resumes")

_jobs_lock = threading.Lock()
_resume_locks: Dict[str, threading.Lock] = {}
_resume_locks_guard = threading.Lock()


def _now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------

def _read_jobs() -> List[Dict[str, Any]]:
    if not os.path.exists(JOBS_FILE):
        return []
    with open(JOBS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _write_jobs(jobs: List[Dict[str, Any]]) -> None:
    os.makedirs(JOBS_DIR, exist_ok=True)
    with open(JOBS_FILE, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2)


def create_job(
    title: str,
    raw_text: str,
    structured_job: Dict[str, Any],
    source_file_path: Optional[str] = None,
) -> Dict[str, Any]:
    with _jobs_lock:
        jobs = _read_jobs()
        job_id = structured_job.get("job_id") or _new_id("job")
        record = {
            "job_id": job_id,
            "title": title,
            "raw_text": raw_text,
            "structured_job": structured_job,
            "source_file_path": source_file_path,
            "created_at": _now_iso(),
        }
        jobs.append(record)
        _write_jobs(jobs)
        return record


def save_job_description_file(job_id: str, extension: str, content: bytes) -> str:
    """
    Writes an uploaded job-description file's raw bytes to disk and returns the
    stored path. Mirrors `save_resume_file` — same Phase 5 Supabase Storage note
    applies.
    """
    job_dir = os.path.join(JOBS_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    stored_file_path = os.path.join(job_dir, f"original{extension}")
    with open(stored_file_path, "wb") as f:
        f.write(content)
    return stored_file_path


def list_jobs() -> List[Dict[str, Any]]:
    with _jobs_lock:
        return _read_jobs()


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with _jobs_lock:
        for job in _read_jobs():
            if job["job_id"] == job_id:
                return job
    return None


# ---------------------------------------------------------------------------
# Resumes
# ---------------------------------------------------------------------------

def _resume_dir(resume_id: str) -> str:
    return os.path.join(RESUMES_DIR, resume_id)


def _resume_record_path(resume_id: str) -> str:
    return os.path.join(_resume_dir(resume_id), "record.json")


def _lock_for(resume_id: str) -> threading.Lock:
    with _resume_locks_guard:
        if resume_id not in _resume_locks:
            _resume_locks[resume_id] = threading.Lock()
        return _resume_locks[resume_id]


def new_resume_id() -> str:
    return _new_id("resume")


def new_job_id() -> str:
    return _new_id("job")


def save_resume_file(resume_id: str, extension: str, content: bytes) -> str:
    """
    Writes an uploaded resume's raw bytes to disk and returns the stored path.
    In the Phase 5 (Supabase) version, this becomes an upload to Supabase Storage,
    returning its storage path/URL instead — callers don't need to change.
    """
    resume_dir = _resume_dir(resume_id)
    os.makedirs(resume_dir, exist_ok=True)
    stored_file_path = os.path.join(resume_dir, f"original{extension}")
    with open(stored_file_path, "wb") as f:
        f.write(content)
    return stored_file_path


def create_resume_record(
    resume_id: str,
    job_id: Optional[str],
    original_filename: str,
    stored_file_path: str,
) -> Dict[str, Any]:
    record = {
        "resume_id": resume_id,
        "job_id": job_id,
        "original_filename": original_filename,
        "stored_file_path": stored_file_path,
        "status": "pending",
        "candidate": None,
        "score_result": None,
        "error": None,
        "created_at": _now_iso(),
        "updated_at": _now_iso(),
    }
    with _lock_for(resume_id):
        os.makedirs(_resume_dir(resume_id), exist_ok=True)
        with open(_resume_record_path(resume_id), "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, default=str)
    return record


def update_resume_record(resume_id: str, **fields: Any) -> Dict[str, Any]:
    with _lock_for(resume_id):
        path = _resume_record_path(resume_id)
        with open(path, "r", encoding="utf-8") as f:
            record = json.load(f)
        record.update(fields)
        record["updated_at"] = _now_iso()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2, default=str)
        return record


def get_resume_record(resume_id: str) -> Optional[Dict[str, Any]]:
    path = _resume_record_path(resume_id)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def list_resume_records_for_job(job_id: str) -> List[Dict[str, Any]]:
    results = []
    if not os.path.exists(RESUMES_DIR):
        return results
    for entry in os.listdir(RESUMES_DIR):
        record_path = os.path.join(RESUMES_DIR, entry, "record.json")
        if os.path.exists(record_path):
            with open(record_path, "r", encoding="utf-8") as f:
                record = json.load(f)
            if record.get("job_id") == job_id:
                results.append(record)
    results.sort(key=lambda r: (r.get("score_result") or {}).get("final_score", 0), reverse=True)
    return results
