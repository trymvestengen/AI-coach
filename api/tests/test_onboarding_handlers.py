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
