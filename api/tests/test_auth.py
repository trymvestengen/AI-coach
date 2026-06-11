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


def test_unexpected_decode_error_raises_401_not_500():
    """jwt.decode can raise non-JWTError exceptions (ValueError, JWSError, etc).
    These must still produce 401, not leak 500 to the client."""
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Bearer faketoken"})
    with patch("app.auth._get_jwks", return_value={}), \
         patch("app.auth.jwt.decode", side_effect=ValueError("malformed")):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(request)
    assert exc_info.value.status_code == 401


def test_jwks_fetch_failure_raises_401_not_500():
    """If JWKS fetch fails (network error, paused Supabase, etc.) auth
    should return 401, not leak the underlying exception as 500."""
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Bearer some.token.here"})
    with patch("app.auth._get_jwks", side_effect=Exception("connection refused")):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(request)
    assert exc_info.value.status_code == 401


def test_jwks_without_keys_is_rejected_not_cached():
    """H3: a 200 response missing 'keys' must raise (so @cached stores nothing)
    rather than poisoning the cache for an hour."""
    from app import auth

    class FakeResp:
        def raise_for_status(self):
            return None

        def json(self):
            return {"error": "not jwks"}  # no 'keys'

    auth._jwks_cache.clear()
    with patch("app.auth.httpx.get", return_value=FakeResp()):
        with pytest.raises(ValueError):
            auth._get_jwks()
    auth._jwks_cache.clear()


def test_issuer_is_pinned_when_env_set(monkeypatch):
    """H2: when SUPABASE_ISSUER is set, it is passed to jwt.decode (issuer pinning)."""
    from app.auth import get_current_user_id
    monkeypatch.setenv("SUPABASE_ISSUER", "https://proj.supabase.co/auth/v1")
    captured = {}

    def fake_decode(token, key, **kwargs):
        captured.update(kwargs)
        return {"sub": "u-1"}

    request = make_request({"Authorization": "Bearer t"})
    with patch("app.auth._get_jwks", return_value={"keys": []}), \
         patch("app.auth.jwt.decode", side_effect=fake_decode):
        assert get_current_user_id(request) == "u-1"
    assert captured.get("issuer") == "https://proj.supabase.co/auth/v1"
    assert captured.get("options") == {"require_exp": True}
