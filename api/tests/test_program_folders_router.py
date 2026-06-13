import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_list_folders_returns_empty(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/folders")

    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_list_folders_returns_rows(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000001")
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[(fid, "Bulk 2026", 3)])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/folders")

    body = res.json()
    assert len(body) == 1
    assert body[0]["name"] == "Bulk 2026"
    assert body[0]["program_count"] == 3


@pytest.mark.asyncio
async def test_create_folder_returns_201(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000002")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(fid, "Sommer-cut"))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post("/api/folders", json={"name": "Sommer-cut"})

    assert res.status_code == 201
    assert res.json()["name"] == "Sommer-cut"


@pytest.mark.asyncio
async def test_create_folder_rejects_empty_name():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/folders", json={"name": ""})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_patch_folder_renames(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000003")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(fid, "Halvmaraton"))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(f"/api/folders/{fid}", json={"name": "Halvmaraton"})

    assert res.status_code == 200
    assert res.json()["name"] == "Halvmaraton"


@pytest.mark.asyncio
async def test_delete_folder_returns_204(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000004")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(fid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.program_folders.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/folders/{fid}")

    assert res.status_code == 204
