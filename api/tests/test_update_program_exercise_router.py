import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


@pytest.mark.asyncio
async def test_update_program_exercise_notes_only(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000050")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000060")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000070")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(ex_id,))
    cur_update_notes = AsyncMock()
    cur_existing_sets = AsyncMock()
    cur_existing_sets.fetchall = AsyncMock(return_value=[(1, 10, 80.0)])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_update_notes, cur_existing_sets])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"notes": "Kontroller form"},
            )

    assert res.status_code == 200
    assert res.json()["notes"] == "Kontroller form"


@pytest.mark.asyncio
async def test_update_program_exercise_increase_sets(make_mock_get_conn):
    """Setting sets=5 when there are 3 should add 2 new set rows."""
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000051")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000061")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000071")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(ex_id,))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[(1, 10, 80.0), (2, 10, 80.0), (3, 10, 80.0)])

    conn = AsyncMock()
    # Order: owner check, fetch existing sets, INSERT set 4, INSERT set 5
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_existing, AsyncMock(), AsyncMock()])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"sets": 5},
            )

    assert res.status_code == 200
    # INSERT was called 2x (for sets 4 and 5)
    insert_calls = [c for c in conn.execute.await_args_list if "INSERT INTO program_exercise_sets" in str(c.args[0])]
    assert len(insert_calls) == 2


@pytest.mark.asyncio
async def test_update_program_exercise_decrease_sets(make_mock_get_conn):
    """Setting sets=2 when there are 4 should delete sets 3 and 4."""
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000052")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000062")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000072")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(ex_id,))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[(1, 10, 80.0), (2, 10, 80.0), (3, 10, 80.0), (4, 10, 80.0)])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_existing, AsyncMock()])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"sets": 2},
            )

    assert res.status_code == 200
    delete_calls = [c for c in conn.execute.await_args_list if "DELETE FROM program_exercise_sets" in str(c.args[0])]
    assert len(delete_calls) == 1


@pytest.mark.asyncio
async def test_update_program_exercise_update_reps_and_weight(make_mock_get_conn):
    """Changing reps or weight updates all existing set rows."""
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000053")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000063")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000073")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=(ex_id,))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[(1, 10, 80.0), (2, 10, 80.0)])

    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_owner, cur_existing, AsyncMock()])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"reps": 12, "weight_kg": 85.0},
            )

    assert res.status_code == 200
    update_calls = [c for c in conn.execute.await_args_list if "UPDATE program_exercise_sets" in str(c.args[0])]
    assert len(update_calls) == 1


@pytest.mark.asyncio
async def test_update_program_exercise_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000054")
    day_id = uuid.UUID("bbbbbbbb-0000-0000-0000-000000000064")
    ex_id = uuid.UUID("cccccccc-0000-0000-0000-000000000074")

    cur_owner = AsyncMock()
    cur_owner.fetchone = AsyncMock(return_value=None)

    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_owner)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.patch(
                f"/api/programs/{prog_id}/days/{day_id}/exercises/{ex_id}",
                json={"sets": 3},
            )

    assert res.status_code == 404
