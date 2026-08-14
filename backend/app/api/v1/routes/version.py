from fastapi import APIRouter
from app.schemas.version import VersionResponse
from app.config.settings import settings

router = APIRouter()

@router.get("/", response_model=VersionResponse, status_code=200)
async def get_version() -> VersionResponse:
    """
    Get system version and configuration info.
    """
    return VersionResponse(
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT
    )
