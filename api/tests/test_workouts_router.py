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
    dt_done = datetime(2026, 4, 23, 11, 0, 0, tzinfo=timezone.utc)
    dt_start = datetime(2026, 4, 23, 10, 0, 0, tzinfo=timezone.utc)
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[
        (
            "aaaaaaaa-0000-0000-0000-000000000001",
            dt_done,
            dt_start,
            None,    # notes
            7,       # rpe
            "Push",  # day_name
            "PPL",   # program_name
            3,       # exercise_count
            9,       # set_count
            1500.0,  # total_volume_kg
            60,      # duration_min
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
    assert data[0]["day_name"] == "Push"
    assert data[0]["program_name"] == "PPL"
    assert data[0]["exercise_count"] == 3
    assert data[0]["set_count"] == 9
    assert data[0]["total_volume_kg"] == 1500.0
    assert data[0]["duration_min"] == 60


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
    template_id = uuid.UUID("dddddddd-0000-0000-0000-000000000001")
    started = dt.datetime(2026, 6, 6, 10, 0, 0, tzinfo=dt.timezone.utc)
    logged_sets = [
        {"exercise_id": "Squat", "set_number": 1, "reps": 5, "weight_kg": 80.0},
        {"exercise_id": "Squat", "set_number": 2, "reps": 5, "weight_kg": 80.0},
    ]
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(wid, started, template_id, "Push", logged_sets, 2))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/workouts/in-progress")

    body = res.json()
    assert body is not None
    assert body["workout_id"] == str(wid)
    assert body["template_id"] == str(template_id)
    assert body["logged_sets"] == logged_sets
    assert body["sets_logged"] == 2
    assert body["day_name"] == "Push"


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


@pytest.mark.asyncio
async def test_start_workout_from_template(monkeypatch, mock_conn, make_mock_get_conn):
    from unittest.mock import AsyncMock
    from fastapi.testclient import TestClient
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1",))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/workouts", json={"template_id": "t-1"})
    assert resp.status_code in (200, 201)


@pytest.mark.asyncio
async def test_start_workout_rejects_unowned_template(monkeypatch, mock_conn, make_mock_get_conn):
    from unittest.mock import AsyncMock
    from fastapi.testclient import TestClient
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/workouts", json={"template_id": "t-x"})
    assert resp.status_code == 404


# --- Task 2: log_set UPSERT + template_id i get_workout ---

@pytest.mark.asyncio
async def test_log_set_upserts(monkeypatch, mock_conn, make_mock_get_conn):
    from unittest.mock import AsyncMock
    from fastapi.testclient import TestClient
    wid = "aaaaaaaa-0000-0000-0000-000000000001"
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(wid,))
    cur_ins = AsyncMock()
    cur_ins.fetchone = AsyncMock(return_value=(wid,))
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_ins])
    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post(
        f"/api/workouts/{wid}/sets",
        json={"exercise_id": "squat", "set_number": 1, "reps": 5, "weight_kg": 80},
    )
    assert resp.status_code == 201
    sql = mock_conn.execute.call_args_list[-1].args[0]
    assert "ON CONFLICT" in sql.upper()


@pytest.mark.asyncio
async def test_get_workout_includes_template_id(monkeypatch, mock_conn, make_mock_get_conn):
    """get_workout should include template_id (can be None) in response."""
    import datetime as dt
    from unittest.mock import AsyncMock
    from fastapi.testclient import TestClient
    wid = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000099")
    started = dt.datetime(2026, 6, 14, 10, 0, 0, tzinfo=dt.timezone.utc)

    # No template_id → only 2 execute calls needed: workout row + sets
    cur_workout = AsyncMock()
    cur_workout.fetchone = AsyncMock(return_value=(wid, started, None, None))
    cur_sets = AsyncMock()
    cur_sets.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(side_effect=[cur_workout, cur_sets])
    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).get(f"/api/workouts/{wid}")
    assert resp.status_code == 200
    body = resp.json()
    assert "template_id" in body
    assert body["template_id"] is None
