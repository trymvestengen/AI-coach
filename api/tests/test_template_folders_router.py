import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_create_folder_inserts_row(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("f-1", "Min PPL"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.template_folders.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/template-folders", json={"name": "Min PPL"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Min PPL"


@pytest.mark.asyncio
async def test_create_folder_rejects_too_long_name(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.template_folders.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/template-folders", json={"name": "x" * 81})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_delete_folder_404_when_not_found(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.template_folders.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/template-folders/f-x")
    assert resp.status_code == 404
