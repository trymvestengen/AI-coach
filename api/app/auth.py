import os
from functools import lru_cache
import httpx
from jose import jwt, JWTError
from fastapi import Request, HTTPException


@lru_cache
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
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
