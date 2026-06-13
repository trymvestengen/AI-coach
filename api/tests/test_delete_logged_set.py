import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_delete_logged_set_success(make_mock_get_conn):
    workout_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000080")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(workout_id,))
    cur_del = AsyncMock()
    cur_del.fetchone = AsyncMock(return_value=(uuid.uuid4(),))

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_del])

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(
                f"/api/workouts/{workout_id}/sets",
                params={"exercise_id": "Squat", "set_number": 2},
            )

    assert res.status_code == 204


@pytest.mark.asyncio
async def test_delete_logged_set_workout_not_found(make_mock_get_conn):
    workout_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000081")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_owner)

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(
                f"/api/workouts/{workout_id}/sets",
                params={"exercise_id": "Squat", "set_number": 1},
            )

    assert res.status_code == 404


@pytest.mark.asyncio
async def test_delete_logged_set_not_found(make_mock_get_conn):
    workout_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000082")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(workout_id,))
    cur_del = AsyncMock()
    cur_del.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_del])

    with patch("app.routers.workouts.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.delete(
                f"/api/workouts/{workout_id}/sets",
                params={"exercise_id": "Squat", "set_number": 99},
            )

    assert res.status_code == 404
