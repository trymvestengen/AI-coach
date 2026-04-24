import os
import httpx
from jose import jwt, JWTError
from fastapi import Request, HTTPException
from cachetools import cached, TTLCache

_jwks_cache: TTLCache = TTLCache(maxsize=1, ttl=3600)


@cached(_jwks_cache)
def _get_jwks() -> dict:
    url = os.environ["SUPABASE_JWKS_URL"]
    return httpx.get(url, timeout=10).json()


def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth.removeprefix("Bearer ")
    try:
        jwks = _get_jwks()
        payload = jwt.decode(token, jwks, algorithms=["RS256"], audience="authenticated")
        return payload["sub"]
    except (JWTError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token")
