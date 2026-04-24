import os
import pytest
from unittest.mock import patch
from jose import JWTError
from fastapi import HTTPException
from starlette.requests import Request

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
os.environ.setdefault("SUPABASE_JWKS_URL", "https://fake.supabase.co/auth/v1/.well-known/jwks.json")


def make_request(headers: dict) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "query_string": b"",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
    }
    return Request(scope)


def test_missing_authorization_header_raises_401():
    from app.auth import get_current_user_id
    request = make_request({})
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(request)
    assert exc_info.value.status_code == 401


def test_non_bearer_authorization_raises_401():
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Basic abc123"})
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(request)
    assert exc_info.value.status_code == 401


def test_valid_bearer_returns_sub():
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Bearer fake.jwt.token"})
    with patch("app.auth._get_jwks", return_value={}), \
         patch("app.auth.jwt.decode", return_value={"sub": "user-abc-123"}):
        user_id = get_current_user_id(request)
    assert user_id == "user-abc-123"


def test_jwt_error_raises_401():
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Bearer bad.token"})
    with patch("app.auth._get_jwks", return_value={}), \
         patch("app.auth.jwt.decode", side_effect=JWTError("invalid")):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(request)
    assert exc_info.value.status_code == 401


def test_missing_sub_claim_raises_401():
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Bearer fake.jwt.token"})
    with patch("app.auth._get_jwks", return_value={}), \
         patch("app.auth.jwt.decode", return_value={}):  # no "sub" key
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(request)
    assert exc_info.value.status_code == 401
