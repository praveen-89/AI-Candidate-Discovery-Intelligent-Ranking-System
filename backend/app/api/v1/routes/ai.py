from fastapi import APIRouter
from typing import Any
from app.schemas.ai import StandardResponse, RankResponse, CacheStatusResponse, AIStatusResponse
from app.services.ai_engine import AIEngineService
from app.utils.helpers import format_response

router = APIRouter()

@router.post("/rank", response_model=StandardResponse, status_code=200)
async def rank_candidates() -> StandardResponse:
    """
    Executes the AI Engine inference pipeline and ranks candidates.
    """
    result = await AIEngineService.run_inference()
    return StandardResponse(**format_response(data=result, message="Inference completed successfully."))

@router.get("/results", response_model=StandardResponse, status_code=200)
async def get_results() -> StandardResponse:
    """
    Returns the full contents of the generated submission.json.
    """
    submission = AIEngineService.load_submission()
    return StandardResponse(**format_response(data=submission, message="Results retrieved successfully."))

@router.get("/results/{candidate_id}", response_model=StandardResponse, status_code=200)
async def get_single_result(candidate_id: str) -> StandardResponse:
    """
    Returns the ranking explanation and data for a specific candidate.
    """
    candidate = AIEngineService.get_candidate(candidate_id)
    return StandardResponse(**format_response(data=candidate, message=f"Candidate {candidate_id} retrieved successfully."))

@router.get("/manifest", response_model=StandardResponse, status_code=200)
async def get_manifest() -> StandardResponse:
    """
    Returns the contents of the generated manifest.json.
    """
    manifest = AIEngineService.get_manifest()
    return StandardResponse(**format_response(data=manifest, message="Manifest retrieved successfully."))

@router.get("/cache/status", response_model=CacheStatusResponse, status_code=200)
async def get_cache_status() -> CacheStatusResponse:
    """
    Returns the status of the FAISS embeddings cache.
    """
    status = AIEngineService.get_cache_status()
    return CacheStatusResponse(**status)

@router.get("/ai/status", response_model=AIStatusResponse, status_code=200)
async def get_ai_status() -> AIStatusResponse:
    """
    Verifies the health and readiness of the AI Engine.
    """
    status = AIEngineService.get_ai_status()
    return AIStatusResponse(**status)
