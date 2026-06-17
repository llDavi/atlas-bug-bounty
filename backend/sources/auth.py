"""Clerk authentication helpers for FastAPI.

Token verification uses Clerk's public JWKS endpoint (no secret needed).
User metadata (is_pro) is fetched via the Clerk Backend API using the secret key.
"""

import hmac

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from clerk_backend_api import Clerk

from .config import CLERK_SECRET_KEY, ADMIN_TOKEN

# Decode Clerk frontend domain from publishable key (base64 suffix after pk_test_/pk_live_).
# Hardcoded for this app's Clerk instance.
_CLERK_JWKS_URL = "https://cuddly-stag-52.clerk.accounts.dev/.well-known/jwks.json"

_jwks_client = PyJWKClient(_CLERK_JWKS_URL, cache_jwk_set=True, lifespan=3600)
_clerk = Clerk(bearer_auth=CLERK_SECRET_KEY)
_bearer = HTTPBearer(auto_error=False)


def _verify_jwt(token: str) -> dict:
    signing_key = _jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        options={"verify_aud": False},
    )


def _token_from(credentials: HTTPAuthorizationCredentials | None) -> str | None:
    return credentials.credentials if credentials else None


def require_auth(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
    """Dependency: returns the JWT payload or raises 401."""
    token = _token_from(credentials)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        return _verify_jwt(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


def require_pro(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
    """Dependency: raises 401 if not authenticated, 403 if not Pro."""
    token = _token_from(credentials)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = _verify_jwt(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    try:
        user = _clerk.users.get(user_id=user_id)
        is_pro = bool((user.public_metadata or {}).get("is_pro", False))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not verify user")

    if not is_pro:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pro subscription required")

    return payload


def require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> None:
    """Dependency: protects internal/admin endpoints with a static bearer token."""
    token = _token_from(credentials)
    if not ADMIN_TOKEN or not token or not hmac.compare_digest(token, ADMIN_TOKEN):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authorized")
