from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from typing import Any

from app.core.logging import get_logger

logger = get_logger(__name__)

class APIException(Exception):
    """
    Base custom exception for the application.
    """
    def __init__(self, status_code: int, message: str, details: Any = None):
        self.status_code = status_code
        self.message = message
        self.details = details

def setup_exception_handlers(app: FastAPI) -> None:
    """
    Configure global exception handlers.
    """
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        logger.error(f"APIException: {exc.message} - {exc.details}")
        content = {"status": "failed", "message": exc.message}
        if exc.details:
            content["details"] = exc.details
        return JSONResponse(
            status_code=exc.status_code,
            content=content
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        logger.error(f"HTTPException: {exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={"status": "failed", "message": str(exc.detail)}
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.error(f"Validation Error: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={"status": "failed", "message": "Validation Error", "details": exc.errors()}
        )
        
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled Server Error")
        return JSONResponse(
            status_code=500,
            content={"status": "failed", "message": "Internal Server Error"}
        )
