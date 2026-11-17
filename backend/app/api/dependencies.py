from dataclasses import dataclass
from typing import Generator

from fastapi import Header
from supabase import Client

from app.core.exceptions import APIException
from app.core.supabase_client import verify_token, client_for_user


def get_db() -> Generator:
    """
    Dependency to get a database session.
    Currently a stub until database layer is fully integrated.
    """
    try:
        # yield SessionLocal()
        yield None
    finally:
        pass


@dataclass
class AuthContext:
    user_id: str
    access_token: str
    client: Client


async def get_current_user(authorization: str = Header(default=None)) -> AuthContext:
    """
    Verifies the `Authorization: Bearer <supabase_access_token>` header and
    returns the signed-in user's id plus a Supabase client authenticated as
    that user (so every subsequent DB/storage call is RLS-scoped to them).
    """
    if not authorization or not authorization.lower().startswith("bearer "):
        raise APIException(status_code=401, message="Missing or malformed Authorization header.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise APIException(status_code=401, message="Missing bearer token.")

    claims = verify_token(token)
    user_id = claims.get("sub")
    if not user_id:
        raise APIException(status_code=401, message="Session token has no subject claim.")

    return AuthContext(user_id=user_id, access_token=token, client=client_for_user(token))
