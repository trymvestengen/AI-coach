import os
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
CONSTRAINT_ID = "dddddddd-0000-0000-0000-000000000001"


# ---------------------------------------------------------------------------
# add_constraint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_constraint_happy(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.constraint_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_constraint", {
            "type": "time",
            "description": "30 min/dag",
        })

    assert result["ok"] is True
    assert "constraint_id" in result


@pytest.mark.asyncio
async def test_add_constraint_location(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.constraint_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_constraint", {
            "type": "location",
            "description": "Trener hjemme uten vekter",
        })

    assert result["ok"] is True


# ---------------------------------------------------------------------------
# remove_constraint
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_remove_constraint_happy(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(CONSTRAINT_ID,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.constraint_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_constraint", {"constraint_id": CONSTRAINT_ID})

    assert result["ok"] is True
    assert result["constraint_id"] == CONSTRAINT_ID


@pytest.mark.asyncio
async def test_remove_constraint_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.constraint_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_constraint", {"constraint_id": CONSTRAINT_ID})

    assert result["ok"] is False
    assert "not found" in result["error"].lower()
