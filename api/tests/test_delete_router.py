import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

PROG_ID = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000002")
DAY_ID  = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000010")
EX_ID   = uuid.UUID("cccccccc-0000-0000-0000-000000000001")


def _cur(fetchone=None):
    c = AsyncMock()
    c.fetchone = AsyncMock(return_value=fetchone)
    return c


@pytest.mark.asyncio
async def test_delete_program_returns_204(make_mock_get_conn):
    cur = _cur(fetchone=(PROG_ID,))

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(f"/api/programs/{PROG_ID}")

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_program_returns_404_when_not_found(make_mock_get_conn):
    cur = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(f"/api/programs/{PROG_ID}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_exercise_returns_204(make_mock_get_conn):
    cur = _cur(fetchone=(EX_ID,))

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    conn.commit  = AsyncMock()

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}"
            )

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_exercise_returns_404_when_not_found(make_mock_get_conn):
    cur = _cur(fetchone=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.delete(
                f"/api/programs/{PROG_ID}/days/{DAY_ID}/exercises/{EX_ID}"
            )

    assert response.status_code == 404
