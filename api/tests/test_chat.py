import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _mock_response(text: str):
    block = MagicMock()
    block.type = "text"
    block.text = text
    response = MagicMock()
    response.stop_reason = "end_turn"
    response.content = [block]
    return response


@patch("app.services.coach.build_base_context", new_callable=AsyncMock)
@patch("app.services.coach.client")
def test_chat_returns_message(mock_client, mock_base_ctx):
    mock_base_ctx.return_value = ""
    mock_client.messages.create = AsyncMock(return_value=_mock_response("Let's build a program!"))

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I want to build muscle"}],
        "persona": "friend",
    })

    assert response.status_code == 200
    assert response.json()["message"] == "Let's build a program!"


@patch("app.services.coach.build_base_context", new_callable=AsyncMock)
@patch("app.services.coach.client")
def test_chat_default_persona_is_friend(mock_client, mock_base_ctx):
    mock_base_ctx.return_value = ""
    mock_client.messages.create = AsyncMock(return_value=_mock_response("Sure!"))

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Hello"}],
    })

    assert response.status_code == 200


def test_chat_invalid_persona_returns_422():
    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Hello"}],
        "persona": "invalid_persona",
    })
    assert response.status_code == 422


def test_chat_empty_messages_returns_422():
    response = client.post("/api/chat", json={
        "messages": [],
        "persona": "friend",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_chat_includes_base_context_in_system_prompt(monkeypatch):
    from app.services import coach as coach_module

    captured = {}

    class FakeMessages:
        async def create(self, **kwargs):
            captured["system"] = kwargs["system"]
            class R:
                stop_reason = "end_turn"
                content = [type("B", (), {"text": "ok"})()]
            return R()

    fake_client = type("C", (), {"messages": FakeMessages()})()
    monkeypatch.setattr(coach_module, "client", fake_client)

    async def fake_base(user_id):
        return "USER CONTEXT\nName: Trym\nGoals: Bygge muskler"
    monkeypatch.setattr(coach_module, "build_base_context", fake_base)

    out = await coach_module.chat(
        [{"role": "user", "content": "hei"}], "u-1", persona="friend"
    )
    assert out == "ok"

    system_text = " ".join(s["text"] for s in captured["system"])
    assert "USER CONTEXT" in system_text
    assert "Trym" in system_text


@pytest.mark.asyncio
async def test_chat_stream_endpoint_returns_sse(monkeypatch):
    """POST /api/chat/stream returns text/event-stream with our events."""
    async def fake_stream(user_id, session_id, message, persona="friend"):
        yield {"type": "session_id", "id": "s-1"}
        yield {"type": "text_delta", "text": "Hei"}
        yield {"type": "done"}

    monkeypatch.setattr("app.routers.chat.chat_stream", fake_stream)

    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)

    with client.stream("POST", "/api/chat/stream", json={"session_id": None, "message": "hei"}) as r:
        assert r.status_code == 200
        assert "text/event-stream" in r.headers["content-type"]
        body = b"".join(r.iter_bytes()).decode()

    assert '"type": "session_id"' in body
    assert '"type": "text_delta"' in body
    assert '"type": "done"' in body
