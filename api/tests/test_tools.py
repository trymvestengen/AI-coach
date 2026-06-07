import pytest
from app.tools.handlers.read_handlers import get_exercise_info, search_exercises
from app.tools.dispatcher import handle_tool

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_get_exercise_info_returns_known_exercise():
    result = await get_exercise_info(TEST_USER_ID, "bench-press")
    assert result["ok"] is True
    assert result["id"] == "bench-press"
    assert "chest" in result["muscle_groups"]
    assert "instructions" in result


@pytest.mark.asyncio
async def test_get_exercise_info_unknown_returns_error():
    result = await get_exercise_info(TEST_USER_ID, "made-up-exercise")
    assert result["ok"] is False
    assert "error" in result


@pytest.mark.asyncio
async def test_search_exercises_by_muscle_group():
    result = await search_exercises(TEST_USER_ID, muscle_group="chest")
    assert result["ok"] is True
    results = result["data"]
    assert len(results) > 0
    assert all(any("chest" in mg.lower() for mg in r["muscle_groups"]) for r in results)


@pytest.mark.asyncio
async def test_search_exercises_by_equipment():
    result = await search_exercises(TEST_USER_ID, equipment="dumbbell")
    assert result["ok"] is True
    assert len(result["data"]) > 0


@pytest.mark.asyncio
async def test_search_exercises_no_filters_returns_all():
    result = await search_exercises(TEST_USER_ID)
    assert result["ok"] is True
    assert len(result["data"]) == 15


@pytest.mark.asyncio
async def test_search_exercises_by_difficulty():
    result = await search_exercises(TEST_USER_ID, difficulty="beginner")
    assert result["ok"] is True
    results = result["data"]
    assert len(results) > 0
    assert all(r["difficulty"] == "beginner" for r in results)


@pytest.mark.asyncio
async def test_handle_tool_get_exercise_info():
    result = await handle_tool(TEST_USER_ID, "get_exercise_info", {"exercise_id": "squat"})
    assert result["ok"] is True
    assert result["id"] == "squat"


@pytest.mark.asyncio
async def test_handle_tool_search_exercises():
    result = await handle_tool(TEST_USER_ID, "search_exercises", {"muscle_group": "back"})
    assert result["ok"] is True
    assert isinstance(result["data"], list)


@pytest.mark.asyncio
async def test_handle_tool_unknown_returns_error():
    result = await handle_tool(TEST_USER_ID, "nonexistent_tool", {})
    assert result["ok"] is False
    assert "error" in result
