import os
from dataclasses import dataclass, field

@dataclass
class AppSettings:
    """
    Core application settings using standard dataclasses for zero-dependency loading.
    Reads from environment variables with sensible defaults.
    """
    
    # Application Info
    APP_NAME: str = os.getenv("APP_NAME", "India_Runs_Ranking_Engine")
    APP_ENV: str = os.getenv("APP_ENV", "production")
    
    # Pipeline Settings
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "256"))
    
    # Data Paths
    DATA_RAW_DIR: str = os.getenv("DATA_RAW_DIR", "data/raw")
    DATA_PROCESSED_DIR: str = os.getenv("DATA_PROCESSED_DIR", "data/processed")
    DATA_EMBEDDINGS_DIR: str = os.getenv("DATA_EMBEDDINGS_DIR", "data/embeddings")
    
    # Model Configurations
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5")
    EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "384"))
    
    # Retrieval Limits
    TOP_K_DENSE: int = int(os.getenv("TOP_K_DENSE", "5000"))
    TOP_K_PRE_RANK: int = int(os.getenv("TOP_K_PRE_RANK", "1000"))
    TOP_K_FINAL: int = int(os.getenv("TOP_K_FINAL", "100"))
    
    # Hybrid Ranking Weights (initial priors)
    WEIGHT_SEMANTIC: float = float(os.getenv("WEIGHT_SEMANTIC", "0.30"))
    WEIGHT_SKILL: float = float(os.getenv("WEIGHT_SKILL", "0.20"))
    WEIGHT_EXPERIENCE: float = float(os.getenv("WEIGHT_EXPERIENCE", "0.15"))
    WEIGHT_CAREER: float = float(os.getenv("WEIGHT_CAREER", "0.10"))
    WEIGHT_EDUCATION: float = float(os.getenv("WEIGHT_EDUCATION", "0.05"))
    WEIGHT_BEHAVIORAL: float = float(os.getenv("WEIGHT_BEHAVIORAL", "0.10"))
    WEIGHT_AVAILABILITY: float = float(os.getenv("WEIGHT_AVAILABILITY", "0.05"))
    WEIGHT_LOCATION: float = float(os.getenv("WEIGHT_LOCATION", "0.05"))
    
    # Preprocessing Constants
    REFERENCE_DATE_STR: str = os.getenv("REFERENCE_DATE", "2026-07-01")
    TIER_1_CITIES: tuple = (
        "pune", "noida", "mumbai", "delhi", "bangalore", "bengaluru",
        "hyderabad", "chennai", "kolkata", "gurgaon", "gurugram",
        "ahmedabad", "new delhi", "navi mumbai", "thane"
    )

def get_settings() -> AppSettings:
    """Returns a cached instance of the application settings."""
    return AppSettings()

# Global settings instance
settings = get_settings()
