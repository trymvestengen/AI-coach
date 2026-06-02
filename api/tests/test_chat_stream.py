import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.mark.asyncio
async def test_chat_stream_yields_session_id_first(monkeypatch, mock_conn, make_mock_get_conn):
    """First event must be session_id so frontend knows where to resume."""
    monkeypatch.setattr("app.services.coach.get_conn", make_mock_get_conn(mock_conn))

    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=[("session-1",)])
    cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=cur)

    async def fake_base(uid): return "ctx"
    monkeypatch.setattr("app.services.coach.build_base_context", fake_base)

    class FakeStream:
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return None
        def __aiter__(self):
            async def gen():
                e1 = MagicMock(type="content_block_delta")
                e1.delta = MagicMock(type="text_delta", text="Hei")
                yield e1
                e2 = MagicMock(type="message_stop")
                yield e2
            return gen()

    fake_messages = MagicMock()
    fake_messages.stream = MagicMock(return_value=FakeStream())
    monkeypatch.setattr("app.services.coach.client", MagicMock(messages=fake_messages))

    from app.services.coach import chat_stream
    events = []
    async for ev in chat_stream("user-1", None, "hei"):
        events.append(ev)

    assert events[0]["type"] == "session_id"
    assert events[0]["id"] == "session-1"
    assert any(e["type"] == "text_delta" and e.get("text") == "Hei" for e in events)
    assert events[-1]["type"] == "done"


@pytest.mark.asyncio
async def test_chat_stream_yields_tool_use_and_result(monkeypatch, mock_conn, make_mock_get_conn):
    """Tool use mid-stream should yield tool_use, run handler, yield tool_result."""
    monkeypatch.setattr("app.services.coach.get_conn", make_mock_get_conn(mock_conn))

    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=[("session-1",)])
    cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=cur)

    async def fake_base(uid): return "ctx"
    monkeypatch.setattr("app.services.coach.build_base_context", fake_base)

    class FirstStream:
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return None
        def __aiter__(self):
            async def gen():
                block_start = MagicMock(type="content_block_start")
                content_block = MagicMock()
                content_block.configure_mock(
                    type="tool_use",
                    id="tool-1",
                    name="get_workout_history",
                    input={"exercise_id": "squat"},
                )
                block_start.content_block = content_block
                yield block_start
                yield MagicMock(type="message_stop")
            return gen()

    class SecondStream:
        async def __aenter__(self): return self
        async def __aexit__(self, *a): return None
        def __aiter__(self):
            async def gen():
                e1 = MagicMock(type="content_block_delta")
                e1.delta = MagicMock(type="text_delta", text="Du dro 80kg.")
                yield e1
                yield MagicMock(type="message_stop")
            return gen()

    call_count = {"i": 0}
    def fake_stream(**kwargs):
        call_count["i"] += 1
        return FirstStream() if call_count["i"] == 1 else SecondStream()

    fake_messages = MagicMock()
    fake_messages.stream = fake_stream
    monkeypatch.setattr("app.services.coach.client", MagicMock(messages=fake_messages))

    async def fake_handle_tool(name, inputs):
        return [{"exercise_id": "squat", "weight_kg": 80}]
    monkeypatch.setattr("app.services.coach.handle_tool", fake_handle_tool)

    from app.services.coach import chat_stream
    events = []
    async for ev in chat_stream("user-1", None, "hvordan gikk knebøy?"):
        events.append(ev)

    tool_use_events = [e for e in events if e["type"] == "tool_use"]
    tool_result_events = [e for e in events if e["type"] == "tool_result"]
    text_events = [e for e in events if e["type"] == "text_delta"]

    assert len(tool_use_events) == 1
    assert tool_use_events[0]["name"] == "get_workout_history"
    assert len(tool_result_events) == 1
    assert tool_result_events[0]["ok"] is True
    assert any("Du dro" in e.get("text", "") for e in text_events)
