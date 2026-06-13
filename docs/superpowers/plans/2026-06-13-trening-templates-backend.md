# Trening-tab økt-mal-modell — Backend (Plan A) Implementeringsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg backend for den nye økt-mal-modellen (Strong-stil): nye tabeller, datamigrasjon fra program-modellen, templates/mappe-endepunkter, en heuristikk-basert `next-workout`, og omdøpte coach-tools — alt med tester.

**Architecture:** Nye tabeller `workout_templates` + `template_exercises` + `template_exercise_sets` + `template_folders` (per-verb RLS som `005`/`012`). En datamigrasjon gjenbruker kilde-PK-ene (program_day.id → workout_template.id osv.) så `workouts.program_day_id` mapper rett til `template_id`. Nye routere `templates.py` og `template_folders.py`; ny tool-handler-fil `template_handlers.py` erstatter `program_handlers.py`. `next-workout` er ren Python-heuristikk (ingen LLM).

**Tech Stack:** Python FastAPI (async) + psycopg, Supabase Postgres, pytest med AsyncMock-mockede DB-tilkoblinger (se `api/tests/conftest.py`).

**Forutsetninger:**
- Bygges på toppen av PR-stacken #25–#30 (gjeldende verifiserte tilstand). Branch fra den merge-de tilstanden.
- Godkjent spec: `docs/superpowers/specs/2026-06-13-trening-templates-design.md`.
- Prod har kun testdata, så migrasjonen er lav risiko.
- Migrasjonsfiler: neste ledige nummer er **019** (siste er `018_drop_duplicate_memory_policies.sql`).
- DB-fakta: `exercises.id` er TEXT (slug). `program_exercises` har `order_index` og `notes`. `program_exercise_sets` har `notes`. `workouts.program_day_id` finnes (migr 013).

**Konvensjoner som MÅ følges:**
- Hver migrasjon: kommentar-header med filsti + hvorfor, deretter SQL. Ny tabell med brukerdata → RLS i samme migrasjon (per-verb-policies, jf. `012_program_folders.sql`).
- Schema-docs-CI-gaten krever at `docs/ARCHITECTURE.md` endres i samme commit som migrasjoner.
- Handlere: `async def fn(user_id: str, ...) -> dict`, returner `{"ok": True, ...}` / `{"ok": False, "error": "<trygg melding>"}`, ALDRI `str(e)` (logg internt). LLM-leverte IDer eierskap-verifiseres.
- Routere: `get_current_user_id(request)`, `get_conn()` async context, parametriserte queries, `RETURNING id` → 404 ved None.
- Kjør `make check` (eller `cd api && .venv/bin/pytest`) etter hver task.

---

## Fil-struktur

| Fil | Ansvar | Status |
|---|---|---|
| `api/db/migrations/019_workout_templates.sql` | Nye tabeller + RLS + `workouts.template_id` | Opprett |
| `api/db/migrations/020_migrate_programs_to_templates.sql` | Flytt program-data → maler | Opprett |
| `api/db/migrations/021_drop_program_tables.sql` | Slett gamle program-tabeller (kjøres sist) | Opprett |
| `docs/ARCHITECTURE.md` | Migrasjonstabell + RLS-seksjon | Endres |
| `api/app/routers/templates.py` | `/templates/*`, `/templates/from-workout`, `/coach/next-workout` | Opprett |
| `api/app/routers/template_folders.py` | `/template-folders/*` | Opprett |
| `api/app/services/next_workout.py` | `suggest_next_template(user_id)`-heuristikk | Opprett |
| `api/app/main.py` | Registrer nye routere; fjern gamle | Endres |
| `api/app/tools/handlers/template_handlers.py` | Coach-tools for maler | Opprett |
| `api/app/tools/handlers/folder_handlers.py` | Repek til template_folders | Endres |
| `api/app/tools/handlers/workout_handlers.py` | `template_id` i stedet for program_day | Endres |
| `api/app/tools/dispatcher.py` | Oppdater HANDLERS-mapping | Endres |
| `api/app/tools/definitions.py` | Omdøp tool-skjemaer | Endres |
| `api/app/services/memory.py` | Base-context bruker maler/historikk | Endres |
| `api/tests/test_*` | Tester per nytt endepunkt/handler/migrasjon | Opprett/Endres |

> **Ut av scope (Plan B/C):** all frontend, `tool-labels.ts`, og home/kalender/historikk-UI. Når et coach-tool omdøpes her, oppdateres `BASE_PROMPT`-tool-lista i `coach.py` (backend) som del av tool-tasken.

---

## Task 1: Migrasjon 019 — nye tabeller + RLS

**Files:**
- Create: `api/db/migrations/019_workout_templates.sql`
- Test: `api/tests/test_migration_019.py`
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Skriv smoke-testen (feiler først)**

`api/tests/test_migration_019.py`:
```python
"""Smoke test for migration 019 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "019_workout_templates.sql"


def test_migration_019_exists():
    assert MIGRATION.exists()


def test_creates_template_tables():
    sql = MIGRATION.read_text()
    for table in ("template_folders", "workout_templates", "template_exercises", "template_exercise_sets"):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in sql


def test_adds_template_id_to_workouts():
    sql = MIGRATION.read_text()
    assert "ALTER TABLE workouts" in sql
    assert "template_id" in sql


def test_enables_rls_on_all_new_tables():
    sql = MIGRATION.read_text()
    for table in ("template_folders", "workout_templates", "template_exercises", "template_exercise_sets"):
        assert f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY" in sql
    # Barn-tabeller scopes via forelder
    assert "workout_templates t" in sql  # template_exercises-policy joiner mot mal
```

- [ ] **Step 2: Kjør testen — forvent FAIL (fil mangler)**

Run: `cd api && .venv/bin/pytest tests/test_migration_019.py -v`
Expected: FAIL (`assert MIGRATION.exists()`).

- [ ] **Step 3: Skriv migrasjonen**

