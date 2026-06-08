"""Tests for 9 new program CRUD tool handlers."""
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
PROG_ID = str(uuid.UUID("aaaaaaaa-0000-0000-0000-000000000010"))
DAY_ID = str(uuid.UUID("bbbbbbbb-0000-0000-0000-000000000020"))
EX_ID = "squat"
NEW_EX_ID = "deadlift"


# ---------------------------------------------------------------------------
# update_program
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_program_sets_name(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(PROG_ID,))
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_program", {
            "program_id": PROG_ID,
            "name": "Nytt navn",
        })

    assert result["ok"] is True
    assert result["program_id"] == PROG_ID
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_update_program_activates_and_deactivates_others(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(PROG_ID,))
    cur_deact = AsyncMock()
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_deact, cur_update])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_program", {
            "program_id": PROG_ID,
            "is_active": True,
        })

    assert result["ok"] is True
    # check + deactivate others + update
    assert conn.execute.call_count == 3


@pytest.mark.asyncio
async def test_update_program_multi_field(make_mock_get_conn):
    """Update name + is_active (False) — no deactivate step since is_active is not True."""
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(PROG_ID,))
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_program", {
            "program_id": PROG_ID,
            "name": "Nytt navn",
            "is_active": False,
        })

    assert result["ok"] is True
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_update_program_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_program", {
            "program_id": PROG_ID,
            "name": "X",
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_update_program_no_fields(make_mock_get_conn):
    """Providing only program_id (no updatable fields) returns an error."""
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(PROG_ID,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_program", {
            "program_id": PROG_ID,
        })

    assert result["ok"] is False
    assert "No fields" in result["error"]


# ---------------------------------------------------------------------------
# delete_program
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_program_happy(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(PROG_ID,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "delete_program", {
            "program_id": PROG_ID,
        })

    assert result["ok"] is True
    assert result["program_id"] == PROG_ID
    conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_program_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "delete_program", {
            "program_id": PROG_ID,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# add_program_day
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_program_day_happy(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(PROG_ID,))
    cur_insert = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_insert])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_program_day", {
            "program_id": PROG_ID,
            "day_number": 1,
            "name": "Ben",
        })

    assert result["ok"] is True
    assert "day_id" in result
    assert result["name"] == "Ben"
    assert result["day_number"] == 1
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_add_program_day_program_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_program_day", {
            "program_id": PROG_ID,
            "day_number": 2,
            "name": "Push",
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# remove_program_day
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_remove_program_day_happy(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(DAY_ID,))
    cur_delete = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_delete])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_program_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
        })

    assert result["ok"] is True
    assert result["day_id"] == DAY_ID
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_remove_program_day_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_program_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# rename_program_day
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_rename_program_day_happy(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(DAY_ID,))
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "rename_program_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "name": "Pull",
        })

    assert result["ok"] is True
    assert result["day_id"] == DAY_ID
    assert result["name"] == "Pull"
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_rename_program_day_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "rename_program_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "name": "Legs",
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# add_exercise_to_day
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_exercise_to_day_happy(make_mock_get_conn):
    # check, order, INSERT pe, then 4 INSERT set rows
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(DAY_ID,))
    cur_order = AsyncMock()
    cur_order.fetchone = AsyncMock(return_value=(0,))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[
        cur_check, cur_order,
        AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(),
    ])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_exercise_to_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": EX_ID,
            "sets": 4,
            "reps": 5,
            "weight_kg": 100.0,
        })

    assert result["ok"] is True
    assert "program_exercise_id" in result
    assert result["exercise_id"] == EX_ID
    # check(1) + order(1) + INSERT pe(1) + 4 set INSERTs
    assert conn.execute.call_count == 7


@pytest.mark.asyncio
async def test_add_exercise_to_day_no_weight(make_mock_get_conn):
    """weight_kg is optional; 3 sets default → 5 execute calls."""
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(DAY_ID,))
    cur_order = AsyncMock()
    cur_order.fetchone = AsyncMock(return_value=(2,))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[
        cur_check, cur_order, AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(),
    ])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_exercise_to_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": EX_ID,
            "sets": 3,
            "reps": 10,
        })

    assert result["ok"] is True


@pytest.mark.asyncio
async def test_add_exercise_to_day_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_exercise_to_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": EX_ID,
            "sets": 3,
            "reps": 8,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# remove_exercise_from_day
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_remove_exercise_from_day_happy(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(DAY_ID,))
    cur_delete = AsyncMock()
    cur_delete.fetchone = AsyncMock(return_value=("some-pe-id",))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_delete])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_exercise_from_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": EX_ID,
        })

    assert result["ok"] is True
    assert result["exercise_id"] == EX_ID
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_remove_exercise_from_day_day_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_exercise_from_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": EX_ID,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_remove_exercise_from_day_exercise_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(DAY_ID,))
    cur_delete = AsyncMock()
    cur_delete.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_delete])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_exercise_from_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": "nonexistent-exercise",
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# swap_exercise_in_day
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_swap_exercise_in_day_happy(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(DAY_ID,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=("some-pe-id",))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_exercise_in_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "old_exercise_id": EX_ID,
            "new_exercise_id": NEW_EX_ID,
        })

    assert result["ok"] is True
    assert result["old_exercise_id"] == EX_ID
    assert result["new_exercise_id"] == NEW_EX_ID
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_swap_exercise_in_day_day_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_exercise_in_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "old_exercise_id": EX_ID,
            "new_exercise_id": NEW_EX_ID,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_swap_exercise_in_day_old_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(DAY_ID,))
    cur_update = AsyncMock()
    cur_update.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_exercise_in_day", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "old_exercise_id": "nonexistent",
            "new_exercise_id": NEW_EX_ID,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# update_exercise_sets
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_exercise_sets_sets_only(make_mock_get_conn):
    """Setting sets=5 with no existing sets → 5 INSERT calls."""
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=("some-pe-id",))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[])
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[
        cur_check, cur_existing,
        AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(),
    ])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": EX_ID,
            "sets": 5,
        })

    assert result["ok"] is True
    assert result["exercise_id"] == EX_ID


@pytest.mark.asyncio
async def test_update_exercise_sets_multi_field(make_mock_get_conn):
    """Update sets=4 + reps=6 + weight=120 with 3 existing sets → 1 INSERT + 1 UPDATE."""
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=("some-pe-id",))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[(1, 10, 80.0), (2, 10, 80.0), (3, 10, 80.0)])
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[
        cur_check, cur_existing, AsyncMock(), AsyncMock(),
    ])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": EX_ID,
            "sets": 4,
            "reps": 6,
            "weight_kg": 120.0,
        })

    assert result["ok"] is True


@pytest.mark.asyncio
async def test_update_exercise_sets_no_fields():
    """Providing no updatable fields returns an error without touching DB."""
    from app.tools.dispatcher import handle_tool
    result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
        "program_id": PROG_ID,
        "day_id": DAY_ID,
        "exercise_id": EX_ID,
    })
    assert result["ok"] is False
    assert "No fields" in result["error"]


@pytest.mark.asyncio
async def test_update_exercise_sets_day_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": EX_ID,
            "sets": 3,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_update_exercise_sets_exercise_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
            "program_id": PROG_ID,
            "day_id": DAY_ID,
            "exercise_id": "nonexistent",
            "reps": 8,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()
