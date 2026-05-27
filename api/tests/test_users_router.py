import os
import pytest
from datetime import date
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_get_profile_returns_404_when_no_row(mock_conn, make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/users/profile")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_profile_returns_data_when_row_exists(mock_conn, make_mock_get_conn):
    mock_cur = AsyncMock()
    mock_cur.fetchone = AsyncMock(return_value=(
        "00000000-0000-0000-0000-000000000001",
        "ola@example.com",
        "Ola", "Nordmann",
        ["build_muscle", "get_stronger"],
        "beginner", 4, "male",
        date(1995, 6, 15), 180, 80.0, None,
        "no", "friend",
        None, None, None, None,
    ))
    mock_cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=mock_cur)

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/users/profile")

    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Ola"
    assert data["last_name"] == "Nordmann"
    assert data["goals"] == ["build_muscle", "get_stronger"]
    assert data["height_cm"] == 180
    assert data["birth_date"] == "1995-06-15"


@pytest.mark.asyncio
async def test_post_profile_creates_row(mock_conn, make_mock_get_conn):
    mock_conn.execute = AsyncMock(return_value=AsyncMock())
    mock_conn.commit = AsyncMock()

    payload = {
        "email": "ola@example.com",
        "first_name": "Ola",
        "last_name": "Nordmann",
        "goals": ["build_muscle", "get_stronger"],
        "experience_level": "beginner",
        "training_days_per_week": 4,
        "gender": "male",
        "birth_date": "1995-06-15",
        "height_cm": 180,
        "weight_kg": 80.0,
        "avatar_url": None,
    }

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/users/profile", json=payload)

    assert response.status_code == 200
    assert response.json() == {"ok": True}
    mock_conn.execute.assert_called_once()
    mock_conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_post_profile_is_idempotent(mock_conn, make_mock_get_conn):
    mock_conn.execute = AsyncMock(return_value=AsyncMock())
    mock_conn.commit = AsyncMock()

    payload = {
        "email": "ola@example.com",
        "first_name": "Ola",
        "last_name": "Nordmann",
        "goals": ["maintain"],
        "experience_level": "intermediate",
        "training_days_per_week": 3,
        "gender": "other",
        "birth_date": "1990-01-01",
        "height_cm": 170,
        "weight_kg": 65.5,
        "avatar_url": "https://example.com/avatar.jpg",
    }

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            r1 = await client.post("/api/users/profile", json=payload)
            r2 = await client.post("/api/users/profile", json=payload)

    assert r1.status_code == 200
    assert r2.status_code == 200


@pytest.mark.asyncio
async def test_get_profile_returns_lag1_data(mock_conn, make_mock_get_conn):
    """GET /api/users/profile returns injuries, preferences, equipment, constraints plus new fields."""
    user_row = (
        "u-1", "trym@example.com", "Trym", "Vestengen",
        ["build_muscle"], "intermediate", 4,
        "male", "1995-06-01", 180, 75.5, None, "no", "friend",
        "moderate", 3, "evening", 60,
    )
    injury_rows = [("inj-1", "venstre kne", "vondt", "moderat", "2019-03-01", True)]
    preference_rows = [("pref-1", "exercise", "liker ikke beinpress")]
    equipment_rows = [("barbell",), ("dumbbells_20kg",)]
    constraint_rows = [("con-1", "schedule", "kun tirs/tors/lør")]

    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=[user_row])
    cur.fetchall = AsyncMock(side_effect=[injury_rows, preference_rows, equipment_rows, constraint_rows])
    mock_conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.users.get_conn", new=make_mock_get_conn(mock_conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            resp = await client.get("/api/users/profile")

    assert resp.status_code == 200
    body = resp.json()
    assert body["activity_level"] == "moderate"
    assert body["years_training"] == 3
    assert body["preferred_training_time"] == "evening"
    assert body["max_session_duration_min"] == 60
    assert body["injuries"][0]["body_part"] == "venstre kne"
    assert body["preferences"][0]["preference"] == "liker ikke beinpress"
    assert body["equipment"] == ["barbell", "dumbbells_20kg"]
    assert body["constraints"][0]["description"] == "kun tirs/tors/lør"
