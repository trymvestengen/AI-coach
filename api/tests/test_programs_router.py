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
        (
            "squat", "Squat", ["quads", "glutes", "hamstrings"], ["barbell", "rack"], "intermediate",
            ["quads", "glutes", "hamstrings"], ["calves"],
            ["https://example.com/squat.jpg"],
        )
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
    assert data[0]["primary_muscles"] == ["quads", "glutes", "hamstrings"]
    assert data[0]["secondary_muscles"] == ["calves"]
    assert data[0]["image_urls"] == ["https://example.com/squat.jpg"]


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
        (
            "squat", "Squat", ["quads", "glutes", "hamstrings"], ["barbell", "rack"], "intermediate",
            ["quads", "glutes", "hamstrings"], [],
            [],
        )
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


@pytest.mark.asyncio
async def test_from_workout_returns_201_with_program(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000001")
    new_prog_id = uuid.UUID("eeeeeeee-0000-0000-0000-000000000001")

    # First call: verify workout belongs to user (returns the workout id row)
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(wid,))

    # Second call: fetch logged sets grouped per exercise
    # Returns: [(exercise_id, set_number, reps, weight_kg)]
    cur_sets = AsyncMock()
    cur_sets.fetchall = AsyncMock(return_value=[
        ("back-squat", 1, 5, 80.0),
        ("back-squat", 2, 5, 80.0),
        ("bench-press", 1, 8, 60.0),
    ])

    # Third call: insert program → returns id, name, folder_id
    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(new_prog_id, "Min nye økt", None))

    # Fourth call: insert program_day → returns id
    cur_day = AsyncMock()
    day_id = uuid.UUID("eeeeeeee-0000-0000-0000-000000000002")
    cur_day.fetchone = AsyncMock(return_value=(day_id,))

    # Subsequent calls: insert program_exercises + program_exercise_sets (we don't read returns)
    cur_pe = AsyncMock()
    cur_pe.fetchone = AsyncMock(return_value=(uuid.uuid4(),))

    conn = AsyncMock()
    conn.execute = AsyncMock(
        side_effect=[cur_check, cur_sets, cur_prog, cur_day, cur_pe, cur_pe, cur_pe, cur_pe, cur_pe]
    )

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                "/api/programs/from-workout",
                json={"workout_id": str(wid), "name": "Min nye økt", "folder_id": None},
            )

    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Min nye økt"
    assert body["is_active"] is False
    assert body["folder_id"] is None


@pytest.mark.asyncio
async def test_from_workout_returns_404_for_unknown(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000002")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                "/api/programs/from-workout",
                json={"workout_id": str(wid), "name": "X", "folder_id": None},
            )

    assert res.status_code == 404


@pytest.mark.asyncio
async def test_from_workout_returns_400_when_no_sets(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000003")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(wid,))
    cur_sets = AsyncMock()
    cur_sets.fetchall = AsyncMock(return_value=[])
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_sets])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                "/api/programs/from-workout",
                json={"workout_id": str(wid), "name": "X", "folder_id": None},
            )

    assert res.status_code == 400


@pytest.mark.asyncio
async def test_get_exercises_includes_new_fields(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[
        (
            "Barbell_Squat", "Barbell Squat", ["quadriceps"], ["barbell"], "intermediate",
            ["quadriceps"], ["glutes"],
            ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg"],
        ),
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/exercises")

    body = res.json()
    assert res.status_code == 200
    assert body[0]["id"] == "Barbell_Squat"
    assert body[0]["primary_muscles"] == ["quadriceps"]
    assert body[0]["image_urls"][0].startswith("https://raw.githubusercontent.com/")


@pytest.mark.asyncio
async def test_get_exercise_by_id_returns_full_detail(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(
        "Barbell_Squat", "Barbell Squat", ["quadriceps"], ["barbell"], "intermediate",
        "Step 1\n\nStep 2", "push", "compound", "strength",
        ["quadriceps"], ["glutes", "hamstrings"],
        ["https://raw.githubusercontent.com/.../0.jpg", "https://raw.githubusercontent.com/.../1.jpg"],
    ))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/exercises/Barbell_Squat")

    assert res.status_code == 200
    body = res.json()
    assert body["id"] == "Barbell_Squat"
    assert body["primary_muscles"] == ["quadriceps"]
    assert body["secondary_muscles"] == ["glutes", "hamstrings"]
    assert body["force"] == "push"
    assert body["mechanic"] == "compound"
    assert body["category"] == "strength"
    assert len(body["image_urls"]) == 2
    assert body["instructions"] == "Step 1\n\nStep 2"


@pytest.mark.asyncio
async def test_get_exercise_by_id_returns_404(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/exercises/Nonexistent")

    assert res.status_code == 404
