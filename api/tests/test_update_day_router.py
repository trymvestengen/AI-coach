import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_update_day_rename(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000030")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000040")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(day_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(day_id, "Push v2", [1, 3, 5], None, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"name": "Push v2"},
            )

    assert res.status_code == 200
    assert res.json()["name"] == "Push v2"


@pytest.mark.asyncio
async def test_update_day_change_weekdays(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000031")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000041")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(day_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(day_id, "Push", [2, 4, 6], None, 1))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"weekdays": [2, 4, 6]},
            )

    assert res.status_code == 200
    assert res.json()["weekdays"] == [2, 4, 6]


@pytest.mark.asyncio
async def test_update_day_switch_to_frequency(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000032")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000042")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(day_id,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=(day_id, "Cardio", [], 2, 2))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_update])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"weekdays": [], "frequency_per_week": 2},
            )

    assert res.status_code == 200
    assert res.json()["weekdays"] == []
    assert res.json()["frequency_per_week"] == 2


@pytest.mark.asyncio
async def test_update_day_rejects_missing_day(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000033")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000043")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_owner)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"name": "X"},
            )

    assert res.status_code == 404


@pytest.mark.asyncio
async def test_update_day_rejects_empty_body():
    from app.main import app
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000034")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000044")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.patch(
            f"/api/programs/{prog_id}/days/{day_id}",
            json={},
        )
    assert res.status_code == 400
