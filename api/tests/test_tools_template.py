"""Tests for template CRUD tool handlers."""
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
TMPL_ID = str(uuid.UUID("aaaaaaaa-0000-0000-0000-000000000010"))
EX_ID = "squat"
NEW_EX_ID = "deadlift"


# ---------------------------------------------------------------------------
# create_template
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_template_inserts(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1",))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "create_template", {
            "name": "Pull A",
            "exercises": [{"exercise_id": "markloft", "sets": 4, "reps": 5}],
        })
    assert result["ok"] is True
    assert "template_id" in result


@pytest.mark.asyncio
async def test_create_template_no_exercises(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "create_template", {"name": "Empty"})
    assert result["ok"] is True
    assert "template_id" in result


# ---------------------------------------------------------------------------
# update_template
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_update_template_sets_name(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_template", {
            "template_id": TMPL_ID,
            "name": "Nytt navn",
        })

    assert result["ok"] is True
    assert result["template_id"] == TMPL_ID
    assert conn.execute.call_count == 2


@pytest.mark.asyncio
async def test_update_template_rejects_unowned_folder(make_mock_get_conn):
    cur_prog = AsyncMock(); cur_prog.fetchone = AsyncMock(return_value=("t-1",))
    cur_folder = AsyncMock(); cur_folder.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_folder])
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_template", {
            "template_id": "t-1", "folder_id": "f-x",
        })
    assert result["ok"] is False
    assert "Folder" in result["error"]


@pytest.mark.asyncio
async def test_update_template_not_found(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_template", {
            "template_id": TMPL_ID, "name": "X",
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_update_template_no_fields(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_template", {
            "template_id": TMPL_ID,
        })

    assert result["ok"] is False
    assert "No fields" in result["error"]


@pytest.mark.asyncio
async def test_update_template_allows_move_to_root(make_mock_get_conn):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_template", {
            "template_id": TMPL_ID, "folder_id": None,
        })

    assert result["ok"] is True
    # check + update (ingen folder-check for root)
    assert conn.execute.call_count == 2


# ---------------------------------------------------------------------------
# delete_template
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_delete_template_happy(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(TMPL_ID,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "delete_template", {
            "template_id": TMPL_ID,
        })

    assert result["ok"] is True
    assert result["template_id"] == TMPL_ID
    conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_template_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "delete_template", {
            "template_id": TMPL_ID,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# add_exercise_to_template
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_exercise_to_template_happy(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    cur_pos = AsyncMock(); cur_pos.fetchone = AsyncMock(return_value=(0,))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[
        cur_check, cur_pos,
        AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(),
    ])

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_exercise_to_template", {
            "template_id": TMPL_ID,
            "exercise_id": EX_ID,
            "sets": 4,
            "reps": 5,
            "weight_kg": 100.0,
        })

    assert result["ok"] is True
    assert "template_exercise_id" in result
    assert result["exercise_id"] == EX_ID
    # check(1) + pos(1) + INSERT te(1) + 4 set INSERTs
    assert conn.execute.call_count == 7


@pytest.mark.asyncio
async def test_add_exercise_to_template_not_found(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_exercise_to_template", {
            "template_id": TMPL_ID,
            "exercise_id": EX_ID,
            "sets": 3,
            "reps": 8,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# remove_exercise_from_template
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_remove_exercise_from_template_happy(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    cur_delete = AsyncMock(); cur_delete.fetchone = AsyncMock(return_value=("some-te-id",))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_delete])

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_exercise_from_template", {
            "template_id": TMPL_ID,
            "exercise_id": EX_ID,
        })

    assert result["ok"] is True
    assert result["exercise_id"] == EX_ID