`api/db/migrations/019_workout_templates.sql`:
```sql
-- api/db/migrations/019_workout_templates.sql
-- Strong-modell: flate "økt-maler" erstatter program→dager→øvelser.
-- Se docs/superpowers/specs/2026-06-13-trening-templates-design.md.
-- Per-verb RLS-policies som 005_rls.sql / 012_program_folders.sql.

CREATE TABLE IF NOT EXISTS template_folders (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
    position   INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_template_folders_user ON template_folders (user_id, position);

CREATE TABLE IF NOT EXISTS workout_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
    folder_id   UUID REFERENCES template_folders(id) ON DELETE SET NULL,
    position    INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates (user_id, position);
CREATE INDEX IF NOT EXISTS idx_workout_templates_folder ON workout_templates (folder_id) WHERE folder_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS template_exercises (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    position    INT NOT NULL DEFAULT 0,
    notes       TEXT
);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises (template_id, position);

CREATE TABLE IF NOT EXISTS template_exercise_sets (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_exercise_id UUID NOT NULL REFERENCES template_exercises(id) ON DELETE CASCADE,
    set_number           INT NOT NULL,
    reps                 INT,
    weight_kg            NUMERIC,
    notes                TEXT
);
CREATE INDEX IF NOT EXISTS idx_template_exercise_sets_te ON template_exercise_sets (template_exercise_id, set_number);

ALTER TABLE workouts
    ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_workouts_template ON workouts (template_id) WHERE template_id IS NOT NULL;

-- RLS ------------------------------------------------------------------
ALTER TABLE template_folders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises     ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercise_sets ENABLE ROW LEVEL SECURITY;

-- template_folders: egne rader
CREATE POLICY "template_folders_select_own" ON template_folders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "template_folders_insert_own" ON template_folders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "template_folders_update_own" ON template_folders FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "template_folders_delete_own" ON template_folders FOR DELETE USING (user_id = auth.uid());

-- workout_templates: egne rader
CREATE POLICY "workout_templates_select_own" ON workout_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "workout_templates_insert_own" ON workout_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "workout_templates_update_own" ON workout_templates FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "workout_templates_delete_own" ON workout_templates FOR DELETE USING (user_id = auth.uid());

-- template_exercises: scope via mal (workout_templates t)
CREATE POLICY "template_exercises_all_own" ON template_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_templates t WHERE t.id = template_exercises.template_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_templates t WHERE t.id = template_exercises.template_id AND t.user_id = auth.uid()));

-- template_exercise_sets: scope via mal-øvelse → mal
CREATE POLICY "template_exercise_sets_all_own" ON template_exercise_sets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM template_exercises te JOIN workout_templates t ON t.id = te.template_id
    WHERE te.id = template_exercise_sets.template_exercise_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM template_exercises te JOIN workout_templates t ON t.id = te.template_id
    WHERE te.id = template_exercise_sets.template_exercise_id AND t.user_id = auth.uid()));
```

- [ ] **Step 4: Kjør testen — forvent PASS**

Run: `cd api && .venv/bin/pytest tests/test_migration_019.py -v`
Expected: PASS (4 tester).

- [ ] **Step 5: Oppdater ARCHITECTURE.md**

I migrasjonstabellen i `docs/ARCHITECTURE.md`, legg til etter rad 018:
```markdown
| 019 | workout_templates | økt-mal-modell: template_folders, workout_templates, template_exercises, template_exercise_sets (+ RLS), workouts.template_id |
```
I RLS-seksjonen, legg til et punkt:
```markdown
- **Økt-maler** (template_folders, workout_templates, template_exercises, template_exercise_sets): `019_workout_templates.sql`. Barne-tabellene scopes via mal.
```

- [ ] **Step 6: Commit**

```bash
git add api/db/migrations/019_workout_templates.sql api/tests/test_migration_019.py docs/ARCHITECTURE.md
git commit -m "feat(db): migrasjon 019 — workout_templates-tabeller + RLS"
```

---

## Task 2: Migrasjon 020 — flytt program-data til maler

**Files:**
- Create: `api/db/migrations/020_migrate_programs_to_templates.sql`
- Test: `api/tests/test_migration_020.py`
- Modify: `docs/ARCHITECTURE.md`

**Designnotat:** Migrasjonen gjenbruker kilde-PK-ene (`program.id` → `template_folders.id`, `program_day.id` → `workout_templates.id`, osv.). Da mapper `workouts.program_day_id` rett til `template_id` uten ekstra mappingtabell, og re-kjøring er idempotent via `ON CONFLICT DO NOTHING`.

- [ ] **Step 1: Skriv smoke-testen (feiler først)**

`api/tests/test_migration_020.py`:
```python
"""Smoke test for migration 020 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "020_migrate_programs_to_templates.sql"


def test_exists():
    assert MIGRATION.exists()


def test_maps_programs_to_folders_and_days_to_templates():
    sql = MIGRATION.read_text()
    assert "INSERT INTO template_folders" in sql
    assert "FROM programs" in sql
    assert "INSERT INTO workout_templates" in sql
    assert "FROM program_days" in sql


def test_reuses_source_pks_and_is_idempotent():
    sql = MIGRATION.read_text()
    assert "ON CONFLICT" in sql            # idempotent
    assert "pd.id" in sql                  # gjenbruker program_day.id som template.id


def test_maps_workouts_program_day_to_template():
    sql = MIGRATION.read_text()
    assert "UPDATE workouts" in sql
    assert "template_id = " in sql
    assert "program_day_id" in sql
```

- [ ] **Step 2: Kjør testen — forvent FAIL**

Run: `cd api && .venv/bin/pytest tests/test_migration_020.py -v`
Expected: FAIL (fil mangler).

- [ ] **Step 3: Skriv migrasjonen**

