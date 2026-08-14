from fastapi import FastAPI

from app.config.settings import settings
from app.core.logging import setup_logging, get_logger
from app.core.security import setup_security
from app.core.exceptions import setup_exception_handlers
from app.middleware.request_id import RequestIDMiddleware
from app.api.v1.router import api_router

# Setup structured logging before initializing the app
setup_logging()
logger = get_logger(__name__)

def create_app() -> FastAPI:
    """
    Factory pattern to create and configure the FastAPI application.
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        redoc_url=f"{settings.API_V1_STR}/redoc"
    )

    # Add Middleware
    app.add_middleware(RequestIDMiddleware)
    setup_security(app)

    # Setup Exception Handlers
    setup_exception_handlers(app)

    # Include Routers
    app.include_router(api_router, prefix=settings.API_V1_STR)

    @app.on_event("startup")
    async def startup_event():
        logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
        logger.info(f"Environment: {settings.ENVIRONMENT}")

    @app.on_event("shutdown")
    async def shutdown_event():
        logger.info("Shutting down application...")

    return app

app = create_app()
