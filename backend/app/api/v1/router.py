from fastapi import APIRouter
from app.api.v1.routes import health, version, ai

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(version.router, prefix="/version", tags=["version"])
api_router.include_router(ai.router, prefix="", tags=["ai"])
