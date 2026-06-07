import os
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


# ---------------------------------------------------------------------------
# add_equipment
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_equipment_happy(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.equipment_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_equipment", {"equipment": "barbell"})

    assert result["ok"] is True
    assert result["equipment"] == "barbell"


@pytest.mark.asyncio
async def test_add_equipment_duplicate_is_noop(make_mock_get_conn):
    """ON CONFLICT DO NOTHING — still returns ok=True."""
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.equipment_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_equipment", {"equipment": "dumbbell"})

    assert result["ok"] is True


# ---------------------------------------------------------------------------
# remove_equipment
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_remove_equipment_happy(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("barbell",))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.equipment_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_equipment", {"equipment": "barbell"})

    assert result["ok"] is True
    assert result["equipment"] == "barbell"


@pytest.mark.asyncio
async def test_remove_equipment_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.equipment_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_equipment", {"equipment": "cable machine"})

    assert result["ok"] is False
    assert "not found" in result["error"].lower()