`api/db/migrations/020_migrate_programs_to_templates.sql`:
```sql
-- api/db/migrations/020_migrate_programs_to_templates.sql
-- Flytt eksisterende program-data til mal-modellen (kun testdata i prod).
-- Hvert program -> en mappe; hver program_day -> en mal. PK-er gjenbrukes
-- så workouts.program_day_id mapper rett til template_id. Idempotent.

INSERT INTO template_folders (id, user_id, name, position, created_at)
SELECT p.id, p.user_id, p.name, 0, NOW()
FROM programs p
ON CONFLICT (id) DO NOTHING;

INSERT INTO workout_templates (id, user_id, name, folder_id, position, created_at)
SELECT pd.id, p.user_id, pd.name, p.id, COALESCE(pd.day_number, 0), NOW()
FROM program_days pd
JOIN programs p ON p.id = pd.program_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO template_exercises (id, template_id, exercise_id, position, notes)
SELECT pe.id, pe.program_day_id, pe.exercise_id, COALESCE(pe.order_index, 0), pe.notes
FROM program_exercises pe
ON CONFLICT (id) DO NOTHING;

INSERT INTO template_exercise_sets (id, template_exercise_id, set_number, reps, weight_kg, notes)
SELECT pes.id, pes.program_exercise_id, pes.set_number, pes.reps, pes.weight_kg, pes.notes
FROM program_exercise_sets pes
ON CONFLICT (id) DO NOTHING;

UPDATE workouts w
SET template_id = w.program_day_id
WHERE w.program_day_id IS NOT NULL
  AND w.template_id IS NULL
  AND EXISTS (SELECT 1 FROM workout_templates t WHERE t.id = w.program_day_id);
```

- [ ] **Step 4: Kjør testen — forvent PASS**

Run: `cd api && .venv/bin/pytest tests/test_migration_020.py -v`
Expected: PASS (4 tester).

- [ ] **Step 5: ARCHITECTURE.md + commit**

Legg til rad i migrasjonstabellen:
```markdown
| 020 | migrate_programs_to_templates | datamigrasjon: program→mappe, dag→mal, workouts.program_day_id→template_id |
```
```bash
git add api/db/migrations/020_migrate_programs_to_templates.sql api/tests/test_migration_020.py docs/ARCHITECTURE.md
git commit -m "feat(db): migrasjon 020 — flytt program-data til maler"
```

---

## Task 3: `template_folders.py`-router

**Files:**
- Create: `api/app/routers/template_folders.py`
- Modify: `api/app/main.py`, `api/tests/conftest.py`
- Test: `api/tests/test_template_folders_router.py`

- [ ] **Step 1: Skriv testen (feiler først)**

`api/tests/test_template_folders_router.py`:
```python
import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_create_folder_inserts_row(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("f-1", "Min PPL"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.template_folders.get_conn", make_mock_get_conn(mock_conn))

    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/template-folders", json={"name": "Min PPL"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Min PPL"


@pytest.mark.asyncio
async def test_create_folder_rejects_too_long_name(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.template_folders.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.post("/api/template-folders", json={"name": "x" * 81})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_delete_folder_404_when_not_found(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)  # RETURNING fant ingenting
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.template_folders.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    client = TestClient(app)
    resp = client.delete("/api/template-folders/f-x")
    assert resp.status_code == 404
```

- [ ] **Step 2: Kjør testen — forvent FAIL**

Run: `cd api && .venv/bin/pytest tests/test_template_folders_router.py -v`
Expected: FAIL (import / route mangler).

- [ ] **Step 3: Skriv routeren**

`api/app/routers/template_folders.py`:
```python
import logging
import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter()


class FolderBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)


@router.get("/template-folders")
async def list_folders(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT f.id, f.name,
                       (SELECT COUNT(*) FROM workout_templates t
                          WHERE t.folder_id = f.id AND t.archived_at IS NULL)::int
                FROM template_folders f
                WHERE f.user_id = %s
                ORDER BY f.position, f.created_at
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception:
        logger.exception("list_folders failed")
        return []
    return [{"id": str(r[0]), "name": r[1], "template_count": r[2]} for r in rows]


@router.post("/template-folders", status_code=201)
async def create_folder(request: Request, body: FolderBody) -> dict:
    user_id = get_current_user_id(request)
    folder_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO template_folders (id, user_id, name) "
                "VALUES (%s, %s, %s) RETURNING id, name",
                (folder_id, user_id, body.name.strip()),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception:
        logger.exception("create_folder failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": str(row[0]), "name": row[1], "template_count": 0}


@router.patch("/template-folders/{folder_id}")
async def rename_folder(folder_id: str, request: Request, body: FolderBody) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "UPDATE template_folders SET name = %s WHERE id = %s AND user_id = %s "
            "RETURNING id, name",
            (body.name.strip(), folder_id, user_id),
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"id": str(row[0]), "name": row[1]}


@router.delete("/template-folders/{folder_id}", status_code=200)
async def delete_folder(folder_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM template_folders WHERE id = %s AND user_id = %s RETURNING id",
            (folder_id, user_id),
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"status": "deleted"}
```

- [ ] **Step 4: Registrer routeren + auth-patch**

I `api/app/main.py`, ved de andre importene:
```python
from app.routers import template_folders
```
ved de andre `include_router`:
```python
app.include_router(template_folders.router, prefix="/api")
```
I `api/tests/conftest.py`, i `patch_auth`:
```python
    monkeypatch.setattr("app.routers.template_folders.get_current_user_id", lambda r: TEST_USER_ID)
```

- [ ] **Step 5: Kjør testen — forvent PASS**

Run: `cd api && .venv/bin/pytest tests/test_template_folders_router.py -v`
Expected: PASS (3 tester).

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/template_folders.py api/app/main.py api/tests/conftest.py api/tests/test_template_folders_router.py
git commit -m "feat(api): template-folders-router (CRUD + RLS-scoped)"
```

---

## Task 4: `templates.py`-router — CRUD

**Files:**
- Create: `api/app/routers/templates.py`
- Modify: `api/app/main.py`, `api/tests/conftest.py`
- Test: `api/tests/test_templates_router.py`

- [ ] **Step 1: Skriv testen (feiler først)**

`api/tests/test_templates_router.py`:
```python
import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_list_templates(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[("t-1", "Pull A", "f-1", 4)])
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
    cur.fetchone = AsyncMock(return_value=None)  # folder-eierskap-sjekk finner ingenting
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
```

- [ ] **Step 2: Kjør — forvent FAIL**

Run: `cd api && .venv/bin/pytest tests/test_templates_router.py -v`
Expected: FAIL.

- [ ] **Step 3: Skriv routeren (CRUD-delen)**

`api/app/routers/templates.py`:
```python
import logging
import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter()


class TemplateCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    folder_id: str | None = None


class TemplatePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    folder_id: str | None = ...   # ... = uendret; None = flytt til rot
    position: int | None = None


async def _folder_belongs_to_user(conn, folder_id: str, user_id: str) -> bool:
    cur = await conn.execute(
        "SELECT 1 FROM template_folders WHERE id = %s AND user_id = %s",
        (folder_id, user_id),
    )
    return await cur.fetchone() is not None


@router.get("/templates")
async def list_templates(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT t.id, t.name, t.folder_id,
                       (SELECT COUNT(*) FROM template_exercises te WHERE te.template_id = t.id)::int
                FROM workout_templates t
                WHERE t.user_id = %s AND t.archived_at IS NULL
                ORDER BY t.position, t.created_at
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception:
        logger.exception("list_templates failed")
        return []
    return [
        {"id": str(r[0]), "name": r[1], "folder_id": str(r[2]) if r[2] else None, "exercise_count": r[3]}
        for r in rows
    ]


@router.post("/templates", status_code=201)
async def create_template(request: Request, body: TemplateCreate) -> dict:
    user_id = get_current_user_id(request)
    template_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            if body.folder_id is not None and not await _folder_belongs_to_user(conn, body.folder_id, user_id):
                raise HTTPException(status_code=404, detail="Folder not found")
            cur = await conn.execute(
                "INSERT INTO workout_templates (id, user_id, name, folder_id) "
                "VALUES (%s, %s, %s, %s) RETURNING id, name",
                (template_id, user_id, body.name.strip(), body.folder_id),
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception:
        logger.exception("create_template failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": str(row[0]), "name": row[1]}


@router.patch("/templates/{template_id}")
async def update_template(template_id: str, request: Request, body: TemplatePatch) -> dict:
    user_id = get_current_user_id(request)
    updates: list[str] = []
    params: list = []
    if body.name is not None:
        updates.append("name = %s"); params.append(body.name.strip())
    if body.position is not None:
        updates.append("position = %s"); params.append(body.position)
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
            (template_id, user_id),
        )
        if await cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Template not found")
        if body.folder_id is not ...:
            if body.folder_id is not None and not await _folder_belongs_to_user(conn, body.folder_id, user_id):
                raise HTTPException(status_code=404, detail="Folder not found")
            updates.append("folder_id = %s"); params.append(body.folder_id)
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        params.extend([template_id, user_id])
        await conn.execute(
            f"UPDATE workout_templates SET {', '.join(updates)} WHERE id = %s AND user_id = %s",
            params,
        )
        await conn.commit()
    return {"id": template_id, "status": "updated"}


@router.delete("/templates/{template_id}", status_code=200)
async def delete_template(template_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM workout_templates WHERE id = %s AND user_id = %s RETURNING id",
            (template_id, user_id),
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"status": "deleted"}
```

- [ ] **Step 4: Registrer router + auth-patch**

I `api/app/main.py`:
```python
from app.routers import templates
# ...
app.include_router(templates.router, prefix="/api")
```
I `api/tests/conftest.py` `patch_auth`:
```python
    monkeypatch.setattr("app.routers.templates.get_current_user_id", lambda r: TEST_USER_ID)
```

- [ ] **Step 5: Kjør — forvent PASS**

Run: `cd api && .venv/bin/pytest tests/test_templates_router.py -v`
Expected: PASS (4 tester).

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/templates.py api/app/main.py api/tests/conftest.py api/tests/test_templates_router.py
git commit -m "feat(api): templates-router CRUD (eierskap-scopet, folder-validering)"
```

---

## Task 5: `GET /api/templates/{id}` — mal med øvelser + sett

**Files:**
- Modify: `api/app/routers/templates.py`
- Test: `api/tests/test_templates_router.py`

- [ ] **Step 1: Skriv testen (legg til i test_templates_router.py)**

```python
@pytest.mark.asyncio
async def test_get_template_with_exercises(monkeypatch, mock_conn, make_mock_get_conn):
    async def fake_execute(sql, params=None):
        cur = AsyncMock()
        if "FROM workout_templates" in sql and "te.id" not in sql:
            cur.fetchone = AsyncMock(return_value=("t-1", "Pull A", None))
        else:  # øvelser + sett join
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
```

- [ ] **Step 2: Kjør — forvent FAIL**

Run: `cd api && .venv/bin/pytest tests/test_templates_router.py::test_get_template_with_exercises -v`
Expected: FAIL (404 — route mangler).

- [ ] **Step 3: Legg til endepunktet i `templates.py`**

```python
@router.get("/templates/{template_id}")
async def get_template(template_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, name, folder_id FROM workout_templates "
            "WHERE id = %s AND user_id = %s AND archived_at IS NULL",
            (template_id, user_id),
        )
        head = await cur.fetchone()
        if head is None:
            raise HTTPException(status_code=404, detail="Template not found")
        cur = await conn.execute(
            """
            SELECT te.id, te.exercise_id, te.position,
                   s.id, s.set_number, s.reps, s.weight_kg::float
            FROM template_exercises te
            LEFT JOIN template_exercise_sets s ON s.template_exercise_id = te.id
            WHERE te.template_id = %s
            ORDER BY te.position, s.set_number
            """,
            (template_id,),
        )
        rows = await cur.fetchall()

    exercises: list[dict] = []
    by_te: dict = {}
    for te_id, ex_id, pos, set_id, set_num, reps, weight in rows:
        te = by_te.get(te_id)
        if te is None:
            te = {"id": str(te_id), "exercise_id": ex_id, "position": pos, "sets": []}
            by_te[te_id] = te
            exercises.append(te)
        if set_id is not None:
            te["sets"].append({"id": str(set_id), "set_number": set_num, "reps": reps, "weight_kg": weight})
    return {"id": str(head[0]), "name": head[1],
            "folder_id": str(head[2]) if head[2] else None, "exercises": exercises}
```

- [ ] **Step 4: Kjør — forvent PASS**

Run: `cd api && .venv/bin/pytest tests/test_templates_router.py -v`
Expected: PASS (alle).

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/templates.py api/tests/test_templates_router.py
git commit -m "feat(api): GET /templates/{id} med øvelser + sett"
```

---

## Task 6: `next_workout`-heuristikk + `GET /api/coach/next-workout`

**Files:**
- Create: `api/app/services/next_workout.py`
- Modify: `api/app/routers/templates.py`
- Test: `api/tests/test_next_workout.py`

**Heuristikk (v1):** Finn siste fullførte økts mal. Hvis den ligger i en mappe → foreslå neste mal i mappen (etter `position`, syklisk). Ellers → malen som er trent for lengst siden (mest «stale»). Tom historikk → mal med lavest `position`. Returner `None` hvis brukeren ikke har maler.

- [ ] **Step 1: Skriv testene (feiler først)**

`api/tests/test_next_workout.py`:
```python
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
    # siste mal = pos 0 i mappe f1; maler i f1: pos 0,1,2 -> neste = pos 1
    conn = _conn({
        "fetchone": [("t-0", "f-1", 0)],   # siste fullførte økts mal: id, folder, position
        "fetchall": [[("t-0", 0), ("t-1", 1), ("t-2", 2)]],  # maler i mappa (id, position)
    })
    monkeypatch.setattr(next_workout, "get_conn", make_mock_get_conn(conn))
    result = await next_workout.suggest_next_template("u-1")
    assert result["template_id"] == "t-1"
    assert "rotasjon" in result["reason"].lower()


@pytest.mark.asyncio
async def test_wraps_around_folder(monkeypatch, make_mock_get_conn):
    conn = _conn({
        "fetchone": [("t-2", "f-1", 2)],   # siste = siste i mappa -> wrap til pos 0
        "fetchall": [[("t-0", 0), ("t-1", 1), ("t-2", 2)]],
    })
    monkeypatch.setattr(next_workout, "get_conn", make_mock_get_conn(conn))
    result = await next_workout.suggest_next_template("u-1")
    assert result["template_id"] == "t-0"


@pytest.mark.asyncio
async def test_empty_history_returns_first_template(monkeypatch, make_mock_get_conn):
    conn = _conn({
        "fetchone": [None, ("t-9", "Push A")],  # ingen siste økt; så: laveste-position mal
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
```

- [ ] **Step 2: Kjør — forvent FAIL**

Run: `cd api && .venv/bin/pytest tests/test_next_workout.py -v`
Expected: FAIL (modul mangler).

- [ ] **Step 3: Skriv tjenesten**

`api/app/services/next_workout.py`:
```python
"""Heuristikk for å foreslå neste økt-mal (v1, ingen LLM).

Regler:
1. Finn siste fullførte økts mal. Ligger den i en mappe → neste mal i mappen
   (etter position, syklisk).
2. Ellers → malen som er trent for lengst siden (mest "stale").
3. Tom historikk → malen med lavest position.
4. Ingen maler → None.
"""
import logging
from app.db import get_conn

logger = logging.getLogger(__name__)


async def suggest_next_template(user_id: str) -> dict | None:
    async with get_conn() as conn:
        # Siste fullførte økts mal (m/ folder + position)
        cur = await conn.execute(
            """
            SELECT t.id, t.folder_id, t.position
            FROM workouts w
            JOIN workout_templates t ON t.id = w.template_id
            WHERE w.user_id = %s AND w.completed_at IS NOT NULL AND w.template_id IS NOT NULL
            ORDER BY w.completed_at DESC
            LIMIT 1
            """,
            (user_id,),
        )
        last = await cur.fetchone()

        if last is not None:
            last_id, folder_id, last_pos = last
            if folder_id is not None:
                cur = await conn.execute(
                    "SELECT id, position FROM workout_templates "
                    "WHERE folder_id = %s AND user_id = %s AND archived_at IS NULL "
                    "ORDER BY position, created_at",
                    (folder_id, user_id),
                )
                folder_rows = await cur.fetchall()
                if folder_rows and len(folder_rows) > 1:
                    ids = [str(r[0]) for r in folder_rows]
                    try:
                        idx = ids.index(str(last_id))
                    except ValueError:
                        idx = -1
                    nxt = ids[(idx + 1) % len(ids)]
                    return {"template_id": nxt, "reason": "Neste i rotasjon"}

            # Ingen mappe (eller mappe m/ én mal): mest stale mal
            cur = await conn.execute(
                """
                SELECT t.id
                FROM workout_templates t
                LEFT JOIN (
                    SELECT template_id, MAX(completed_at) AS last_done
                    FROM workouts WHERE user_id = %s AND completed_at IS NOT NULL
                    GROUP BY template_id
                ) w ON w.template_id = t.id
                WHERE t.user_id = %s AND t.archived_at IS NULL
                ORDER BY w.last_done ASC NULLS FIRST, t.position
                LIMIT 1
                """,
                (user_id, user_id),
            )
            stale = await cur.fetchone()
            if stale is not None:
                return {"template_id": str(stale[0]), "reason": "Lengst siden sist"}
            return None

        # Tom historikk → første mal
        cur = await conn.execute(
            "SELECT id, name FROM workout_templates "
            "WHERE user_id = %s AND archived_at IS NULL ORDER BY position, created_at LIMIT 1",
            (user_id,),
        )
        first = await cur.fetchone()
        if first is None:
            return None
        return {"template_id": str(first[0]), "reason": "Kom i gang"}
```

- [ ] **Step 4: Kjør — forvent PASS**

Run: `cd api && .venv/bin/pytest tests/test_next_workout.py -v`
Expected: PASS (4 tester).

- [ ] **Step 5: Legg til endepunktet i `templates.py`**

```python
from app.services.next_workout import suggest_next_template


@router.get("/coach/next-workout")
async def next_workout_endpoint(request: Request) -> dict:
    user_id = get_current_user_id(request)
    suggestion = await suggest_next_template(user_id)
    if suggestion is None:
        return {"template_id": None, "name": None, "reason": None}
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT name FROM workout_templates WHERE id = %s AND user_id = %s",
            (suggestion["template_id"], user_id),
        )
        row = await cur.fetchone()
    return {"template_id": suggestion["template_id"],
            "name": row[0] if row else None,
            "reason": suggestion["reason"]}
```

- [ ] **Step 6: Test endepunktet (legg til i test_next_workout.py)**

```python
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
```

- [ ] **Step 7: Kjør + commit**

Run: `cd api && .venv/bin/pytest tests/test_next_workout.py -v` → PASS
```bash
git add api/app/services/next_workout.py api/app/routers/templates.py api/tests/test_next_workout.py
git commit -m "feat(api): next-workout-heuristikk + /coach/next-workout"
```

---

## Task 7: Workouts — start fra mal + lagre-som-mal

**Files:**
- Modify: `api/app/routers/workouts.py`
- Test: `api/tests/test_workouts_router.py`

**Kontekst:** `POST /api/workouts` skal akseptere valgfri `template_id` (eierskap-verifiseres; null = ad-hoc). Nytt `POST /api/templates/from-workout` lager en mal fra en fullført økts loggede sett (erstatter den planlagte `programs/from-workout`).

- [ ] **Step 1: Skriv testene**

I `api/tests/test_workouts_router.py` (legg til):
```python
@pytest.mark.asyncio
async def test_start_workout_from_template(monkeypatch, mock_conn, make_mock_get_conn):
    from unittest.mock import AsyncMock
    from fastapi.testclient import TestClient
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1",))   # mal tilhører bruker
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/workouts", json={"template_id": "t-1"})
    assert resp.status_code in (200, 201)


@pytest.mark.asyncio
async def test_start_workout_rejects_unowned_template(monkeypatch, mock_conn, make_mock_get_conn):
    from unittest.mock import AsyncMock
    from fastapi.testclient import TestClient
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)       # mal ikke funnet
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.workouts.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/workouts", json={"template_id": "t-x"})
    assert resp.status_code == 404
```

- [ ] **Step 2: Kjør — forvent FAIL**

Run: `cd api && .venv/bin/pytest tests/test_workouts_router.py -k template -v`
Expected: FAIL.

- [ ] **Step 3: Oppdater `POST /api/workouts` i `workouts.py`**

Erstatt body-modellen og insert-logikken slik at den tar valgfri `template_id`, verifiserer eierskap, og setter `workouts.template_id`:
```python
from pydantic import BaseModel

class StartWorkoutBody(BaseModel):
    template_id: str | None = None

@router.post("/workouts", status_code=201)
async def start_workout(request: Request, body: StartWorkoutBody | None = None) -> dict:
    user_id = get_current_user_id(request)
    template_id = body.template_id if body else None
    workout_id = str(uuid.uuid4())
    async with get_conn() as conn:
        if template_id is not None:
            cur = await conn.execute(
                "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Template not found")
        await conn.execute(
            "INSERT INTO workouts (id, user_id, template_id) VALUES (%s, %s, %s)",
            (workout_id, user_id, template_id),
        )
        await conn.commit()
    return {"workout_id": workout_id, "template_id": template_id}
```
(Behold eksisterende imports `uuid`, `HTTPException`, `Request`, `get_conn`, `get_current_user_id` — legg til det som mangler.)

- [ ] **Step 4: Kjør — forvent PASS**

Run: `cd api && .venv/bin/pytest tests/test_workouts_router.py -k template -v`
Expected: PASS (2 tester).

- [ ] **Step 5: `POST /api/templates/from-workout` i `templates.py`**

Test i `test_templates_router.py`:
```python
@pytest.mark.asyncio
async def test_from_workout_400_when_no_sets(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("w-1",))   # workout tilhører bruker
    cur.fetchall = AsyncMock(return_value=[])         # ingen loggede sett
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.templates.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/templates/from-workout",
                                json={"workout_id": "w-1", "name": "Ny mal", "folder_id": None})
    assert resp.status_code == 400
