import pytest
from unittest.mock import AsyncMock, patch

from app.tools.handlers import create_program, handle_tool


@pytest.mark.asyncio
async def test_create_program_returns_program_id(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await create_program(
            name="3-day strength",
            days=[
                {"name": "Legs", "exercises": [{"exercise_id": "squat", "sets": 4, "reps": 5}]},
            ],
        )
    assert "program_id" in result
    assert result["name"] == "3-day strength"
    assert result["days_count"] == 1


@pytest.mark.asyncio
async def test_create_program_calls_commit(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        await create_program(
            name="Test",
            days=[{"name": "Day 1", "exercises": []}],
        )
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_handle_tool_create_program_is_awaitable(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await handle_tool(
            "create_program",
            {
                "name": "My program",
                "days": [{"name": "Push", "exercises": [{"exercise_id": "bench-press", "sets": 3, "reps": 8}]}],
            },
        )
    assert "program_id" in result
