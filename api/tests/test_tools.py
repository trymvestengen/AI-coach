import os
import pytest
from unittest.mock import AsyncMock, patch
from app.tools.dispatcher import handle_tool

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_search_exercises_filters_by_muscle_group(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[
        ("Barbell_Squat", "Barbell Squat", ["quadriceps"], ["barbell"], "intermediate"),
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(conn)):
        result = await handle_tool(TEST_USER_ID, "search_exercises", {"muscle_group": "quadriceps"})

    assert result["ok"] is True
    assert len(result["exercises"]) == 1
    assert result["exercises"][0]["id"] == "Barbell_Squat"


@pytest.mark.asyncio
async def test_get_exercise_info_returns_detail(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(
        "Barbell_Squat", "Barbell Squat", ["quadriceps"], ["barbell"],
        "intermediate", "Step 1", "push", "compound", "strength",
        ["quadriceps"], ["glutes"],
        ["https://raw.githubusercontent.com/.../0.jpg"],
    ))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(conn)):
        result = await handle_tool(TEST_USER_ID, "get_exercise_info", {"exercise_id": "Barbell_Squat"})

    assert result["ok"] is True
    assert result["id"] == "Barbell_Squat"
    assert result["instructions"] == "Step 1"
    assert len(result["image_urls"]) == 1


@pytest.mark.asyncio
async def test_get_exercise_info_returns_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(conn)):
        result = await handle_tool(TEST_USER_ID, "get_exercise_info", {"exercise_id": "Nope"})

    assert result["ok"] is False


@pytest.mark.asyncio
async def test_handle_tool_unknown_returns_error():
    result = await handle_tool(TEST_USER_ID, "nonexistent_tool", {})
    assert result["ok"] is False
    assert "error" in result
