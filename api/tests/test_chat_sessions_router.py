import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_get_current_session_returns_recent_session(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("session-1", "2026-05-28 10:00:00+00"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.chat_sessions.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.get("/api/chat/sessions/current")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == "session-1"
    assert "last_activity_at" in body


@pytest.mark.asyncio
async def test_get_current_session_returns_404_when_no_active(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.chat_sessions.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.get("/api/chat/sessions/current")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_session_messages(monkeypatch, mock_conn, make_mock_get_conn):
    rows = [
        ("msg-1", "user", {"text": "hei"}, "2026-05-28 10:00:00+00"),
        ("msg-2", "assistant", {"text": "Hei tilbake!"}, "2026-05-28 10:00:05+00"),
    ]
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=rows)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.chat_sessions.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.get("/api/chat/sessions/session-1/messages")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 2
    assert body[0]["role"] == "user"
    assert body[1]["content"]["text"] == "Hei tilbake!"


@pytest.mark.asyncio
async def test_create_new_session_marks_old_as_ended(monkeypatch, mock_conn, make_mock_get_conn):
    calls = []

    async def fake_execute(sql, params=None):
        calls.append(sql.strip().upper())
        cur = AsyncMock()
        cur.fetchone = AsyncMock(return_value=("new-session-id",))
        return cur

    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.routers.chat_sessions.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/chat/sessions/new")
    assert resp.status_code == 200
    assert resp.json()["id"] == "new-session-id"
    assert any("UPDATE COACH_SESSIONS" in c for c in calls)
    assert any("INSERT INTO COACH_SESSIONS" in c for c in calls)
