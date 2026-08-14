from pydantic import BaseModel

class HealthResponse(BaseModel):
    """
    Schema for the health check endpoint response.
    """
    status: str
    message: str
