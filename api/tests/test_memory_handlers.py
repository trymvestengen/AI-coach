import pytest
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_get_user_profile_returns_all_layers(monkeypatch, mock_conn, make_mock_get_conn):
    """get_user_profile returns user row + active injuries + preferences + equipment + constraints."""

    user_row = ("user-id-1", "trym@example.com", "Trym", "no", "friend", "Bygge muskler")
    injury_rows = [("inj-1", "venstre kne", "vondt ved dyp knebøy", "moderat", "2019-03-01")]
    preference_rows = [("pref-1", "exercise", "liker ikke beinpress")]
    equipment_rows = [("barbell",), ("dumbbells_20kg",)]
    constraint_rows = [("con-1", "schedule", "kun tirs/tors/lør")]

    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=[user_row])
    cur.fetchall = AsyncMock(side_effect=[injury_rows, preference_rows, equipment_rows, constraint_rows])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.tools.memory_handlers.get_conn", make_mock_get_conn(mock_conn))

    from app.tools.memory_handlers import get_user_profile
    result = await get_user_profile("user-id-1")

    assert result["name"] == "Trym"
    assert result["persona_mode"] == "friend"
    assert result["goals"] == "Bygge muskler"
    assert len(result["injuries"]) == 1
    assert result["injuries"][0]["body_part"] == "venstre kne"
    assert len(result["preferences"]) == 1
    assert result["equipment"] == ["barbell", "dumbbells_20kg"]
    assert len(result["constraints"]) == 1
