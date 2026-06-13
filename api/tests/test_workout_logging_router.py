# api/tests/test_workout_logging_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

WORKOUT_ID = uuid.UUID("cccccccc-0000-0000-0000-000000000001")
DT = datetime(2026, 4, 24, 10, 0, 0, tzinfo=timezone.utc)


@pytest.mark.asyncio
async def test_start_workout_returns_workout_id(make_mock_get_conn):
    conn = AsyncMock()
    conn.commit = AsyncMock()

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/workouts", json={})

    assert response.status_code == 201
    data = response.json()
    assert "workout_id" in data
    assert "template_id" in data


@pytest.mark.asyncio
async def test_log_set_returns_201(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(WORKOUT_ID,))
    cur_insert = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_insert])
    conn.commit = AsyncMock()

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/workouts/{WORKOUT_ID}/sets",
                json={"exercise_id": "bench-press", "set_number": 1, "reps": 8, "weight_kg": 80.0},
            )

    assert response.status_code == 201
    data = response.json()
    assert data["exercise_id"] == "bench-press"
    assert data["reps"] == 8
    assert data["weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_log_set_returns_404_for_unknown_workout(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/workouts/{WORKOUT_ID}/sets",
                json={"exercise_id": "bench-press", "set_number": 1, "reps": 8},
            )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_complete_workout_returns_completed_at(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(WORKOUT_ID, DT))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()

    async def fake_generate(workout_id):
        return "summary"

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)), \
         patch("app.routers.workouts.generate_workout_summary", new=fake_generate):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/workouts/{WORKOUT_ID}/complete",
                json={"rpe": 8},
            )

    assert response.status_code == 200
    data = response.json()
    assert "workout_id" in data
    assert "completed_at" in data


@pytest.mark.asyncio
async def test_complete_workout_returns_404_when_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/workouts/{WORKOUT_ID}/complete",
                json={},
            )

    assert response.status_code == 404
