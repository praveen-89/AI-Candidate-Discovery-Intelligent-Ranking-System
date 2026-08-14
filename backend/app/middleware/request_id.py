import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import get_logger

logger = get_logger(__name__)

class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware to inject a unique request ID into each incoming request.
    """
    async def dispatch(self, request: Request, call_next):
        import time
        request_id = str(uuid.uuid4())
        # Add request_id to request state so it can be accessed in route handlers
        request.state.request_id = request_id
        
        logger.info(f"Incoming Request - ID: {request_id} - Method: {request.method} - URL: {request.url.path}")
        
        start_time = time.time()
        response = await call_next(request)
        execution_time = time.time() - start_time
        
        # Inject the request ID into the response headers
        response.headers["X-Request-ID"] = request_id
        
        success_str = "Success" if response.status_code < 400 else "Failure"
        logger.info(f"Completed Request - ID: {request_id} - Method: {request.method} - URL: {request.url.path} - Status: {response.status_code} ({success_str}) - Execution time: {execution_time:.4f}s")
        
        return response