@pytest.mark.asyncio
async def test_remove_exercise_from_template_template_not_found(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_exercise_from_template", {
            "template_id": TMPL_ID,
            "exercise_id": EX_ID,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_remove_exercise_from_template_exercise_not_found(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    cur_delete = AsyncMock(); cur_delete.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_delete])

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "remove_exercise_from_template", {
            "template_id": TMPL_ID,
            "exercise_id": "nonexistent",
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# swap_exercise_in_template
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_swap_exercise_in_template_happy(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    cur_update = AsyncMock(); cur_update.fetchone = AsyncMock(return_value=("some-te-id",))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_exercise_in_template", {
            "template_id": TMPL_ID,
            "old_exercise_id": EX_ID,
            "new_exercise_id": NEW_EX_ID,
        })

    assert result["ok"] is True
    assert result["old_exercise_id"] == EX_ID
    assert result["new_exercise_id"] == NEW_EX_ID


@pytest.mark.asyncio
async def test_swap_exercise_in_template_template_not_found(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_exercise_in_template", {
            "template_id": TMPL_ID,
            "old_exercise_id": EX_ID,
            "new_exercise_id": NEW_EX_ID,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_swap_exercise_in_template_old_not_found(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    cur_update = AsyncMock(); cur_update.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_exercise_in_template", {
            "template_id": TMPL_ID,
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
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("some-te-id",))
    cur_existing = AsyncMock(); cur_existing.fetchall = AsyncMock(return_value=[])
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[
        cur_check, cur_existing,
        AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock(),
    ])

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
            "template_id": TMPL_ID,
            "exercise_id": EX_ID,
            "sets": 5,
        })

    assert result["ok"] is True
    assert result["exercise_id"] == EX_ID


@pytest.mark.asyncio
async def test_update_exercise_sets_no_fields():
    """Providing no updatable fields returns an error without touching DB."""
    from app.tools.dispatcher import handle_tool
    result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
        "template_id": TMPL_ID,
        "exercise_id": EX_ID,
    })
    assert result["ok"] is False
    assert "No fields" in result["error"]


@pytest.mark.asyncio
async def test_update_exercise_sets_not_found(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
            "template_id": TMPL_ID,
            "exercise_id": EX_ID,
            "sets": 3,
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


# ---------------------------------------------------------------------------
# LLM-levert `sets` clampes (skrive-amplifikasjon / DoS-hardening)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_template_clamps_sets(make_mock_get_conn):
    """En urimelig høy `sets` fra LLM-en skal kappes til MAX_SETS rader."""
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=AsyncMock())
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.handlers.template_handlers import MAX_SETS
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "create_template", {
            "name": "Abuse",
            "exercises": [{"exercise_id": "squat", "sets": 10000, "reps": 5}],
        })
    assert result["ok"] is True
    # INSERT template(1) + INSERT template_exercise(1) + MAX_SETS set-rader
    assert conn.execute.call_count == 2 + MAX_SETS


@pytest.mark.asyncio
async def test_add_exercise_to_template_clamps_sets(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=(TMPL_ID,))
    cur_pos = AsyncMock(); cur_pos.fetchone = AsyncMock(return_value=(0,))
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_pos] + [AsyncMock() for _ in range(80)])
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.handlers.template_handlers import MAX_SETS
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_exercise_to_template", {
            "template_id": TMPL_ID, "exercise_id": EX_ID, "sets": 10000, "reps": 5,
        })
    assert result["ok"] is True
    # check(1) + pos(1) + INSERT te(1) + MAX_SETS set-rader
    assert conn.execute.call_count == 3 + MAX_SETS


@pytest.mark.asyncio
async def test_update_exercise_sets_clamps_sets(make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("some-te-id",))
    cur_existing = AsyncMock(); cur_existing.fetchall = AsyncMock(return_value=[])
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_existing] + [AsyncMock() for _ in range(80)])
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.handlers.template_handlers import MAX_SETS
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_exercise_sets", {
            "template_id": TMPL_ID, "exercise_id": EX_ID, "sets": 10000,
        })
    assert result["ok"] is True
    # check(1) + select existing(1) + MAX_SETS INSERTs
    assert conn.execute.call_count == 2 + MAX_SETS
