import os
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_get_exercises_returns_list(make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchall = AsyncMock(return_value=[
        (
            "squat", "Squat", ["quads", "glutes", "hamstrings"], ["barbell", "rack"], "intermediate",
            ["quads", "glutes", "hamstrings"], ["calves"],
            ["https://example.com/squat.jpg"], False, False, None,
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
            [], False, False, None,
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
            False, False, None,
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


@pytest.mark.asyncio
async def test_get_exercises_includes_favorite_and_custom_flags(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    # id, name, primary_muscles, equipment, difficulty, primary, secondary, image_urls, is_custom, is_favorite, last_used
    cur.fetchall = AsyncMock(return_value=[
        ("bench-press", "Benkpress", ["chest"], ["barbell"], "intermediate",
         ["chest"], ["triceps"], [], False, True, None),
        ("usr-1", "Magnus' curl", ["biceps"], ["dumbbell"], "beginner",
         ["biceps"], [], [], True, False, None),
    ])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).get("/api/exercises")
    assert resp.status_code == 200
    body = resp.json()
    assert body[0]["is_favorite"] is True
    assert body[0]["is_custom"] is False
    assert body[1]["is_custom"] is True


@pytest.mark.asyncio
async def test_create_custom_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("usr-abc", "Magnus' curl"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/exercises", json={
        "name": "Magnus' curl", "primary_muscles": ["biceps"], "equipment": ["dumbbell"],
    })
    assert resp.status_code == 201
    assert resp.json()["name"] == "Magnus' curl"
    assert resp.json()["id"].startswith("usr-")


@pytest.mark.asyncio
async def test_create_custom_exercise_requires_name(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/exercises", json={"primary_muscles": ["biceps"]})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_delete_custom_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("usr-abc",))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/exercises/usr-abc")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_delete_custom_exercise_404_when_not_own(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/exercises/bench-press")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_favorite_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    mock_conn.execute = AsyncMock(return_value=AsyncMock())
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/exercises/bench-press/favorite")
    assert resp.status_code == 200
    assert resp.json()["is_favorite"] is True


@pytest.mark.asyncio
async def test_unfavorite_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    mock_conn.execute = AsyncMock(return_value=AsyncMock())
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/exercises/bench-press/favorite")
    assert resp.status_code == 200
    assert resp.json()["is_favorite"] is False
