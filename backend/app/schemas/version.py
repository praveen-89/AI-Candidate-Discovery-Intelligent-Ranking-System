from pydantic import BaseModel

class VersionResponse(BaseModel):
    """
    Schema for the version endpoint response.
    """
    project: str
    version: str
    environment: str
