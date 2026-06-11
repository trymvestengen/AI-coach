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
    result = await handlers.handle_tool("get_user_profile", {}, "user-1")
    assert result == {"name": "Test"}
    assert called["user_id"] == "user-1"


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


@pytest.mark.asyncio
async def test_get_progression_returns_weekly_aggregates(monkeypatch, mock_conn, make_mock_get_conn):
    rows = [
        ("2026-05-25", 85.0, 1700.0, 7.5, 10),
        ("2026-05-18", 82.5, 1650.0, 7.0, 10),
        ("2026-05-11", 80.0, 1600.0, 7.0, 10),
    ]
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_progression
    result = await get_progression("user-1", "squat", weeks=12)

    assert len(result) == 3
    assert result[0]["max_weight_kg"] == 85.0
    assert result[0]["total_volume_kg"] == 1700.0
    assert result[0]["avg_rpe"] == 7.5
    assert result[0]["set_count"] == 10


@pytest.mark.asyncio
async def test_search_observations_filters_by_category_and_window(monkeypatch, mock_conn, make_mock_get_conn):
    rows = [
        ("obs-1", "pattern", "Trains better in mornings", "high", "2026-05-25"),
        ("obs-2", "pattern", "Drops last set when tired", "medium", "2026-05-20"),
    ]
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import search_observations
    result = await search_observations("user-1", category="pattern", days=90, limit=20)
    assert len(result) == 2
    assert result[0]["observation"] == "Trains better in mornings"
    assert result[0]["confidence"] == "high"


@pytest.mark.asyncio
async def test_get_recent_sessions_returns_summaries(monkeypatch, mock_conn, make_mock_get_conn):
    rows = [
        ("s-1", "2026-05-26 10:00", "Talked about deadlift form", "w-1"),
        ("s-2", "2026-05-24 10:00", "Planned next week, lower volume", None),
    ]
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_recent_sessions
    result = await get_recent_sessions("user-1", days=30, limit=10)
    assert len(result) == 2
    assert result[0]["summary"] == "Talked about deadlift form"
    assert result[0]["workout_id"] == "w-1"
    assert result[1]["workout_id"] is None


@pytest.mark.asyncio
async def test_write_observation_inserts_row(monkeypatch, mock_conn, make_mock_get_conn):
    captured = {}

    async def fake_execute(sql, params):
        captured["sql"] = sql
        captured["params"] = params
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=("new-obs-id",))
        return cur

    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import write_observation
    result = await write_observation(
        "user-1",
        category="pattern",
        observation="User trains better in mornings",
        confidence="high",
        related_workout_id=None,
    )

    assert result["id"] == "new-obs-id"
    assert "INSERT INTO coach_observations" in captured["sql"]
    assert "user-1" in captured["params"]
    assert "pattern" in captured["params"]


@pytest.mark.asyncio
async def test_write_observation_rejects_invalid_category(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))
    from app.tools.memory_handlers import write_observation
    result = await write_observation(
        "user-1",
        category="invalid_category",
        observation="x",
    )
    assert "error" in result


@pytest.mark.asyncio
async def test_log_set_with_note_inserts_row(monkeypatch, mock_conn, make_mock_get_conn):
    captured = {}

    async def fake_execute(sql, params):
        captured["sql"] = sql
        captured["params"] = params
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=("new-set-id",))
        return cur

    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import log_set_with_note
    result = await log_set_with_note(
        "user-1",
        workout_id="w-1",
        exercise_id="squat",
        set_number=3,
        reps=5,
        weight_kg=82.5,
        rpe=7,
        coach_note="5/5 strong, suggested 85 next",
    )

    assert result["id"] == "new-set-id"
    assert "INSERT INTO workout_sets" in captured["sql"]
    assert "5/5 strong, suggested 85 next" in captured["params"]
