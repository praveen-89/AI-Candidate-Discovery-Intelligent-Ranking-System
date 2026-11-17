import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

# Resolve the repo root's .env explicitly, independent of the backend process's
# cwd (e.g. `uvicorn app.main:app` run from backend/ vs. the repo root). The
# project's .env.example lives at the repo root, so the real .env belongs there
# too — not duplicated into backend/.env.
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.abspath(os.path.join(_THIS_DIR, "..", ".."))
_ROOT_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))
_ROOT_ENV_FILE = os.path.join(_ROOT_DIR, ".env")


class Settings(BaseSettings):
    """
    Application configuration settings.
    Loaded from environment variables or the repo-root .env file.
    """
    PROJECT_NAME: str = "AI Talent Intelligence Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Environment settings
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    model_config = SettingsConfigDict(env_file=_ROOT_ENV_FILE, env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

settings = Settings()
