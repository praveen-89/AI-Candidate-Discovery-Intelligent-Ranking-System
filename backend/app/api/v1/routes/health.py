from fastapi import APIRouter
from app.schemas.health import HealthResponse

router = APIRouter()

@router.get("/", response_model=HealthResponse, status_code=200)
async def health_check() -> HealthResponse:
    """
    Check if the API is running and healthy.
    """
    return HealthResponse(
        status="ok",
        message="API is healthy"
    )
