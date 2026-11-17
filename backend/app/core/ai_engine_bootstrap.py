"""
Makes the ai_engine package importable in-process and points its settings at
absolute dataset paths, independent of the backend process's working directory.

Must be imported before any `from config...`, `from core...`, `from embeddings...`,
etc. (ai_engine's own bare top-level modules) are imported anywhere in the backend.
Importing this module is idempotent and side-effect-safe to repeat.
"""

import os
import sys

from dotenv import load_dotenv

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.abspath(os.path.join(_THIS_DIR, "..", ".."))
ROOT_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))

AI_ENGINE_DIR = os.path.join(ROOT_DIR, "ai_engine")
AI_ENGINE_SRC_DIR = os.path.join(AI_ENGINE_DIR, "src")

# ai_engine/src/config/settings.py reads plain os.getenv() — it has no .env
# loading of its own. Load the repo-root .env into the process environment here,
# before anything imports `config.settings`, so overrides placed there (model
# name, ranking weights, Supabase keys once Phase 5 lands, etc.) actually apply.
# Does not override variables already set in the real environment.
load_dotenv(os.path.join(ROOT_DIR, ".env"))

# ai_engine/src/config/settings.py reads these via os.getenv with relative-path
# defaults ("datasets/raw", ...). Pin them to absolute paths up front (unless the
# .env/environment already set one) so ai_engine behaves identically regardless
# of the backend's cwd (e.g. run via `uvicorn` from backend/ vs the repo root).
os.environ.setdefault("DATA_RAW_DIR", os.path.join(ROOT_DIR, "datasets", "raw"))
os.environ.setdefault("DATA_PROCESSED_DIR", os.path.join(ROOT_DIR, "datasets", "processed"))
os.environ.setdefault("DATA_EMBEDDINGS_DIR", os.path.join(ROOT_DIR, "datasets", "embeddings"))

if AI_ENGINE_SRC_DIR not in sys.path:
    sys.path.insert(0, AI_ENGINE_SRC_DIR)
