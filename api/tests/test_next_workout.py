import pytest
from unittest.mock import AsyncMock
from app.services import next_workout


def _conn(values):
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchone = AsyncMock(side_effect=values["fetchone"])
    cur.fetchall = AsyncMock(side_effect=values["fetchall"])
    conn.execute = AsyncMock(return_value=cur)
    return conn


@pytest.mark.asyncio
async def test_suggests_next_in_folder_rotation(monkeypatch, make_mock_get_conn):
    conn = _conn({
        "fetchone": [("t-0", "f-1", 0)],
        "fetchall": [[("t-0", 0), ("t-1", 1), ("t-2", 2)]],
    })
    monkeypatch.setattr(next_workout, "get_conn", make_mock_get_conn(conn))
    result = await next_workout.suggest_next_template("u-1")
    assert result["template_id"] == "t-1"
    assert "rotasjon" in result["reason"].lower()


@pytest.mark.asyncio
async def test_wraps_around_folder(monkeypatch, make_mock_get_conn):
    conn = _conn({
        "fetchone": [("t-2", "f-1", 2)],
        "fetchall": [[("t-0", 0), ("t-1", 1), ("t-2", 2)]],
    })
    monkeypatch.setattr(next_workout, "get_conn", make_mock_get_conn(conn))
    result = await next_workout.suggest_next_template("u-1")
    assert result["template_id"] == "t-0"


@pytest.mark.asyncio
async def test_empty_history_returns_first_template(monkeypatch, make_mock_get_conn):
    conn = _conn({
        "fetchone": [None, ("t-9", "Push A")],
        "fetchall": [[]],
    })
    monkeypatch.setattr(next_workout, "get_conn", make_mock_get_conn(conn))
    result = await next_workout.suggest_next_template("u-1")
    assert result["template_id"] == "t-9"


@pytest.mark.asyncio
async def test_no_templates_returns_none(monkeypatch, make_mock_get_conn):
    conn = _conn({"fetchone": [None, None], "fetchall": [[]]})
    monkeypatch.setattr(next_workout, "get_conn", make_mock_get_conn(conn))
    result = await next_workout.suggest_next_template("u-1")
    assert result is None


@pytest.mark.asyncio
async def test_next_workout_endpoint_empty(monkeypatch, mock_conn, make_mock_get_conn):
    from fastapi.testclient import TestClient
    monkeypatch.setattr("app.services.next_workout.get_conn", make_mock_get_conn(mock_conn))
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    mock_conn.execute = AsyncMock(return_value=AsyncMock(
        fetchone=AsyncMock(return_value=None), fetchall=AsyncMock(return_value=[])))
    from app.main import app
    resp = TestClient(app).get("/api/coach/next-workout")
    assert resp.status_code == 200
    assert resp.json()["template_id"] is None
