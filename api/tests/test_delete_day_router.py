import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_delete_day_success(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000040")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000050")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(day_id,))
    cur_del = AsyncMock()
    cur_del.fetchone = AsyncMock(return_value=(day_id,))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_del])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/programs/{prog_id}/days/{day_id}")

    assert res.status_code == 204


@pytest.mark.asyncio
async def test_delete_day_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000041")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000051")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_owner)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(f"/api/programs/{prog_id}/days/{day_id}")

    assert res.status_code == 404
