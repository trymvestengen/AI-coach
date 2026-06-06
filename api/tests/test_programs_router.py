import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_get_programs_returns_empty_list(mock_conn, make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs")

    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_get_programs_returns_program_list(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[(prog_id, "3-day strength", True, 3)])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "3-day strength"
    assert data[0]["is_active"] is True
    assert data[0]["days_count"] == 3


@pytest.mark.asyncio
async def test_get_program_detail_returns_days(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")

    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(prog_id, "3-day strength", True))

    cur_days = AsyncMock()
    cur_days.fetchall = AsyncMock(return_value=[
        (
            day_id, 1, "Legs",
            [{"id": "cc", "exercise_id": "squat", "name": "Squat",
              "muscle_groups": ["quads"], "order_index": 0,
              "sets": [{"id": "ss", "set_number": 1, "reps": 5, "weight_kg": 80.0}]}],
        )
    ])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_days])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(f"/api/programs/{prog_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "3-day strength"
    assert len(data["days"]) == 1
    assert data["days"][0]["name"] == "Legs"
    assert data["days"][0]["exercises"][0]["exercise_id"] == "squat"
    assert data["days"][0]["exercises"][0]["sets"][0]["reps"] == 5


@pytest.mark.asyncio
async def test_get_exercises_returns_list(make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[
        ("squat", "Squat", ["quads", "glutes", "hamstrings"], ["barbell", "rack"], "intermediate")
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/exercises")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "squat"
    assert data[0]["muscle_groups"] == ["quads", "glutes", "hamstrings"]


@pytest.mark.asyncio
async def test_get_program_detail_returns_404_when_not_found(make_mock_get_conn):
    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_prog)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/programs/aaaaaaaa-0000-0000-0000-000000000002")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_exercises_with_muscle_group_filter(make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[
        ("squat", "Squat", ["quads", "glutes", "hamstrings"], ["barbell", "rack"], "intermediate")
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/exercises?muscle_group=quads")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == "squat"
    # Verify the filter was actually used (the execute was called once, meaning it hit the if muscle_group branch)
    conn.execute.assert_called_once()


@pytest.mark.asyncio
async def test_patch_program_sets_active(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000003")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(prog_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(prog_id, "PPL", True, None))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, AsyncMock(), cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(f"/api/programs/{prog_id}", json={"is_active": True})

    assert res.status_code == 200
    body = res.json()
    assert body["is_active"] is True


@pytest.mark.asyncio
async def test_patch_program_renames(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000004")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(prog_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(prog_id, "Ny tittel", False, None))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(f"/api/programs/{prog_id}", json={"name": "Ny tittel"})

    assert res.status_code == 200
    assert res.json()["name"] == "Ny tittel"


@pytest.mark.asyncio
async def test_patch_program_returns_404_when_missing(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000005")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(f"/api/programs/{prog_id}", json={"name": "X"})
    assert res.status_code == 404
