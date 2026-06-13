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


@pytest.mark.asyncio
async def test_patch_template_name_only_no_folder_field(monkeypatch, mock_conn, make_mock_get_conn):
    # PATCH uten folder_id skal IKKE kreve folder_id (ingen 422) og ikke røre folder
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1",))  # malen finnes
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.patch("/api/templates/t-1", json={"name": "Nytt navn"})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_patch_template_move_to_root(monkeypatch, mock_conn, make_mock_get_conn):
    # folder_id=null eksplisitt → flytt til rot (ingen folder-eierskap-sjekk nødvendig)
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1",))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.patch("/api/templates/t-1", json={"folder_id": None})
    assert resp.status_code == 200
