# api/tests/test_active_program_router.py
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

PROG_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
DAY_ID  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")


@pytest.mark.asyncio
async def test_get_active_program_returns_404_when_none(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs/active")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_active_program_returns_program_with_days(make_mock_get_conn):
    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(PROG_ID, "Hypertrophy 4x", True))

    cur_days = AsyncMock()
    cur_days.fetchall = AsyncMock(return_value=[
        (
            DAY_ID, 1, "Upper A", [1, 3, 5], None,
            [{"id": "cc", "exercise_id": "bench-press", "name": "Bench Press",
              "muscle_groups": ["Chest"], "order_index": 0, "notes": None,
              "sets": [{"id": "ss", "set_number": 1, "reps": 8, "weight_kg": 80.0}]}],
        )
    ])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_days])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs/active")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Hypertrophy 4x"
    assert data["is_active"] is True
    assert len(data["days"]) == 1
    assert data["days"][0]["name"] == "Upper A"
    assert data["days"][0]["weekdays"] == [1, 3, 5]
    assert data["days"][0]["frequency_per_week"] is None
    assert len(data["days"][0]["exercises"]) == 1
    assert data["days"][0]["exercises"][0]["exercise_id"] == "bench-press"
    assert data["days"][0]["exercises"][0]["notes"] is None
