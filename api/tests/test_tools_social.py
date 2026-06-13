import os
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
WORKOUT_ID = "cccccccc-0000-0000-0000-000000000001"


# ---------------------------------------------------------------------------
# share_workout
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_share_workout_happy(make_mock_get_conn):
    """Workout exists, completed, not yet shared."""
    cur_select = AsyncMock()
    cur_select.fetchone = AsyncMock(return_value=(None,))  # shared_at is None
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(datetime.utcnow(),))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_select, cur_update])

    with patch("app.tools.handlers.social_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "share_workout", {"workout_id": WORKOUT_ID})

    assert result["ok"] is True
    assert result["workout_id"] == WORKOUT_ID
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_share_workout_not_found(make_mock_get_conn):
    """Workout does not exist or is not completed."""
    cur_select = AsyncMock()
    cur_select.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_select)

    with patch("app.tools.handlers.social_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "share_workout", {"workout_id": WORKOUT_ID})

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_share_workout_already_shared(make_mock_get_conn):
    """Workout was already shared — shared_at is not None."""
    cur_select = AsyncMock()
    cur_select.fetchone = AsyncMock(return_value=(datetime(2026, 5, 1, 12, 0, 0),))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_select)

    with patch("app.tools.handlers.social_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "share_workout", {"workout_id": WORKOUT_ID})

    assert result["ok"] is False
    assert "already shared" in result["error"].lower()
