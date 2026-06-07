import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_add_day_with_weekdays(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000020")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000030")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id,))
    cur_count = AsyncMock()
    cur_count.fetchone = AsyncMock(return_value=(2,))  # current max day_number
    cur_insert = AsyncMock()
    cur_insert.fetchone = AsyncMock(return_value=(day_id, "Pull", [2, 4], None, 3))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_count, cur_insert])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                f"/api/programs/{prog_id}/days",
                json={"name": "Pull", "weekdays": [2, 4]},
            )

    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Pull"
    assert data["weekdays"] == [2, 4]
    assert data["day_number"] == 3


@pytest.mark.asyncio
async def test_add_day_with_frequency(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000021")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000031")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id,))
    cur_count = AsyncMock()
    cur_count.fetchone = AsyncMock(return_value=(0,))
    cur_insert = AsyncMock()
    cur_insert.fetchone = AsyncMock(return_value=(day_id, "Cardio", [], 2, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_count, cur_insert])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                f"/api/programs/{prog_id}/days",
                json={"name": "Cardio", "frequency_per_week": 2},
            )

    assert res.status_code == 201
    data = res.json()
    assert data["frequency_per_week"] == 2
    assert data["weekdays"] == []


@pytest.mark.asyncio
async def test_add_day_rejects_missing_program(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000022")
    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_prog)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                f"/api/programs/{prog_id}/days",
                json={"name": "X", "weekdays": [1]},
            )

    assert res.status_code == 404
