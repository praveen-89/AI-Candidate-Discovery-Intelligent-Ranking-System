# AI Talent Intelligence Platform

A scalable, production-grade monorepo architecture for enterprise AI candidate discovery and intelligent ranking.

## Monorepo Architecture

This repository is organized into distinct, decoupled modules to support independent development, scaling, and deployment.

### 1. `ai_engine/`
The core AI candidate ranking and discovery system. It handles parsing, embedding generation, dense retrieval, hybrid ranking, and explainability.
- **Stack**: Python 3.11+, FAISS, SentenceTransformers
- *See `ai_engine/README.md` for execution instructions.*

### 2. `backend/`
The API layer that exposes the AI engine and manages business logic. 
- **Stack**: FastAPI (Python)
- *Note: The backend maintains strict decoupling from the AI engine and communicates only via service interfaces.*

### 3. `frontend/`
The user-facing dashboard for recruiters and administrators.
- **Stack**: React, Vite

### 4. `supabase/`
Database definitions, migrations, and Row Level Security (RLS) policies.
- **Stack**: PostgreSQL (Supabase)

### 5. `shared/`
Shared types, constants, schemas, and utilities used across the stack.

### 6. `datasets/`
Strict data management directory for local development.
- `raw/`: Unmodified original datasets and documents (IGNORED in Git).
- `processed/`: Transformed datasets (IGNORED in Git).
- `embeddings/`: Cached FAISS indexes and numpy arrays (IGNORED in Git).

### 7. `infra/`
Deployment configurations, Docker files, and Nginx setups.

## Setup Instructions

Please refer to the `docs/` folder for detailed setup and architectural documentation.
To initialize the monorepo, use the orchestration scripts provided in `scripts/`.
