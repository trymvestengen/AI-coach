import pytest
from unittest.mock import AsyncMock, patch

from app.tools.handlers.program_handlers import create_program
from app.tools.dispatcher import handle_tool

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_create_program_returns_program_id(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await create_program(
            user_id=TEST_USER_ID,
            name="3-day strength",
            days=[
                {"name": "Legs", "exercises": [{"exercise_id": "squat", "sets": 4, "reps": 5}]},
            ],
        )
    assert result["ok"] is True
    assert "program_id" in result
    assert result["name"] == "3-day strength"
    assert result["days_count"] == 1


@pytest.mark.asyncio
async def test_create_program_calls_commit(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        await create_program(
            user_id=TEST_USER_ID,
            name="Test",
            days=[{"name": "Day 1", "exercises": []}],
        )
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_create_program_does_not_auto_activate(mock_conn, make_mock_get_conn):
    """New programs must not auto-set is_active=true (no UPDATE programs SET is_active = false)."""
    insert_calls = []

    async def fake_execute(sql, params=None):
        insert_calls.append(sql)
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=None)
        return cur

    mock_conn.execute = fake_execute
    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        await create_program(
            user_id=TEST_USER_ID,
            name="No auto activate",
            days=[{"name": "Day 1", "exercises": []}],
        )

    # Must not contain any UPDATE that sets is_active = false on all programs
    assert not any("UPDATE programs SET is_active" in sql for sql in insert_calls)
    # The INSERT must use is_active = false (not true)
    program_inserts = [sql for sql in insert_calls if "INSERT INTO programs" in sql]
    assert len(program_inserts) == 1
    assert "false" in program_inserts[0]


@pytest.mark.asyncio
async def test_handle_tool_create_program_is_awaitable(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await handle_tool(
            TEST_USER_ID,
            "create_program",
            {
                "name": "My program",
                "days": [{"name": "Push", "exercises": [{"exercise_id": "bench-press", "sets": 3, "reps": 8}]}],
            },
        )
    assert result["ok"] is True
    assert "program_id" in result
