import sys
from contextlib import asynccontextmanager
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture
def make_mock_get_conn():
    def _make(conn):
        @asynccontextmanager
        async def _get_conn():
            yield conn
        return _get_conn
    return _make


@pytest.fixture
def mock_conn():
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[])
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    return conn


@pytest.fixture(autouse=True)
def patch_auth(monkeypatch):
    monkeypatch.setattr("app.routers.workouts.get_current_user_id", lambda r: TEST_USER_ID)
    monkeypatch.setattr("app.routers.programs.get_current_user_id", lambda r: TEST_USER_ID)
    monkeypatch.setattr("app.routers.users.get_current_user_id", lambda r: TEST_USER_ID)
    monkeypatch.setattr("app.routers.profile.get_current_user_id", lambda r: TEST_USER_ID)
    monkeypatch.setattr("app.routers.chat_sessions.get_current_user_id", lambda r: TEST_USER_ID)
    monkeypatch.setattr("app.routers.chat.get_current_user_id", lambda r: TEST_USER_ID)
    monkeypatch.setattr("app.routers.program_folders.get_current_user_id", lambda r: TEST_USER_ID)
