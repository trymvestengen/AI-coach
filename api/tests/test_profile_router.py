import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_create_injury_inserts_row(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(
        "inj-1", "venstre kne", "vondt ved knebøy", "moderat", "2019-03-01", True,
    ))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/injuries", json={
        "body_part": "venstre kne",
        "description": "vondt ved knebøy",
        "severity": "moderat",
        "started_at": "2019-03-01",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["body_part"] == "venstre kne"
    assert body["severity"] == "moderat"


@pytest.mark.asyncio
async def test_update_injury(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(
        "inj-1", "venstre kne", "redusert smerte", "lett", "2019-03-01", True,
    ))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.patch("/api/users/injuries/inj-1", json={
        "description": "redusert smerte",
        "severity": "lett",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["description"] == "redusert smerte"


@pytest.mark.asyncio
async def test_delete_injury(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.rowcount = 1
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/users/injuries/inj-1")
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"


@pytest.mark.asyncio
async def test_create_preference(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("pref-1", "exercise", "liker ikke beinpress"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/preferences", json={"category": "exercise", "preference": "liker ikke beinpress"})
    assert resp.status_code == 200
    assert resp.json()["preference"] == "liker ikke beinpress"


@pytest.mark.asyncio
async def test_create_preference_rejects_invalid_category(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/users/preferences", json={"category": "bogus", "preference": "x"})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_delete_preference(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.rowcount = 1
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.profile.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/users/preferences/pref-1")
    assert resp.status_code == 200
