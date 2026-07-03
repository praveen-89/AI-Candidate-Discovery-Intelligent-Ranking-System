import logging
import json
import sys
import os
from datetime import datetime
from config.settings import settings

# Compute log directory relative to the script location
_LOGGER_DIR = os.path.dirname(os.path.abspath(__file__))
_AI_ENGINE_DIR = os.path.abspath(os.path.join(_LOGGER_DIR, "..", ".."))
_LOG_DIR = os.path.join(_AI_ENGINE_DIR, "logs")

class JSONFormatter(logging.Formatter):
    """
    Custom formatter to output structured JSON logs.
    Essential for production observability and tracing in the hackathon pipeline.
    """
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "module": record.module,
            "message": record.getMessage(),
            "env": settings.APP_ENV
        }
        
        # Add exception details if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
            
        # Add extra fields passed in the 'extra' kwarg
        if hasattr(record, "extra_data"):
            log_obj["extra_data"] = record.extra_data

        return json.dumps(log_obj)

def get_logger(name: str) -> logging.Logger:
    """
    Configures and returns a logger instance with JSON formatting.
    """
    logger = logging.getLogger(name)
    
    # Only configure if no handlers exist to avoid duplicate logs
    if not logger.handlers:
        logger.setLevel(logging.INFO if settings.APP_ENV == "production" else logging.DEBUG)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(JSONFormatter())
        logger.addHandler(console_handler)
        
        # File handler (optional, good for debugging)
        os.makedirs(_LOG_DIR, exist_ok=True)
        file_handler = logging.FileHandler(os.path.join(_LOG_DIR, "app.log"), encoding="utf-8")
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)
        
        # Prevent propagation to the root logger to avoid duplicate output
        logger.propagate = False
        
    return logger