```
Implementasjon (i `templates.py`):
```python
class FromWorkoutBody(BaseModel):
    workout_id: str
    name: str = Field(min_length=1, max_length=120)
    folder_id: str | None = None


@router.post("/templates/from-workout", status_code=201)
async def template_from_workout(request: Request, body: FromWorkoutBody) -> dict:
    user_id = get_current_user_id(request)
    template_id = str(uuid.uuid4())
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id FROM workouts WHERE id = %s AND user_id = %s",
            (body.workout_id, user_id),
        )
        if await cur.fetchone() is None:
            raise HTTPException(status_code=404, detail="Workout not found")
        cur = await conn.execute(
            """
            SELECT exercise_id, MAX(set_number) AS sets,
                   array_agg(reps ORDER BY set_number) AS reps,
                   array_agg(weight_kg ORDER BY set_number) AS weights
            FROM workout_sets WHERE workout_id = %s GROUP BY exercise_id
            """,
            (body.workout_id,),
        )
        grouped = await cur.fetchall()
        if not grouped:
            raise HTTPException(status_code=400, detail="Workout has no logged sets")
        if body.folder_id is not None and not await _folder_belongs_to_user(conn, body.folder_id, user_id):
            raise HTTPException(status_code=404, detail="Folder not found")
        await conn.execute(
            "INSERT INTO workout_templates (id, user_id, name, folder_id) VALUES (%s, %s, %s, %s)",
            (template_id, user_id, body.name.strip(), body.folder_id),
        )
        for pos, (ex_id, _sets, reps_arr, weight_arr) in enumerate(grouped):
            te_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO template_exercises (id, template_id, exercise_id, position) VALUES (%s, %s, %s, %s)",
                (te_id, template_id, ex_id, pos),
            )
            for i, (reps, weight) in enumerate(zip(reps_arr, weight_arr), start=1):
                await conn.execute(
                    "INSERT INTO template_exercise_sets (id, template_exercise_id, set_number, reps, weight_kg) "
                    "VALUES (%s, %s, %s, %s, %s)",
                    (str(uuid.uuid4()), te_id, i, reps, weight),
                )
        await conn.commit()
    return {"id": template_id, "name": body.name.strip()}
