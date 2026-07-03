import logging
import json
import sys
from datetime import datetime
from config.settings import settings

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
        file_handler = logging.FileHandler("logs/app.log", encoding="utf-8")
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)
        
        # Prevent propagation to the root logger to avoid duplicate output
        logger.propagate = False
        
    return logger
