import os
import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_get_workouts_returns_empty_list(mock_conn, make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/workouts")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_workouts_returns_workout_list(make_mock_get_conn):
    dt = datetime(2026, 4, 23, 10, 0, 0, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[
        (
            "aaaaaaaa-0000-0000-0000-000000000001",
            dt,
            None,
            7,
            dt,   # started_at
            [{"exercise_id": "squat", "set_number": 1, "reps": 5, "weight_kg": 80.0, "rpe": 7}],
        )
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/workouts")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["workout_id"] == "aaaaaaaa-0000-0000-0000-000000000001"
    assert data[0]["rpe"] == 7
    assert len(data[0]["sets"]) == 1
