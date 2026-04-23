import pytest
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone


def make_mock_get_conn(conn):
    @asynccontextmanager
    async def _get_conn():
        yield conn
    return _get_conn


@pytest.fixture
def mock_conn():
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[])
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    return conn


@pytest.mark.asyncio
async def test_log_workout_returns_workout_id(mock_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import log_workout
        result = await log_workout(
            exercises=[{"exercise_id": "squat", "sets": [{"reps": 5, "weight_kg": 80}]}]
        )
    assert "workout_id" in result
    assert result["message"] == "Workout logged successfully"


@pytest.mark.asyncio
async def test_log_workout_calls_commit(mock_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import log_workout
        await log_workout(exercises=[{"exercise_id": "bench-press", "sets": [{"reps": 8, "weight_kg": 60}]}])
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_get_user_history_returns_list(mock_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import get_user_history
        result = await get_user_history()
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_suggest_progression_no_history(mock_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import suggest_progression
        result = await suggest_progression("squat")
    assert result["suggested_weight_kg"] is None
    assert "No history" in result["suggestion"]


@pytest.mark.asyncio
async def test_suggest_progression_low_rpe_adds_2_5kg(mock_conn):
    dt = datetime(2026, 4, 23, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[(dt, 80.0, 6), (dt, 80.0, 7)])
    mock_conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import suggest_progression
        result = await suggest_progression("squat")
    assert result["suggested_weight_kg"] == 82.5


@pytest.mark.asyncio
async def test_suggest_progression_high_rpe_keeps_weight(mock_conn):
    dt = datetime(2026, 4, 23, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[(dt, 80.0, 8), (dt, 80.0, 9)])
    mock_conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import suggest_progression
        result = await suggest_progression("squat")
    assert result["suggested_weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_handle_tool_log_workout_is_awaitable(mock_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.tools.handlers import handle_tool
        result = await handle_tool(
            "log_workout",
            {"exercises": [{"exercise_id": "squat", "sets": [{"reps": 5, "weight_kg": 80}]}]},
        )
    assert "workout_id" in result
