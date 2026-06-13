import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_list_templates(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[("t-1", "Pull A", "f-1", 4)])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.get("/api/templates")
    assert resp.status_code == 200
    assert resp.json()[0]["name"] == "Pull A"


@pytest.mark.asyncio
async def test_create_template(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1", "Pull A"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/templates", json={"name": "Pull A"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Pull A"


@pytest.mark.asyncio
async def test_create_template_rejects_unowned_folder(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/templates", json={"name": "Pull A", "folder_id": "f-x"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_template_404(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/templates/t-x")
    assert resp.status_code == 404