```

- [ ] **Step 6: Kjør + commit**

Run: `cd api && .venv/bin/pytest tests/test_workouts_router.py tests/test_templates_router.py -v` → PASS
```bash
git add api/app/routers/workouts.py api/app/routers/templates.py api/tests/test_workouts_router.py api/tests/test_templates_router.py
git commit -m "feat(api): start økt fra mal + lagre fullført økt som mal"
```

---

## Task 8: Coach-tools — omdøp til mal-modell

**Files:**
- Create: `api/app/tools/handlers/template_handlers.py`
- Modify: `api/app/tools/handlers/folder_handlers.py`, `api/app/tools/handlers/workout_handlers.py`, `api/app/tools/dispatcher.py`, `api/app/tools/definitions.py`, `api/app/services/coach.py`
- Delete: `api/app/tools/handlers/program_handlers.py`
- Test: `api/tests/test_tools_template.py` (ny), oppdater `api/tests/test_tools_program.py` → slett/erstatt

**Tool-endringer:**
| Gammelt | Nytt |
|---|---|
| `create_program(name, days[])` | `create_template(name, exercises[])` |
| `update_program` | `update_template(template_id, name?, folder_id?)` |
| `delete_program` | `delete_template(template_id)` |
| `add_program_day` / `remove_program_day` / `rename_program_day` | **fjernes** |
| `add_exercise_to_day` / `remove_exercise_from_day` / `swap_exercise_in_day` / `update_exercise_sets` | samme navn, men `template_id` i stedet for `program_day_id` |
| `create_folder` / `rename_folder` / `delete_folder` / `list_folders` | uendret navn, peker til `template_folders` |

- [ ] **Step 1: Skriv testen for `create_template` (feiler først)**

`api/tests/test_tools_template.py`:
```python
import pytest
from unittest.mock import AsyncMock, patch

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_create_template_inserts(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("t-1",))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "create_template", {
            "name": "Pull A",
            "exercises": [{"exercise_id": "markloft", "sets": 4, "reps": 5}],
        })
    assert result["ok"] is True


