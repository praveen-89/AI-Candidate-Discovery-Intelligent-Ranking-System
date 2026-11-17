"""
Supabase client setup: token verification and per-request, user-scoped clients.

Every DB/storage operation in this backend runs AS the signed-in user (via
`client.postgrest.auth(access_token)` / storage calls on that same client), not
with the service-role key. Row Level Security in supabase/schema.sql is the real
enforcement — this backend never bypasses it with an admin client.
"""

import os
from supabase import create_client, Client

from app.core.exceptions import APIException
from app.core.logging import get_logger

logger = get_logger(__name__)

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.abspath(os.path.join(_THIS_DIR, "..", ".."))
ROOT_DIR = os.path.abspath(os.path.join(_BACKEND_DIR, ".."))

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(ROOT_DIR, ".env"))
except ImportError:
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise RuntimeError(
        "SUPABASE_URL and SUPABASE_ANON_KEY must be set in the repo-root .env. "
        "See implementation.md Phase 5."
    )

# Used only to verify tokens (auth.get_claims needs a client instance, but the
# verification itself relies on the project's public JWKS / a live auth-server
# check for legacy tokens — this client holds no per-user state).
_verifier_client: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)


def verify_token(token: str) -> dict:
    """
    Verifies a Supabase-issued access token (signature + expiry) and returns its
    claims (includes `sub` = the user's id). Raises APIException(401) if invalid.
    """
    try:
        result = _verifier_client.auth.get_claims(jwt=token)
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise APIException(status_code=401, message="Invalid or expired session.") from e

    if not result:
        raise APIException(status_code=401, message="Invalid or expired session.")

    return result["claims"]


def client_for_user(access_token: str) -> Client:
    """
    Returns a fresh Supabase client authenticated as the given user — all
    `.table()`/`.storage` calls on it run under that user's RLS context.

    `.postgrest.auth(token)` alone is NOT enough: `.table()` and `.storage`
    are separate lazily-initialized sub-clients that each read
    `client.options.headers` only once, the first time they're accessed —
    `.postgrest.auth()` only patches postgrest's own already-initialized
    headers. Setting the Authorization header on `client.options.headers`
    directly, before either sub-client has been touched, is what actually
    makes storage calls (file uploads) run as this user too — without this,
    uploads silently ran as anon and were rejected by storage RLS.
    """
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    client.options.headers["Authorization"] = f"Bearer {access_token}"
    client.postgrest.auth(access_token)
    return client
