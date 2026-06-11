"""Regresjonstester for at coach-tools er bundet til den AUTENTISERTE brukeren.

Dekker security-fiksene K1 (handle_tool tar user_id) og K4 (logge-tools sjekker
eierskap på LLM-leverte IDer). Se docs/follow-ups/security-audit.md.
"""

from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch

import pytest

from app.tools import handlers, memory_handlers

USER_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"


def _conn_with_fetchone(values: list):
    """En mock-conn der hvert cur.fetchone() returnerer neste verdi i `values`."""
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=values)
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    return conn


def _patch_get_conn(monkeypatch, module, conn):
    @asynccontextmanager
    async def _gc():
        yield conn
    monkeypatch.setattr(module, "get_conn", _gc)


@pytest.mark.asyncio
async def test_handle_tool_threads_authenticated_user_id():
    """handle_tool må sende den autentiserte user_id videre — ikke en konstant."""
    fake = AsyncMock(return_value={"id": USER_A})
    with patch.object(memory_handlers, "get_user_profile", new=fake):
        await handlers.handle_tool("get_user_profile", {}, USER_A)
    fake.assert_awaited_once_with(USER_A)


@pytest.mark.asyncio
async def test_log_set_rejects_workout_not_owned_by_user(monkeypatch):
    """K4: et sett kan ikke logges mot en annen brukers workout."""
    conn = _conn_with_fetchone([None])  # eierskap-SELECT finner ingenting
    _patch_get_conn(monkeypatch, memory_handlers, conn)

    result = await memory_handlers.log_set_with_note(
        USER_A,
        workout_id="workout-owned-by-someone-else",
        exercise_id="squat",
        set_number=1,
        reps=5,
        weight_kg=60.0,
    )

    assert "error" in result
    conn.commit.assert_not_called()


@pytest.mark.asyncio
async def test_log_set_proceeds_when_workout_owned(monkeypatch):
    """K4: logging går gjennom når workout tilhører brukeren."""
    conn = _conn_with_fetchone([(1,), ("new-set-id",)])  # eierskap ok, så INSERT RETURNING id
    _patch_get_conn(monkeypatch, memory_handlers, conn)

    result = await memory_handlers.log_set_with_note(
        USER_A,
        workout_id="workout-owned-by-A",
        exercise_id="squat",
        set_number=1,
        reps=5,
        weight_kg=60.0,
    )

    assert result["status"] == "logged"
    conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_write_observation_rejects_unowned_related_workout(monkeypatch):
    """K4: write_observation kan ikke peke på en annen brukers workout."""
    conn = _conn_with_fetchone([None])  # related_workout_id-eierskap finner ingenting
    _patch_get_conn(monkeypatch, memory_handlers, conn)

    result = await memory_handlers.write_observation(
        USER_A,
        category="pattern",
        observation="noe",
        related_workout_id="workout-owned-by-someone-else",
    )

    assert "error" in result
    conn.commit.assert_not_called()