@pytest.mark.asyncio
async def test_update_template_rejects_unowned_folder(make_mock_get_conn):
    cur_prog = AsyncMock(); cur_prog.fetchone = AsyncMock(return_value=("t-1",))
    cur_folder = AsyncMock(); cur_folder.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_prog, cur_folder])
    with patch("app.tools.handlers.template_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_template", {
            "template_id": "t-1", "folder_id": "f-x",
        })
    assert result["ok"] is False
    assert "Folder" in result["error"]
```

- [ ] **Step 2: Kjør — forvent FAIL**

Run: `cd api && .venv/bin/pytest tests/test_tools_template.py -v`
Expected: FAIL (ukjent tool `create_template`).

- [ ] **Step 3: Skriv `template_handlers.py`**

`api/app/tools/handlers/template_handlers.py` (kjernen — speil eierskap-mønsteret fra `program_handlers.py`):
```python
import logging
import uuid
from app.db import get_conn

logger = logging.getLogger(__name__)


async def create_template(user_id: str, name: str, exercises: list | None = None) -> dict:
    template_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO workout_templates (id, user_id, name) VALUES (%s, %s, %s)",
                (template_id, user_id, name),
            )
            for pos, ex in enumerate(exercises or []):
                te_id = str(uuid.uuid4())
                await conn.execute(
                    "INSERT INTO template_exercises (id, template_id, exercise_id, position) "
                    "VALUES (%s, %s, %s, %s)",
                    (te_id, template_id, ex["exercise_id"], pos),
                )
                n_sets = int(ex.get("sets", 3))
                for s in range(1, n_sets + 1):
                    await conn.execute(
                        "INSERT INTO template_exercise_sets "
                        "(id, template_exercise_id, set_number, reps, weight_kg) "
                        "VALUES (%s, %s, %s, %s, %s)",
                        (str(uuid.uuid4()), te_id, s, ex.get("reps"), ex.get("weight_kg")),
                    )
            await conn.commit()
    except Exception:
        logger.exception("create_template failed")
        return {"ok": False, "error": "Kunne ikke lage økt-malen."}
    return {"ok": True, "template_id": template_id}


async def update_template(user_id: str, template_id: str, name: str | None = None,
                          folder_id: str | None = ...) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workout_templates WHERE id = %s AND user_id = %s",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Template not found"}
            if folder_id is not ... and folder_id is not None:
                cur = await conn.execute(
                    "SELECT id FROM template_folders WHERE id = %s AND user_id = %s",
                    (folder_id, user_id),
                )
                if await cur.fetchone() is None:
                    return {"ok": False, "error": "Folder not found"}
            updates, params = [], []
            if name is not None:
                updates.append("name = %s"); params.append(name)
            if folder_id is not ...:
                updates.append("folder_id = %s"); params.append(folder_id)
            if not updates:
                return {"ok": False, "error": "No fields to update"}
            params.extend([template_id, user_id])
            await conn.execute(
                f"UPDATE workout_templates SET {', '.join(updates)} WHERE id = %s AND user_id = %s",
                params,
            )
            await conn.commit()
    except Exception:
        logger.exception("update_template failed")
        return {"ok": False, "error": "Kunne ikke oppdatere malen."}
    return {"ok": True, "template_id": template_id}


