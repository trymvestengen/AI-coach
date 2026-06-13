import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_update_user_profile_succeeds(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(uuid.UUID(TEST_USER_ID),))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.profile_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_user_profile", {"height_cm": 180, "weight_kg": 75.5})

    assert result["ok"] is True
    assert "height_cm" in result["updated_fields"]


@pytest.mark.asyncio
async def test_update_user_profile_rejects_unknown_field(make_mock_get_conn):
    conn = AsyncMock()
    with patch("app.tools.handlers.profile_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_user_profile", {"unknown_field": "x"})
    assert result["ok"] is False


@pytest.mark.asyncio
async def test_update_user_profile_no_fields(make_mock_get_conn):
    conn = AsyncMock()
    with patch("app.tools.handlers.profile_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_user_profile", {})
    assert result["ok"] is False


@pytest.mark.asyncio
async def test_set_persona_mode_succeeds(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(uuid.UUID(TEST_USER_ID),))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.profile_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "set_persona_mode", {"mode": "sergeant"})

    assert result["ok"] is True
    assert result["mode"] == "sergeant"


@pytest.mark.asyncio
async def test_set_persona_mode_rejects_invalid(make_mock_get_conn):
    conn = AsyncMock()
    with patch("app.tools.handlers.profile_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "set_persona_mode", {"mode": "tyrant"})
    assert result["ok"] is False
