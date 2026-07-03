# Backend

FastAPI-based backend for the AI Talent Intelligence Platform.

## Status
This module is not yet implemented. The directory structure has been prepared for future development.

## Dependency Boundary

> The backend must communicate with the AI engine only through a service interface or API layer.
> Do not directly import modules from `ai_engine` into `backend`.
> The backend should remain independent so that the AI engine can later be deployed as a separate service if required.
> This prevents tight coupling between the backend and AI engine.

## Directory Structure
```
backend/
└── app/
    ├── api/         # Route handlers
    ├── core/        # App configuration, security
    ├── database/    # Database connections
    ├── models/      # ORM models
    ├── schemas/     # Pydantic schemas
    ├── services/    # Business logic layer
    ├── middleware/   # Custom middleware
    ├── utils/       # Helper utilities
    ├── config/      # Configuration files
    └── main.py      # Application entry point
```
