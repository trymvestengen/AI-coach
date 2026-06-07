import os
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
PREF_ID = "eeeeeeee-0000-0000-0000-000000000001"


# ---------------------------------------------------------------------------
# add_preference
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_preference_happy(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.preference_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_preference", {
            "category": "workout_style",
            "preference": "liker compound-øvelser",
        })

    assert result["ok"] is True
    assert "preference_id" in result


@pytest.mark.asyncio
async def test_add_preference_short_session(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.preference_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_preference", {
            "category": "time",
            "preference": "kort økt",
        })

    assert result["ok"] is True


# ---------------------------------------------------------------------------
# remove_preference
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_remove_preference_happy(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(PREF_ID,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.preference_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_preference", {"preference_id": PREF_ID})

    assert result["ok"] is True
    assert result["preference_id"] == PREF_ID


@pytest.mark.asyncio
async def test_remove_preference_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.preference_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_preference", {"preference_id": PREF_ID})

    assert result["ok"] is False
    assert "not found" in result["error"].lower()
