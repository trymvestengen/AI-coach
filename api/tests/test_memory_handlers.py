import pytest
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_get_user_profile_returns_all_layers(monkeypatch, mock_conn, make_mock_get_conn):
    """get_user_profile returns user row + active injuries + preferences + equipment + constraints."""

    user_row = ("user-id-1", "trym@example.com", "Trym", "no", "friend", "Bygge muskler")
    injury_rows = [("inj-1", "venstre kne", "vondt ved dyp knebøy", "moderat", "2019-03-01")]
    preference_rows = [("pref-1", "exercise", "liker ikke beinpress")]
    equipment_rows = [("barbell",), ("dumbbells_20kg",)]
    constraint_rows = [("con-1", "schedule", "kun tirs/tors/lør")]

    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=[user_row])
    cur.fetchall = AsyncMock(side_effect=[injury_rows, preference_rows, equipment_rows, constraint_rows])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_user_profile
    result = await get_user_profile("user-id-1")

    assert result["name"] == "Trym"
    assert result["persona_mode"] == "friend"
    assert result["goals"] == "Bygge muskler"
    assert len(result["injuries"]) == 1
    assert result["injuries"][0]["body_part"] == "venstre kne"
    assert len(result["preferences"]) == 1
    assert result["equipment"] == ["barbell", "dumbbells_20kg"]
    assert len(result["constraints"]) == 1


@pytest.mark.asyncio
async def test_handle_tool_routes_get_user_profile(monkeypatch):
    from app.tools import handlers

    called = {}

    async def fake_get_user_profile(user_id):
        called["user_id"] = user_id
        return {"name": "Test"}

    monkeypatch.setattr("app.tools.memory_handlers.get_user_profile", fake_get_user_profile)
    result = await handlers.handle_tool("get_user_profile", {})
    assert result == {"name": "Test"}
    assert "user_id" in called


@pytest.mark.asyncio
async def test_get_workout_history_returns_recent_workouts(monkeypatch, mock_conn, make_mock_get_conn):
    workout_rows = [
        ("w1", "2026-05-26 10:00", "2026-05-26 11:00", "RPE 7", "Good session, squat strong"),
        ("w2", "2026-05-24 10:00", "2026-05-24 11:00", None, "Tired, dropped last set"),
    ]
    set_rows_w1 = [
        ("squat", 1, 5, 80.0, 7, "5/5 strong, felt easy"),
        ("squat", 2, 5, 82.5, 8, "5/5 last rep grindy"),
    ]
    set_rows_w2 = [
        ("squat", 1, 5, 80.0, 8, "felt heavy, low energy"),
    ]

    cur = AsyncMock()
    cur.fetchall = AsyncMock(side_effect=[workout_rows, set_rows_w1, set_rows_w2])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_workout_history
    result = await get_workout_history("user-1", exercise_id="squat", limit=5)

    assert len(result) == 2
    assert result[0]["coach_summary"] == "Good session, squat strong"
    assert result[0]["sets"][0]["coach_note"] == "5/5 strong, felt easy"
    assert result[0]["sets"][1]["weight_kg"] == 82.5
    assert result[1]["sets"][0]["coach_note"] == "felt heavy, low energy"
