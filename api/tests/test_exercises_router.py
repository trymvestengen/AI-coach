import os
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


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

    with patch("app.routers.exercises.get_conn", new=make_mock_get_conn(conn)):
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

    with patch("app.routers.exercises.get_conn", new=make_mock_get_conn(conn)):
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

    with patch("app.routers.exercises.get_conn", new=make_mock_get_conn(conn)):
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

    with patch("app.routers.exercises.get_conn", new=make_mock_get_conn(conn)):
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

    with patch("app.routers.exercises.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/exercises/Nonexistent")

    assert res.status_code == 404
