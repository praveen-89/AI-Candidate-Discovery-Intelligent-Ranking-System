import logging
import sys

def setup_logging(log_level: int = logging.INFO) -> None:
    """
    Configure application-wide structured logging.
    """
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Suppress verbose loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """
    Retrieve a configured logger by name.
    """
    return logging.getLogger(name)
