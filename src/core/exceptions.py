class RankingEngineError(Exception):
    """Base exception class for all ranking engine errors."""
    pass

class DataValidationError(RankingEngineError):
    """Raised when the input JSONL data fails schema validation or is malformed."""
    pass

class IndexingError(RankingEngineError):
    """Raised when FAISS index creation or loading fails."""
    pass

class ConfigurationError(RankingEngineError):
    """Raised when application settings are improperly configured or missing."""
    pass

class RetrievalError(RankingEngineError):
    """Raised when a failure occurs during the dense or lexical retrieval steps."""
    pass
