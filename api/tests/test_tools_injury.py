import os
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
INJURY_ID = "ffffffff-0000-0000-0000-000000000001"


# ---------------------------------------------------------------------------
# add_injury
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_injury_happy(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.injury_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_injury", {
            "body_part": "knee",
            "description": "Lateral pain",
            "severity": "moderate",
            "started_at": "2026-05-01",
        })

    assert result["ok"] is True
    assert "injury_id" in result
    assert result["body_part"] == "knee"


@pytest.mark.asyncio
async def test_add_injury_minimal(make_mock_get_conn):
    """Only body_part is required."""
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.injury_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_injury", {"body_part": "shoulder"})

    assert result["ok"] is True
    assert result["body_part"] == "shoulder"


# ---------------------------------------------------------------------------
# update_injury
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_injury_happy(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(INJURY_ID,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.injury_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_injury", {
            "injury_id": INJURY_ID,
            "severity": "low",
            "is_active": True,
        })

    assert result["ok"] is True
    assert result["injury_id"] == INJURY_ID


@pytest.mark.asyncio
async def test_update_injury_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.injury_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_injury", {
            "injury_id": INJURY_ID,
            "severity": "high",
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_update_injury_no_fields(make_mock_get_conn):
    conn = AsyncMock()
    with patch("app.tools.handlers.injury_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_injury", {"injury_id": INJURY_ID})

    assert result["ok"] is False
    assert "No fields" in result["error"]


# ---------------------------------------------------------------------------
# remove_injury
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_remove_injury_happy(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(INJURY_ID,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.injury_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_injury", {"injury_id": INJURY_ID})

    assert result["ok"] is True
    assert result["injury_id"] == INJURY_ID


@pytest.mark.asyncio
async def test_remove_injury_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.injury_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_injury", {"injury_id": INJURY_ID})

    assert result["ok"] is False
    assert "not found" in result["error"].lower()
