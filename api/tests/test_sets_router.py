import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

PROG_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
DAY_ID  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")
EX_ID   = uuid.UUID("cccccccc-0000-0000-0000-000000000001")
SET_ID  = uuid.UUID("dddddddd-0000-0000-0000-000000000001")


def _cur(fetchone=None, fetchall=None):
    c = AsyncMock()
    c.fetchone = AsyncMock(return_value=fetchone)
    if fetchall is not None:
        c.fetchall = AsyncMock(return_value=fetchall)
    return c


# --- GET exercise detail ---

@pytest.mark.asyncio
async def test_get_exercise_detail_returns_exercise_with_sets(make_mock_get_conn):
    cur_ex   = _cur(fetchone=(EX_ID, "squat", "Squat", ["quads"], 0))
    cur_sets = _cur(fetchall=[(SET_ID, 1, 10, 80.0)])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_sets])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}"
            )

    assert response.status_code == 200
    data = response.json()
    assert data["exercise_id"] == "squat"
    assert len(data["sets"]) == 1
    assert data["sets"][0]["set_number"] == 1
    assert data["sets"][0]["reps"] == 10
    assert data["sets"][0]["weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_get_exercise_detail_returns_404_for_unknown_exercise(make_mock_get_conn):
    cur_ex = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_ex)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}"
            )

    assert response.status_code == 404


# --- POST set ---

@pytest.mark.asyncio
async def test_add_set_returns_new_set(make_mock_get_conn):
    cur_ex      = _cur(fetchone=(EX_ID,))
    cur_set_num = _cur(fetchone=(3,))
    cur_insert  = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_set_num, cur_insert])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets",
                json={"reps": 10, "weight_kg": 80.0},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["set_number"] == 3
    assert data["reps"] == 10
    assert data["weight_kg"] == 80.0


@pytest.mark.asyncio
async def test_add_set_to_empty_exercise_gets_set_number_one(make_mock_get_conn):
    cur_ex      = _cur(fetchone=(EX_ID,))
    cur_set_num = _cur(fetchone=(1,))
    cur_insert  = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_set_num, cur_insert])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets",
                json={"reps": 10},
            )

    assert response.status_code == 200
    assert response.json()["set_number"] == 1


# --- PATCH set ---

@pytest.mark.asyncio
async def test_update_set_returns_updated_values(make_mock_get_conn):
    cur_ex     = _cur(fetchone=(EX_ID,))
    cur_update = _cur(fetchone=(SET_ID, 1, 12, 82.5))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_update])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets/{SET_ID}",
                json={"reps": 12, "weight_kg": 82.5},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["reps"] == 12
    assert data["weight_kg"] == 82.5


@pytest.mark.asyncio
async def test_update_set_returns_404_for_unknown_set(make_mock_get_conn):
    cur_ex     = _cur(fetchone=(EX_ID,))
    cur_update = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_update])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.patch(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets/{SET_ID}",
                json={"reps": 12, "weight_kg": 82.5},
            )

    assert response.status_code == 404


# --- DELETE set ---

@pytest.mark.asyncio
async def test_delete_set_returns_204(make_mock_get_conn):
    cur_ex     = _cur(fetchone=(EX_ID,))
    cur_delete = _cur(fetchone=(SET_ID,))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_delete])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets/{SET_ID}"
            )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_set_returns_404_for_unknown_set(make_mock_get_conn):
    cur_ex     = _cur(fetchone=(EX_ID,))
    cur_delete = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_ex, cur_delete])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}/sets/{SET_ID}"
            )

    assert response.status_code == 404
