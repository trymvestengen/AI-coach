from unittest.mock import AsyncMock

from fastapi.testclient import TestClient

from app.main import app

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


def test_complete_onboarding_sets_status_when_required_fields_present(
    monkeypatch, mock_conn, make_mock_get_conn
):
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(
        ["build_muscle"], "beginner", 3, "male", "1990-01-01", 180, 80, 1,
    ))
    cur_update = AsyncMock()
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_update])
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    client = TestClient(app)
    resp = client.post(
        "/api/users/onboarding/complete",
        headers={"Authorization": "Bearer x"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body == {"ok": True, "status": "complete"}

    update_call = mock_conn.execute.call_args_list[1]
    assert "UPDATE users SET onboarding_status" in update_call[0][0]
    assert update_call[0][1] == ("complete", TEST_USER_ID)


def test_complete_onboarding_rejects_when_required_field_missing(
    monkeypatch, mock_conn, make_mock_get_conn
):
    cur = AsyncMock()
    # goals is None — missing required
    cur.fetchone = AsyncMock(return_value=(
        None, "beginner", 3, "male", "1990-01-01", 180, 80, 1,
    ))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    client = TestClient(app)
    resp = client.post(
        "/api/users/onboarding/complete",
        headers={"Authorization": "Bearer x"},
    )
    assert resp.status_code == 400
    body = resp.json()
    assert "goals" in body["detail"]


def test_complete_onboarding_rejects_when_equipment_empty(
    monkeypatch, mock_conn, make_mock_get_conn
):
    cur = AsyncMock()
    # equipment_count = 0
    cur.fetchone = AsyncMock(return_value=(
        ["build_muscle"], "beginner", 3, "male", "1990-01-01", 180, 80, 0,
    ))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    client = TestClient(app)
    resp = client.post(
        "/api/users/onboarding/complete",
        headers={"Authorization": "Bearer x"},
    )
    assert resp.status_code == 400
    body = resp.json()
    assert "equipment" in body["detail"]
