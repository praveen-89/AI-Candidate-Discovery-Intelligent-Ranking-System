# Backend

FastAPI-based backend for the AI Talent Intelligence Platform.

## Status
Implemented. Serves the batch 100k-candidate ranking results, and a real-time
resume-upload-and-score flow backed by a warm, in-process AI engine runtime.

## Dependency Boundary (updated)

The original rule here was "the backend never imports `ai_engine` directly — only
through a subprocess/API layer." That held while the only AI engine entry point was
the one-shot batch script (`ai_engine/scripts/inference.py`, ~15-36s for 100k
candidates). It doesn't hold for real-time resume scoring: spawning a fresh
subprocess (and reloading the embedding model) per upload would cost several
seconds on every request.

The backend now imports `ai_engine` as an **in-process library** for the real-time
path:
- `app/core/ai_engine_bootstrap.py` puts `ai_engine/src` on `sys.path` and pins its
  settings to absolute dataset paths, independent of cwd.
- `app/services/ai_runtime.py` loads the embedding model, FAISS index, and the
  base 100k pool's extracted features **once**, at startup, and keeps them warm for
  the process's lifetime.
- `app/services/resume_service.py` / `job_service.py` call straight into
  `ai_engine.src.core.resume_parser`, `core.job_parser`, `core.score_single`, etc.

The old subprocess-based path (`POST /rank` → `app/services/ai_engine.py` →
`python ai_engine/scripts/inference.py`) still exists for the "rebuild the entire
100k index from scratch" admin operation, which is genuinely a rare, long-running
batch job and doesn't belong on the hot path.

## Persistence & Auth (Phase 5)

Jobs and uploaded resumes are persisted in Supabase Postgres via
`app/database/supabase_store.py`, and resume/JD files in Supabase Storage
(`resumes` / `job-descriptions` buckets). `app/database/local_store.py` (the
original JSON-file store from Phase 2) is kept in the repo but no longer used
by any route — `supabase_store.py` implements the same function shapes, so the
swap required no changes to the service-layer call sites' logic, only their
signatures (every function now takes the requesting user's Supabase `client`).

Every `/jobs*` and `/resumes*` route requires `Authorization: Bearer
<supabase_access_token>` (`app/api/dependencies.py`'s `get_current_user`). The
backend never uses the service-role key for data access — each request's
Supabase client is authenticated as that specific user
(`postgrest.auth(token)`), so Row Level Security (`supabase/schema.sql`) is the
actual enforcement, not just a formality. `SUPABASE_URL` and
`SUPABASE_ANON_KEY` must be set in the repo-root `.env`, or the backend fails
to start.

## Directory Structure
```
backend/
└── app/
    ├── api/         # Route handlers
    ├── core/        # App configuration, security
    ├── database/    # Database connections
    ├── models/      # ORM models
    ├── schemas/     # Pydantic schemas
    ├── services/    # Business logic layer
    ├── middleware/   # Custom middleware
    ├── utils/       # Helper utilities
    ├── config/      # Configuration files
    └── main.py      # Application entry point
```
