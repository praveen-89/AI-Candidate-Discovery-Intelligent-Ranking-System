"""
General helper utilities for the application.
"""

def format_response(data: dict, message: str = "Success") -> dict:
    """
    Format a standard API response dictionary.
    """
    return {
        "status": "success",
        "message": message,
        "data": data
    }
