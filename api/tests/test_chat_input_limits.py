"""Tester for input-tak og feilmelding-hygiene på chat-endepunktene (M1, M2, L1)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_chat_rejects_oversized_message():
    r = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "x" * 8001}],
        "persona": "friend",
    })
    assert r.status_code == 422


def test_chat_rejects_too_many_messages():
    r = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "hei"}] * 51,
        "persona": "friend",
    })
    assert r.status_code == 422


def test_chat_stream_rejects_oversized_message():
    r = client.post("/api/chat/stream", json={"message": "x" * 8001})
    assert r.status_code == 422


def test_chat_stream_rejects_empty_message():
    r = client.post("/api/chat/stream", json={"message": ""})
    assert r.status_code == 422


def test_chat_stream_error_is_generic_not_leaky(monkeypatch):
    """En intern feil i streamen skal gi en generisk melding — ikke lekke str(e)."""
    async def boom(user_id, session_id, message, persona="friend"):
        raise ValueError("secret internal detail: db at internal-host:5432")
        yield {}  # unreachable — gjør funksjonen til en async generator

    monkeypatch.setattr("app.routers.chat.chat_stream", boom)

    with client.stream("POST", "/api/chat/stream", json={"message": "hei"}) as r:
        body = b"".join(r.iter_bytes()).decode()

    assert "Noe gikk galt" in body
    assert "secret internal detail" not in body
    assert "internal-host" not in body
