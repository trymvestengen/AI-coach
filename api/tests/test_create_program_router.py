import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_create_program_minimal(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000010")
    cur_insert = AsyncMock()
    cur_insert.fetchone = AsyncMock(return_value=(prog_id, "My Program", False, None))

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_insert)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/programs", json={"name": "My Program"})

    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "My Program"
    assert data["is_active"] is False
    assert data["days"] == []


@pytest.mark.asyncio
async def test_create_program_with_first_day_weekdays(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000011")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000020")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id, "PPL", False, None))
    cur_day = AsyncMock()
    cur_day.fetchone = AsyncMock(return_value=(day_id, "Push", [1, 3, 5], None, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/programs", json={
                "name": "PPL",
                "first_day": {"name": "Push", "weekdays": [1, 3, 5]},
            })

    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "PPL"
    assert len(data["days"]) == 1
    assert data["days"][0]["name"] == "Push"
    assert data["days"][0]["weekdays"] == [1, 3, 5]
    assert data["days"][0]["frequency_per_week"] is None


@pytest.mark.asyncio
async def test_create_program_with_first_day_frequency(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000012")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000021")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id, "FB", False, None))
    cur_day = AsyncMock()
    cur_day.fetchone = AsyncMock(return_value=(day_id, "Full body", [], 3, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/programs", json={
                "name": "FB",
                "first_day": {"name": "Full body", "frequency_per_week": 3},
            })

    assert res.status_code == 201
    data = res.json()
    assert data["days"][0]["weekdays"] == []
    assert data["days"][0]["frequency_per_week"] == 3


@pytest.mark.asyncio
async def test_create_program_rejects_first_day_without_schedule():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/programs", json={
            "name": "Bad",
            "first_day": {"name": "X"},  # no weekdays, no frequency
        })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_program_rejects_first_day_with_both_schedules():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/programs", json={
            "name": "Bad",
            "first_day": {"name": "X", "weekdays": [1], "frequency_per_week": 3},
        })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_program_rejects_invalid_weekday():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/programs", json={
            "name": "Bad",
            "first_day": {"name": "X", "weekdays": [7]},  # 7 is out of range
        })
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_create_program_rejects_empty_name():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/programs", json={"name": ""})
    assert res.status_code == 422
