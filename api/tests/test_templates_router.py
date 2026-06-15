import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_list_templates(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[("t-1", "Pull A", "f-1", 4, [])])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.get("/api/templates")
    assert resp.status_code == 200
    assert resp.json()[0]["name"] == "Pull A"


@pytest.mark.asyncio
async def test_create_template(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1", "Pull A"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/templates", json={"name": "Pull A"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Pull A"


@pytest.mark.asyncio
async def test_create_template_rejects_unowned_folder(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/templates", json={"name": "Pull A", "folder_id": "f-x"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_template_404(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/templates/t-x")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patch_template_name_only_no_folder_field(monkeypatch, mock_conn, make_mock_get_conn):
    # PATCH uten folder_id skal IKKE kreve folder_id (ingen 422) og ikke røre folder
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1",))  # malen finnes
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.patch("/api/templates/t-1", json={"name": "Nytt navn"})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_patch_template_move_to_root(monkeypatch, mock_conn, make_mock_get_conn):
    # folder_id=null eksplisitt → flytt til rot (ingen folder-eierskap-sjekk nødvendig)
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1",))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.patch("/api/templates/t-1", json={"folder_id": None})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_get_template_with_exercises(monkeypatch, mock_conn, make_mock_get_conn):
    async def fake_execute(sql, params=None):
        cur = AsyncMock()
        if "FROM workout_templates" in sql and "te.id" not in sql:
            cur.fetchone = AsyncMock(return_value=("t-1", "Pull A", None, []))
        else:
            cur.fetchall = AsyncMock(return_value=[
                ("te-1", "markloft", 0, "s-1", 1, 5, 100.0),
                ("te-1", "markloft", 0, "s-2", 2, 5, 100.0),
            ])
        return cur
    mock_conn.execute = fake_execute
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.get("/api/templates/t-1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Pull A"
    assert data["exercises"][0]["exercise_id"] == "markloft"
    assert len(data["exercises"][0]["sets"]) == 2


@pytest.mark.asyncio
async def test_get_template_404(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.get("/api/templates/t-x")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_from_workout_400_when_no_sets(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("w-1",))
    cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/templates/from-workout",
                                json={"workout_id": "w-1", "name": "Ny mal", "folder_id": None})
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Øvelse-redigering over HTTP (PR: template-popup)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_add_template_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("t-1",))
    cur_pos = AsyncMock(); cur_pos.fetchone = AsyncMock(return_value=(0,))
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_pos, AsyncMock(), AsyncMock(), AsyncMock(), AsyncMock()])
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/templates/t-1/exercises",
                                json={"exercise_id": "squat", "sets": 3, "reps": 5})
    assert resp.status_code == 201
    assert resp.json()["exercise_id"] == "squat"
    assert "template_exercise_id" in resp.json()


@pytest.mark.asyncio
async def test_add_template_exercise_404_unowned(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock(); cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/templates/t-x/exercises", json={"exercise_id": "squat"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_add_template_exercise_sets_too_large_422(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/templates/t-1/exercises",
                                json={"exercise_id": "squat", "sets": 999})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_remove_template_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("t-1",))
    cur_del = AsyncMock(); cur_del.fetchone = AsyncMock(return_value=("te-1",))
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_del])
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/templates/t-1/exercises/squat")
    assert resp.status_code == 200
    assert resp.json()["status"] == "deleted"


@pytest.mark.asyncio
async def test_remove_template_exercise_404_not_in_template(monkeypatch, mock_conn, make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("t-1",))
    cur_del = AsyncMock(); cur_del.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_del])
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/templates/t-1/exercises/squat")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_remove_template_exercise_404_unowned(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock(); cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/templates/t-x/exercises/squat")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patch_template_exercise_sets(monkeypatch, mock_conn, make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("te-1",))
    cur_existing = AsyncMock(); cur_existing.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_existing, AsyncMock(), AsyncMock(), AsyncMock()])
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).patch("/api/templates/t-1/exercises/squat", json={"sets": 3})
    assert resp.status_code == 200
    assert resp.json()["status"] == "updated"


@pytest.mark.asyncio
async def test_patch_template_exercise_no_fields_400(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).patch("/api/templates/t-1/exercises/squat", json={})
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_patch_template_exercise_404(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock(); cur.fetchone = AsyncMock(return_value=None)
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).patch("/api/templates/t-1/exercises/squat", json={"sets": 3})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patch_template_exercise_weight_null(monkeypatch, mock_conn, make_mock_get_conn):
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("te-1",))
    cur_existing = AsyncMock(); cur_existing.fetchall = AsyncMock(return_value=[(1, 5, 100.0)])
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_existing, AsyncMock()])
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).patch("/api/templates/t-1/exercises/squat", json={"weight_kg": None})
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_patch_template_exercise_sets_down_deletes(monkeypatch, mock_conn, make_mock_get_conn):
    """Færre sett enn i dag → DELETE av overflødige rader (target < current)."""
    cur_check = AsyncMock(); cur_check.fetchone = AsyncMock(return_value=("te-1",))
    cur_existing = AsyncMock()
    cur_existing.fetchall = AsyncMock(return_value=[(1, 5, 100.0), (2, 5, 100.0), (3, 5, 100.0)])
    cur_del = AsyncMock()
    mock_conn.execute = AsyncMock(side_effect=[cur_check, cur_existing, cur_del])
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).patch("/api/templates/t-1/exercises/squat", json={"sets": 2})
    assert resp.status_code == 200
    # check(1) + existing(1) + DELETE(1), ingen INSERT/UPDATE
    assert mock_conn.execute.call_count == 3


# ---------------------------------------------------------------------------
# scheduled_days — GET list/detail + PATCH
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_list_templates_includes_scheduled_days(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[("t-1", "Pull A", "f-1", 4, [1, 3, 5])])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).get("/api/templates")
    assert resp.status_code == 200
    assert resp.json()[0]["scheduled_days"] == [1, 3, 5]


@pytest.mark.asyncio
async def test_patch_scheduled_days_rejects_invalid(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).patch("/api/templates/t-1", json={"scheduled_days": [1, 8]})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_patch_scheduled_days_valid(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock(); cur.fetchone = AsyncMock(return_value=("t-1",))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).patch("/api/templates/t-1", json={"scheduled_days": [3, 1, 3]})
    assert resp.status_code == 200
