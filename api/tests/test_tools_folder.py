import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_create_folder_succeeds(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())

    with patch("app.tools.handlers.folder_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "create_folder", {"name": "Bulk 2026"})

    assert result["ok"] is True
    assert result["name"] == "Bulk 2026"
    assert "folder_id" in result


@pytest.mark.asyncio
async def test_rename_folder_succeeds(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000001")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(fid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.folder_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "rename_folder", {
            "folder_id": str(fid), "name": "Renamed",
        })

    assert result["ok"] is True


@pytest.mark.asyncio
async def test_rename_folder_not_found(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000002")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.folder_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "rename_folder", {
            "folder_id": str(fid), "name": "X",
        })

    assert result["ok"] is False


@pytest.mark.asyncio
async def test_delete_folder_succeeds(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000003")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(fid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.folder_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "delete_folder", {"folder_id": str(fid)})

    assert result["ok"] is True


@pytest.mark.asyncio
async def test_delete_folder_not_found(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000004")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.folder_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "delete_folder", {"folder_id": str(fid)})

    assert result["ok"] is False


@pytest.mark.asyncio
async def test_list_folders_returns_folders(make_mock_get_conn):
    fid = uuid.UUID("11111111-0000-0000-0000-000000000005")
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[(fid, "Bulk 2026", 3)])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.folder_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "list_folders", {})

    assert result["ok"] is True
    assert len(result["folders"]) == 1
    assert result["folders"][0]["name"] == "Bulk 2026"
    assert result["folders"][0]["template_count"] == 3
