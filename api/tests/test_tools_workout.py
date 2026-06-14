import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_start_workout_from_template_succeeds(make_mock_get_conn):
    template_id = uuid.UUID("dddddddd-0000-0000-0000-000000000001")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(template_id,))
    cur_insert = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_insert])

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "start_workout_from_template", {
            "template_id": str(template_id),
        })

    assert result["ok"] is True
    assert "workout_id" in result


@pytest.mark.asyncio
async def test_start_workout_template_not_found(make_mock_get_conn):
    template_id = uuid.UUID("dddddddd-0000-0000-0000-000000000002")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "start_workout_from_template", {
            "template_id": str(template_id),
        })

    assert result["ok"] is False


@pytest.mark.asyncio
async def test_complete_workout_succeeds(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000003")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(wid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "complete_workout", {
            "workout_id": str(wid), "rpe": 7,
        })

    assert result["ok"] is True


@pytest.mark.asyncio
async def test_complete_workout_not_found(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000004")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "complete_workout", {"workout_id": str(wid)})

    assert result["ok"] is False


@pytest.mark.asyncio
async def test_discard_workout_succeeds(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000005")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(wid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "discard_workout", {"workout_id": str(wid)})

    assert result["ok"] is True


@pytest.mark.asyncio
async def test_discard_workout_not_found(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000006")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "discard_workout", {"workout_id": str(wid)})

    assert result["ok"] is False


@pytest.mark.asyncio
async def test_swap_active_workout_exercise_succeeds(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000007")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(wid,))
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_active_workout_exercise", {
            "workout_id": str(wid),
            "old_exercise_id": "squat",
            "new_exercise_id": "hack-squat",
        })

    assert result["ok"] is True
    assert result["swapped_to"] == "hack-squat"


@pytest.mark.asyncio
async def test_swap_active_workout_not_active(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000008")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_active_workout_exercise", {
            "workout_id": str(wid),
            "old_exercise_id": "squat",
            "new_exercise_id": "hack-squat",
        })

    assert result["ok"] is False


@pytest.mark.asyncio
async def test_add_active_workout_exercise_succeeds(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000009")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(wid,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_active_workout_exercise", {
            "workout_id": str(wid),
            "exercise_id": "lat-pulldown",
        })

    assert result["ok"] is True
    assert result["ready_to_log"] == "lat-pulldown"


@pytest.mark.asyncio
async def test_add_active_workout_not_active(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000010")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_active_workout_exercise", {
            "workout_id": str(wid),
            "exercise_id": "lat-pulldown",
        })

    assert result["ok"] is False


@pytest.mark.asyncio
async def test_complete_workout_error_is_generic(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=Exception("SECRET SQL DETAIL xyz"))

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "complete_workout", {"workout_id": "w-1"})

    assert result["ok"] is False
    assert "SECRET" not in result["error"]
    assert "SQL" not in result["error"]


@pytest.mark.asyncio
async def test_discard_workout_error_is_generic(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=Exception("SECRET SQL DETAIL xyz"))

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "discard_workout", {"workout_id": "w-1"})

    assert result["ok"] is False
    assert "SECRET" not in result["error"]


@pytest.mark.asyncio
async def test_swap_active_workout_exercise_error_is_generic(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=Exception("SECRET SQL DETAIL xyz"))

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "swap_active_workout_exercise", {
            "workout_id": "w-1",
            "old_exercise_id": "squat",
            "new_exercise_id": "hack-squat",
        })

    assert result["ok"] is False
    assert "SECRET" not in result["error"]


@pytest.mark.asyncio
async def test_add_active_workout_exercise_error_is_generic(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=Exception("SECRET SQL DETAIL xyz"))

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "add_active_workout_exercise", {
            "workout_id": "w-1",
            "exercise_id": "lat-pulldown",
        })

    assert result["ok"] is False
    assert "SECRET" not in result["error"]


@pytest.mark.asyncio
async def test_log_workout_error_is_generic(make_mock_get_conn):
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=Exception("SECRET SQL DETAIL xyz"))

    with patch("app.tools.handlers.workout_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "log_workout", {
            "exercises": [{"exercise_id": "squat", "sets": [{"reps": 5}]}],
        })

    assert result["ok"] is False
    assert "SECRET" not in result["error"]
    assert "SQL" not in result["error"]
