# AI Talent Intelligence Platform

A scalable, production-grade monorepo architecture for enterprise AI candidate discovery and intelligent ranking.

## Monorepo Architecture

This repository is organized into distinct, decoupled modules to support independent development, scaling, and deployment.

### 1. `ai_engine/`
The core AI candidate ranking and discovery system. Handles parsing, embedding
generation, dense retrieval, hybrid ranking, and explainability for the 100k
batch candidate pool, and (as of the resume-upload feature) real-time parsing
and scoring of individually uploaded resumes/job descriptions.
- **Stack**: Python 3.11+, FAISS, SentenceTransformers
- *See `ai_engine/README.md` for execution instructions.*

### 2. `backend/`
FastAPI service exposing the AI engine, plus job/resume management.
- **Stack**: FastAPI (Python)
- *See `backend/README.md` — it imports `ai_engine` in-process (warm model/index)
  for real-time resume scoring, and still shells out to the batch
  `ai_engine/scripts/inference.py` for the "rebuild the full 100k index" admin path.*

### 3. `frontend/`
The user-facing dashboard for recruiters: browsing ranked candidates, creating
job requirements, and uploading/scoring resumes against them.
- **Stack**: Next.js (App Router), React, Tailwind CSS

### 4. `supabase/`
Database definitions, migrations, and Row Level Security (RLS) policies.
- **Stack**: PostgreSQL (Supabase)
- *Not wired up yet — jobs/resumes are currently stored as local JSON files via
  `backend/app/database/local_store.py`. See `implementation.md` Phase 5.*

### 5. `shared/`
Shared types, constants, schemas, and utilities used across the stack.

### 6. `datasets/`
Strict data management directory for local development.
- `raw/`: Unmodified original datasets and documents (IGNORED in Git).
- `processed/`: Transformed datasets (IGNORED in Git).
- `embeddings/`: Cached FAISS index, candidate ids, and extracted features (IGNORED in Git).

### 7. `uploads/`
User-submitted content: uploaded resumes, job descriptions, and the local
job/resume store (IGNORED in Git — see `backend/app/database/local_store.py`).

### 8. `infra/`
Deployment configurations, Docker files, and Nginx setups.

## Setup Instructions

### AI Engine
```bash
cd ai_engine
python -m venv ../.venv   # or reuse a repo-root .venv
pip install -r requirements.txt
# Place the dataset at datasets/raw/candidates.jsonl (gitignored — not included in the repo)
python scripts/inference.py   # builds the FAISS cache for the 100k batch pool
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
On startup it loads the embedding model, the FAISS index, and the base
candidate features once (a few seconds to ~15s on a cold cache) and keeps them
warm. See `backend/README.md` for the API surface.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Set `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` if the backend isn't at
`http://127.0.0.1:8000`.

See `implementation.md` for the full build plan and what's done vs. deferred
(currently: AI engine + backend + core frontend flows are built; Supabase
auth/persistence is Phase 5, intentionally last).
