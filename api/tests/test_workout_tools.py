import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone

from app.tools.handlers.workout_handlers import log_workout
from app.tools.handlers.read_handlers import get_user_history, suggest_progression
from app.tools.dispatcher import handle_tool

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_log_workout_returns_workout_id(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await log_workout(
            user_id=TEST_USER_ID,
            exercises=[{"exercise_id": "squat", "sets": [{"reps": 5, "weight_kg": 80}]}]
        )
    assert result["ok"] is True
    assert "workout_id" in result
    assert result["message"] == "Workout logged successfully"


@pytest.mark.asyncio
async def test_log_workout_calls_commit(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        await log_workout(
            user_id=TEST_USER_ID,
            exercises=[{"exercise_id": "bench-press", "sets": [{"reps": 8, "weight_kg": 60}]}]
        )
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_get_user_history_returns_list(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await get_user_history(user_id=TEST_USER_ID)
    assert result["ok"] is True
    assert isinstance(result["data"], list)


@pytest.mark.asyncio
async def test_suggest_progression_no_history(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await suggest_progression(user_id=TEST_USER_ID, exercise_id="squat")
    assert result["suggested_weight_kg"] is None
    assert "No history" in result["suggestion"]


@pytest.mark.asyncio
async def test_suggest_progression_low_rpe_adds_2_5kg(make_mock_get_conn):
    dt = datetime(2026, 4, 23, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[(dt, 80.0, 6), (dt, 80.0, 7)])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(conn)):
        result = await suggest_progression(user_id=TEST_USER_ID, exercise_id="squat")
    assert result["suggested_weight_kg"] == 82.5


@pytest.mark.asyncio
async def test_suggest_progression_high_rpe_keeps_weight(make_mock_get_conn):
    dt = datetime(2026, 4, 23, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[(dt, 80.0, 8), (dt, 80.0, 9)])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=mock_cur)
    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(conn)):
        result = await suggest_progression(user_id=TEST_USER_ID, exercise_id="squat")
    assert result["suggested_weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_handle_tool_log_workout_is_awaitable(mock_conn, make_mock_get_conn):
    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(mock_conn)):
        result = await handle_tool(
            TEST_USER_ID,
            "log_workout",
            {"exercises": [{"exercise_id": "squat", "sets": [{"reps": 5, "weight_kg": 80}]}]},
        )
    assert result["ok"] is True
    assert "workout_id" in result


@pytest.mark.asyncio
async def test_log_workout_persists_coach_summary_and_set_notes(monkeypatch, mock_conn, make_mock_get_conn):
    insert_calls = []

    async def fake_execute(sql, params=None):
        insert_calls.append((sql, params))
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=None)
        return cur

    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.tools.handlers.workout_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.handlers.workout_handlers import log_workout as _log_workout
    result = await _log_workout(
        user_id=TEST_USER_ID,
        exercises=[
            {
                "exercise_id": "squat",
                "sets": [
                    {"reps": 5, "weight_kg": 80, "rpe": 7, "coach_note": "felt easy"},
                    {"reps": 5, "weight_kg": 82.5, "rpe": 8, "coach_note": "grindy last rep"},
                ],
            },
        ],
        notes="Good day",
        rpe=7,
        coach_summary="Squat looked strong, RPE controlled.",
    )

    workout_inserts = [c for c in insert_calls if "INSERT INTO workouts" in c[0]]
    set_inserts = [c for c in insert_calls if "INSERT INTO workout_sets" in c[0]]
    assert any("coach_summary" in c[0] for c in workout_inserts)
    assert any("coach_note" in c[0] for c in set_inserts)
    assert "felt easy" in set_inserts[0][1]
    assert "Squat looked strong, RPE controlled." in workout_inserts[0][1]
    assert result.get("status") != "error"
