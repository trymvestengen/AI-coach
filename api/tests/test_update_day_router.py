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
    cur_owner.fetchone = AsyncMock(return_value=([1, 3, 5], None))
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
    cur_owner.fetchone = AsyncMock(return_value=([1, 3], None))
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
    cur_owner.fetchone = AsyncMock(return_value=([1, 3], None))
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


@pytest.mark.asyncio
async def test_update_day_writes_weekdays_to_db(make_mock_get_conn):
    """Verify the UPDATE statement actually receives the new weekdays as param."""
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000035")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000045")

    cur_owner = AsyncMock()
    # New ownership query returns (weekdays, frequency)
    cur_owner.fetchone = AsyncMock(return_value=([1, 3], None))
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
    # Find the UPDATE call and check params
    update_calls = [c for c in conn.execute.await_args_list if "UPDATE program_days" in str(c.args[0])]
    assert len(update_calls) == 1
    update_params = update_calls[0].args[1]
    # The first param should be the new weekdays list
    assert [2, 4, 6] in update_params


@pytest.mark.asyncio
async def test_update_day_rejects_both_schedules_after_merge(make_mock_get_conn):
    """Existing day has frequency=2; PATCH sets weekdays=[1] without clearing frequency → 400."""
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000036")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000046")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=([], 2))  # has frequency, no weekdays

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_owner)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}",
                json={"weekdays": [1]},  # would now have BOTH weekdays AND frequency
            )

    assert res.status_code == 400
