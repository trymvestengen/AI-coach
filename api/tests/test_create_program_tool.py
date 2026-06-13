import pytest
from unittest.mock import AsyncMock, patch

from app.tools.handlers.template_handlers import create_template
from app.tools.dispatcher import handle_tool

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_create_template_returns_template_id(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await create_template(
            user_id=TEST_USER_ID,
            name="Pull A",
            exercises=[
                {"exercise_id": "squat", "sets": 4, "reps": 5},
            ],
        )
    assert result["ok"] is True
    assert "template_id" in result


@pytest.mark.asyncio
async def test_create_template_calls_commit(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        await create_template(
            user_id=TEST_USER_ID,
            name="Test",
            exercises=[],
        )
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_handle_tool_create_template_is_awaitable(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await handle_tool(
            TEST_USER_ID,
            "create_template",
            {
                "name": "My template",
                "exercises": [{"exercise_id": "bench-press", "sets": 3, "reps": 8}],
            },
        )
    assert result["ok"] is True
    assert "template_id" in result
