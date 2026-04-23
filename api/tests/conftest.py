import sys
from contextlib import asynccontextmanager
from pathlib import Path
from unittest.mock import AsyncMock

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


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
