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


@patch("app.services.coach.client")
def test_chat_returns_message(mock_client):
    mock_client.messages.create = AsyncMock(return_value=_mock_response("Let's build a program!"))

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I want to build muscle"}],
        "persona": "friend",
    })

    assert response.status_code == 200
    assert response.json()["message"] == "Let's build a program!"


@patch("app.services.coach.client")
def test_chat_default_persona_is_friend(mock_client):
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
