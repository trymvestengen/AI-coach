import os
import uuid
import datetime
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_create_body_metric(make_mock_get_conn):
    metric_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000090")
    now = datetime.datetime(2026, 6, 8, 12, 0, 0)

    cur_insert = AsyncMock()
    cur_insert.fetchone = AsyncMock(return_value=(metric_id, now, 82.5, None, None))

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_insert)

    with patch("app.routers.body_metrics.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                "/api/users/me/body-metrics",
                json={"weight_kg": 82.5},
            )

    assert res.status_code == 201
    data = res.json()
    assert data["weight_kg"] == 82.5


@pytest.mark.asyncio
async def test_create_body_metric_rejects_empty():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/users/me/body-metrics", json={})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_list_body_metrics(make_mock_get_conn):
    now = datetime.datetime(2026, 6, 8, 12, 0, 0)
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[
        (uuid.uuid4(), now, 82.5, 18.0, "morning"),
        (uuid.uuid4(), now, 83.0, None, None),
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.body_metrics.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/users/me/body-metrics")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert data[0]["weight_kg"] == 82.5


@pytest.mark.asyncio
async def test_delete_body_metric(make_mock_get_conn):
    metric_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000091")
    cur_del = AsyncMock()
    cur_del.fetchone = AsyncMock(return_value=(metric_id,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_del)

    with patch("app.routers.body_metrics.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/users/me/body-metrics/{metric_id}")
    assert res.status_code == 204
