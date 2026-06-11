import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_add_exercise_to_day_returns_new_exercise(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog       = AsyncMock(); cur_prog.fetchone       = AsyncMock(return_value=(prog_id,))
    cur_day        = AsyncMock(); cur_day.fetchone        = AsyncMock(return_value=(day_id,))
    cur_order      = AsyncMock(); cur_order.fetchone      = AsyncMock(return_value=(2,))
    cur_ex         = AsyncMock(); cur_ex.fetchone         = AsyncMock(return_value=("Squat", ["quads", "glutes"]))
    cur_insert_ex  = AsyncMock()
    cur_insert_set = AsyncMock()

    conn = AsyncMock()
    # add_exercise_to_day now inserts 3 default sets (3 INSERTs vs 1 previously)
    conn.execute = AsyncMock(side_effect=[
        cur_prog, cur_day, cur_order, cur_ex,
        cur_insert_ex, cur_insert_set, cur_insert_set, cur_insert_set,
    ])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat"},
            )

    assert response.status_code == 200
    data = response.json()
    assert data["exercise_id"] == "squat"
    assert data["order_index"] == 2
    assert len(data["sets"]) == 3
    assert data["sets"][0]["set_number"] == 1
    assert data["sets"][1]["set_number"] == 2
    assert data["sets"][2]["set_number"] == 3
    assert data["sets"][0]["reps"] == 10
    assert data["sets"][0]["weight_kg"] is None
    assert data["sets"][0]["notes"] is None


@pytest.mark.asyncio
async def test_add_exercise_to_day_returns_404_for_invalid_day(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000099")

    cur_prog = AsyncMock(); cur_prog.fetchone = AsyncMock(return_value=(prog_id,))
    cur_day  = AsyncMock(); cur_day.fetchone  = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat"},
            )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_first_exercise_to_empty_day_gets_order_index_zero(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog       = AsyncMock(); cur_prog.fetchone       = AsyncMock(return_value=(prog_id,))
    cur_day        = AsyncMock(); cur_day.fetchone        = AsyncMock(return_value=(day_id,))
    cur_order      = AsyncMock(); cur_order.fetchone      = AsyncMock(return_value=(0,))
    cur_ex         = AsyncMock(); cur_ex.fetchone         = AsyncMock(return_value=("Squat", ["quads"]))
    cur_insert_ex  = AsyncMock()
    cur_insert_set = AsyncMock()

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[
        cur_prog, cur_day, cur_order, cur_ex,
        cur_insert_ex, cur_insert_set, cur_insert_set, cur_insert_set,
    ])
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat"},
            )

    assert response.status_code == 200
    assert response.json()["order_index"] == 0


@pytest.mark.asyncio
async def test_add_exercise_to_day_returns_404_when_program_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000099")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog = AsyncMock(); cur_prog.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_prog)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "squat"},
            )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_add_exercise_to_day_returns_404_when_exercise_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog  = AsyncMock(); cur_prog.fetchone  = AsyncMock(return_value=(prog_id,))
    cur_day   = AsyncMock(); cur_day.fetchone   = AsyncMock(return_value=(day_id,))
    cur_order = AsyncMock(); cur_order.fetchone = AsyncMock(return_value=(0,))
    cur_ex    = AsyncMock(); cur_ex.fetchone    = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_day, cur_order, cur_ex])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post(
                f"/api/programs/{prog_id}/days/{day_id}/exercises",
                json={"exercise_id": "nonexistent-exercise"},
            )

    assert response.status_code == 404
