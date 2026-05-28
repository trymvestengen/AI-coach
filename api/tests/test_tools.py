import pytest
from app.tools.handlers import get_exercise_info, search_exercises, handle_tool


def test_get_exercise_info_returns_known_exercise():
    result = get_exercise_info("bench-press")
    assert result["id"] == "bench-press"
    assert "chest" in result["muscle_groups"]
    assert "instructions" in result


def test_get_exercise_info_unknown_returns_error():
    result = get_exercise_info("made-up-exercise")
    assert "error" in result


def test_search_exercises_by_muscle_group():
    results = search_exercises(muscle_group="chest")
    assert len(results) > 0
    assert all(any("chest" in mg.lower() for mg in r["muscle_groups"]) for r in results)


def test_search_exercises_by_equipment():
    results = search_exercises(equipment="dumbbell")
    assert len(results) > 0


def test_search_exercises_no_filters_returns_all():
    results = search_exercises()
    assert len(results) == 15


def test_search_exercises_by_difficulty():
    results = search_exercises(difficulty="beginner")
    assert len(results) > 0
    assert all(r["difficulty"] == "beginner" for r in results)


@pytest.mark.asyncio
async def test_handle_tool_get_exercise_info():
    result = await handle_tool("get_exercise_info", {"exercise_id": "squat"})
    assert result["id"] == "squat"


@pytest.mark.asyncio
async def test_handle_tool_search_exercises():
    result = await handle_tool("search_exercises", {"muscle_group": "back"})
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_handle_tool_unknown_returns_error():
    result = await handle_tool("nonexistent_tool", {})
    assert "error" in result


@pytest.mark.asyncio
async def test_handle_tool_routes_save_profile_field(monkeypatch):
    from app.tools import handlers
    called = {}

    async def fake_save(user_id, field, value):
        called["args"] = (user_id, field, value)
        return {"ok": True, "field": field}

    monkeypatch.setattr("app.tools.handlers.onboarding_handlers.save_profile_field", fake_save)
    result = await handlers.handle_tool(
        "save_profile_field",
        {"field": "experience_level", "value": "beginner"},
        user_id="user-123",
    )
    assert result == {"ok": True, "field": "experience_level"}
    assert called["args"] == ("user-123", "experience_level", "beginner")


@pytest.mark.asyncio
async def test_handle_tool_routes_add_equipment_batch(monkeypatch):
    from app.tools import handlers
    async def fake_add(user_id, items):
        return {"ok": True, "count": len(items)}
    monkeypatch.setattr("app.tools.handlers.onboarding_handlers.add_equipment_batch", fake_add)
    result = await handlers.handle_tool(
        "add_equipment_batch", {"items": ["barbell", "rack"]}, user_id="user-123"
    )
    assert result == {"ok": True, "count": 2}


@pytest.mark.asyncio
async def test_handle_tool_routes_complete_onboarding(monkeypatch):
    from app.tools import handlers
    async def fake_complete(user_id):
        return {"ok": True, "status": "complete"}
    monkeypatch.setattr("app.tools.handlers.onboarding_handlers.complete_onboarding", fake_complete)
    result = await handlers.handle_tool(
        "complete_onboarding", {}, user_id="user-123"
    )
    assert result == {"ok": True, "status": "complete"}
