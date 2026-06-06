import os
import uuid
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


@pytest.mark.asyncio
async def test_completing_workout_triggers_summary_generation(monkeypatch, mock_conn, make_mock_get_conn):
    """When a workout's completed_at is set via the router, the summary generator should be scheduled."""

    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))

    called = {}

    async def fake_generate(workout_id):
        called["workout_id"] = workout_id
        return "summary"

    monkeypatch.setattr("app.routers.workouts.generate_workout_summary", fake_generate)

    # The complete endpoint returns (id, completed_at); mock fetchone to return a row
    from datetime import datetime, timezone
    from unittest.mock import AsyncMock
    completed_dt = datetime(2026, 5, 25, 12, 0, 0, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchone = AsyncMock(return_value=("00000000-0000-0000-0000-000000000abc", completed_dt))
    mock_conn.execute = AsyncMock(return_value=mock_cur)

    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    resp = client.patch(
        "/api/workouts/00000000-0000-0000-0000-000000000abc/complete",
        json={"rpe": 7, "notes": "felt strong"},
    )
    assert resp.status_code in (200, 204)
    assert called.get("workout_id") == "00000000-0000-0000-0000-000000000abc"


@pytest.mark.asyncio
async def test_in_progress_returns_null_when_none(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/workouts/in-progress")

    assert res.status_code == 200
    assert res.json() is None


@pytest.mark.asyncio
async def test_in_progress_returns_workout(make_mock_get_conn):
    import datetime as dt
    wid = uuid.UUID("cccccccc-0000-0000-0000-000000000001")
    started = dt.datetime(2026, 6, 6, 10, 0, 0, tzinfo=dt.timezone.utc)
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(wid, started, 2))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/workouts/in-progress")

    body = res.json()
    assert body is not None
    assert body["workout_id"] == str(wid)
    assert body["sets_logged"] == 2


@pytest.mark.asyncio
async def test_delete_workout_returns_204(make_mock_get_conn):
    wid = uuid.UUID("cccccccc-0000-0000-0000-000000000002")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(wid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/workouts/{wid}")

    assert res.status_code == 204


@pytest.mark.asyncio
async def test_delete_workout_returns_404_when_missing(make_mock_get_conn):
    wid = uuid.UUID("cccccccc-0000-0000-0000-000000000003")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/workouts/{wid}")

    assert res.status_code == 404
