import os
import uuid
import datetime
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_last_logged_returns_per_exercise(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000060")

    cur_exids = AsyncMock()
    cur_exids.fetchall = AsyncMock(return_value=[("ex-a",), ("ex-b",)])

    completed = datetime.datetime(2026, 6, 1, 12, 0, 0)
    cur_logged = AsyncMock()
    cur_logged.fetchall = AsyncMock(return_value=[
        ("ex-a", 10, 80.0, completed),
        ("ex-b", 8, 60.0, completed),
    ])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_exids, cur_logged])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get(f"/api/programs/{prog_id}/last-logged")

    assert res.status_code == 200
    data = res.json()
    assert data["ex-a"]["reps"] == 10
    assert data["ex-a"]["weight_kg"] == 80.0
    assert data["ex-b"]["reps"] == 8


@pytest.mark.asyncio
async def test_last_logged_empty_program(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000061")
    cur_exids = AsyncMock()
    cur_exids.fetchall = AsyncMock(return_value=[])

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_exids)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get(f"/api/programs/{prog_id}/last-logged")

    assert res.status_code == 200
    assert res.json() == {}
