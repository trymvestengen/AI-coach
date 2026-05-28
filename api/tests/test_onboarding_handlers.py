# api/tests/test_onboarding_handlers.py
from unittest.mock import AsyncMock

import pytest

from app.tools import onboarding_handlers

USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_save_profile_field_writes_scalar(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(mock_conn))

    result = await onboarding_handlers.save_profile_field(
        USER_ID, field="experience_level", value="intermediate"
    )

    assert result == {"ok": True, "field": "experience_level"}
    mock_conn.execute.assert_called_once()
    call_args = mock_conn.execute.call_args
    sql = call_args[0][0]
    params = call_args[0][1]
    assert "UPDATE users SET experience_level" in sql
    assert params == ("intermediate", USER_ID)


@pytest.mark.asyncio
async def test_save_profile_field_writes_array_for_goals(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(mock_conn))

    result = await onboarding_handlers.save_profile_field(
        USER_ID, field="goals", value=["build_muscle", "get_stronger"]
    )

    assert result == {"ok": True, "field": "goals"}
    sql = mock_conn.execute.call_args[0][0]
    params = mock_conn.execute.call_args[0][1]
    assert "UPDATE users SET goals" in sql
    assert params == (["build_muscle", "get_stronger"], USER_ID)


@pytest.mark.asyncio
async def test_save_profile_field_rejects_unknown_field():
    result = await onboarding_handlers.save_profile_field(
        USER_ID, field="not_a_real_field", value="x"
    )
    assert "error" in result
    assert "field" in result["error"].lower()


@pytest.mark.asyncio
async def test_add_equipment_batch_inserts_each_item(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(mock_conn))

    result = await onboarding_handlers.add_equipment_batch(
        USER_ID, items=["barbell", "dumbbells", "rack"]
    )

    assert result == {"ok": True, "count": 3}
    assert mock_conn.execute.call_count == 3
    inserted = [c[0][1][1] for c in mock_conn.execute.call_args_list]
    assert inserted == ["barbell", "dumbbells", "rack"]


@pytest.mark.asyncio
async def test_add_equipment_batch_empty_list(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(mock_conn))
    result = await onboarding_handlers.add_equipment_batch(USER_ID, items=[])
    assert result == {"ok": True, "count": 0}
    mock_conn.execute.assert_not_called()


@pytest.mark.asyncio
async def test_complete_onboarding_success_when_tier1_set(monkeypatch, make_mock_get_conn):
    conn = AsyncMock()
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(["build_muscle"], "beginner", 3, 1))
    cur_update = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])
    conn.commit = AsyncMock()

    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(conn))

    result = await onboarding_handlers.complete_onboarding(USER_ID)

    assert result == {"ok": True, "status": "complete"}
    update_call = conn.execute.call_args_list[1]
    assert "UPDATE users SET onboarding_status" in update_call[0][0]
    assert update_call[0][1] == ("complete", USER_ID)


@pytest.mark.asyncio
async def test_complete_onboarding_blocks_when_goals_missing(monkeypatch, make_mock_get_conn):
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(None, "beginner", 3, 1))
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(conn))

    result = await onboarding_handlers.complete_onboarding(USER_ID)

    assert "error" in result
    assert "goals" in result["error"]
    assert conn.execute.call_count == 1


@pytest.mark.asyncio
async def test_complete_onboarding_blocks_when_equipment_missing(monkeypatch, make_mock_get_conn):
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(["build_muscle"], "beginner", 3, 0))
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(conn))

    result = await onboarding_handlers.complete_onboarding(USER_ID)

    assert "error" in result
    assert "equipment" in result["error"]
