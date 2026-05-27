import pytest
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_generate_workout_summary_calls_llm_and_updates_workout(monkeypatch, mock_conn, make_mock_get_conn):
    """The summary generator queries the workout + sets, asks the LLM for a summary, writes it back."""

    workout_row = ("w-1", "user-1", "2026-05-26 10:00", "2026-05-26 11:00", "Felt good", 7)
    set_rows = [
        ("squat", 1, 5, 80.0, 7, "5/5 strong"),
        ("squat", 2, 5, 82.5, 8, "grindy"),
    ]
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=workout_row)
    cur.fetchall = AsyncMock(return_value=set_rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.services.summaries.get_conn", make_mock_get_conn(mock_conn))

    captured = {}

    class FakeMessages:
        async def create(self, **kwargs):
            captured["model"] = kwargs["model"]
            captured["messages"] = kwargs["messages"]
            class R:
                stop_reason = "end_turn"
                content = [type("B", (), {"text": "Solid session. Squat moved well from 80 to 82.5."})()]
            return R()

    monkeypatch.setattr("app.services.summaries.client", type("C", (), {"messages": FakeMessages()})())

    from app.services.summaries import generate_workout_summary
    summary = await generate_workout_summary("w-1")

    assert "Solid session" in summary
    assert mock_conn.commit.await_count >= 1