async def delete_template(user_id: str, template_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM workout_templates WHERE id = %s AND user_id = %s RETURNING id",
                (template_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Template not found"}
            await conn.commit()
    except Exception:
        logger.exception("delete_template failed")
        return {"ok": False, "error": "Kunne ikke slette malen."}
    return {"ok": True, "template_id": template_id}


# add_exercise_to_template / remove_exercise_from_template / swap_exercise_in_template /
# update_exercise_sets: port fra program_handlers, men verifiser eierskap via
# workout_templates (WHERE id = %s AND user_id = %s) i stedet for program→dag-join,
# og skriv til template_exercises / template_exercise_sets.
```

> **Note for implementer:** port `add_exercise_to_day`→`add_exercise_to_template` osv. fra `program_handlers.py` med samme eierskap-/feil-mønster (logger + generisk melding, ingen `str(e)`), men mot mal-tabellene. Hver port får en test i `test_tools_template.py` lik `test_create_template_inserts` (happy path + eierskap-avvisning).

- [ ] **Step 4: Oppdater dispatcher + definitions + coach-prompt**

`api/app/tools/dispatcher.py`: bytt `program_handlers`-importen til `template_handlers`, og oppdater HANDLERS-dicten (fjern `add/remove/rename_program_day`, omdøp `create/update/delete_program` → `*_template`, repek øvelse-/sett-toolsene til `template_handlers`). `folder_handlers` peker nå på `template_folders`-tabellen.

`api/app/tools/definitions.py`: omdøp tool-skjemaene tilsvarende (navn + beskrivelser + `template_id`-parametre i stedet for `program_day_id`; fjern dag-toolsene).

`api/app/services/coach.py`: oppdater `TOOLS YOU CAN CALL`-blokka i `BASE_PROMPT` (Program-seksjonen) og CONFIRM-regel-lista (`delete_template` i stedet for `delete_program`, fjern dag-toolsene).

- [ ] **Step 5: Slett gammel handler + gamle tester**

```bash
git rm api/app/tools/handlers/program_handlers.py api/tests/test_tools_program.py
```
(Innholdet er erstattet av `template_handlers.py` + `test_tools_template.py`.)

- [ ] **Step 6: Kjør hele suiten — forvent grønt**

Run: `cd api && .venv/bin/pytest -q`
Expected: alle grønne (ingen referanser til `program_handlers` igjen). Hvis noe importerer `program_handlers`, fiks referansen.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(tools): coach-tools til mal-modell (create_template osv.)"
```

---

## Task 9: `services/memory.py` + opprydding av program-routeren

**Files:**
- Modify: `api/app/services/memory.py`
- Modify/Delete: `api/app/routers/programs.py`, `api/app/routers/program_folders.py`
- Create: `api/db/migrations/021_drop_program_tables.sql` (+ ARCHITECTURE.md)
- Test: oppdater berørte tester

- [ ] **Step 1: `services/memory.py`**

`build_base_context` bruker `get_workout_history` (uendret — den leser `workouts`/`workout_sets`, ikke program-tabeller). Verifiser at ingenting i `memory.py` refererer `program_days`/`programs`. Run:
```bash
grep -rn "program_day\|programs\b\|program_days" api/app/services/
```
Forventet: ingen treff. Hvis treff → bytt til `workout_templates`/`template_id`.

- [ ] **Step 2: Fjern gamle program-routere fra appen**

I `api/app/main.py`: fjern `from app.routers import programs` / `program_folders` og deres `include_router`. Slett rutene som er erstattet (`/programs/*`, `/folders` → erstattet av `/templates/*`, `/template-folders/*`).
```bash
git rm api/app/routers/program_folders.py
```
For `programs.py`: behold KUN endepunkter som fortsatt gjelder (`GET /exercises`, `GET /exercises/{id}`, `GET /exercises/{id}/progression` — øvelsesbiblioteket). Flytt disse til en ny `api/app/routers/exercises.py`, og slett `programs.py`. Oppdater `main.py` + `conftest.py` deretter.

- [ ] **Step 3: Migrasjon 021 — slett gamle tabeller**

`api/db/migrations/021_drop_program_tables.sql`:
```sql
-- api/db/migrations/021_drop_program_tables.sql
-- Slett program-modellen etter at data er migrert (020) og app-laget ikke
-- lenger refererer den. Kjøres SIST, etter verifisering i staging/prod.
ALTER TABLE workouts DROP COLUMN IF EXISTS program_day_id;
DROP TABLE IF EXISTS program_exercise_sets;
DROP TABLE IF EXISTS program_exercises;
DROP TABLE IF EXISTS program_days;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS program_folders;
```
ARCHITECTURE.md migrasjonstabell:
```markdown
| 021 | drop_program_tables | fjerner programs/program_days/program_exercises* + workouts.program_day_id |
```
Oppdater også Database-skjema-seksjonen (fjern program-tabellene, legg til mal-tabellene).

- [ ] **Step 4: Kjør hele suiten + make check**

Run: `cd ~/dev/ai-coach && make check`
Expected: grønt — ingen referanser til gamle program-tabeller/-routere; alle template-tester passerer.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(api): fjern program-routere, exercises-router ut, migrasjon 021 dropper gamle tabeller"
```

---

## Self-review (utført)

- **Spec-dekning:** tabeller (T1), migrasjon program→mal (T2), template-CRUD (T4–T5), mappe-CRUD (T3), next-workout-heuristikk (T6), start-fra-mal + lagre-som-mal (T7), coach-tool-rename (T8), opprydding + memory (T9). Frontend + `tool-labels.ts` er bevisst Plan B (utenfor scope). ✓
- **Navnekonsistens:** `workout_templates`/`template_exercises`/`template_exercise_sets`/`template_folders`, `template_id` brukt likt i migrasjoner, routere (`templates.py`), handlere (`template_handlers.py`) og tools (`create_template` osv.). ✓
- **Eierskap/sikkerhet:** alle skrive-handlere/-endepunkter verifiserer eierskap (404/`ok:false`), LLM-leverte `folder_id`/`template_id` valideres, ingen `str(e)`-lekkasje. ✓
- **Åpen avhengighet:** T9 forutsetter at `programs.py` sine øvelse-endepunkter flyttes til `exercises.py` — flagget eksplisitt i steget.
