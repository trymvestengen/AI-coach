# Øvelse-picker (del 1) — implementasjonsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygg ett samlet øvelses-system (picker) med søk, filter, sortering, multi-select, favoritter og egne øvelser, og koble det inn i mal-popupen (`TemplateSheet`) som første konsument.

**Architecture:** Egne øvelser via nullbar `exercises.user_id` (NULL = seedet/global). Favoritter via join-tabell `user_exercise_favorites`. `GET /exercises` utvides til å returnere global + egne med `is_favorite`/`is_custom`/`last_used`; søk/filter/sortering skjer klient-side i pickeren (~800 øvelser). Eierskap håndheves med `WHERE`-filtre i SQL (backend forbigår RLS, men RLS legges til som forsvar-i-dybden, jf. migrasjon 019).

**Tech Stack:** FastAPI + psycopg (async), Supabase Postgres, Next.js 16 + TypeScript, Vitest + React Testing Library, pytest.

**Forutsetning:** PR #44 (mal-popup) er merget. Branch fra oppdatert `main`: `git checkout main && git pull && git checkout -b feat/exercise-picker`.

**Referanse-spec:** `docs/superpowers/specs/2026-06-14-trening-surface-redesign-design.md`

---

## Filstruktur

- `api/db/migrations/022_exercise_customs_and_favorites.sql` (NY) — `exercises.user_id`, RLS, `user_exercise_favorites`.
- `api/app/routers/exercises.py` (ENDRE) — `GET /exercises` utvides; nye `POST /exercises`, `DELETE /exercises/{id}`, `POST/DELETE /exercises/{id}/favorite`.
- `api/tests/test_exercises_router.py` (ENDRE) — tester for det nye.
- `web/src/lib/api.ts` (ENDRE) — typer (`Exercise` utvides) + `createCustomExercise`, `deleteCustomExercise`, `setExerciseFavorite`.
- `web/src/components/exercises/ExercisePicker.tsx` (NY) — pickeren (søk/filter/sortering/multi-select/favoritt).
- `web/src/components/exercises/ExercisePicker.test.tsx` (NY).
- `web/src/components/exercises/NewExerciseSheet.tsx` (NY) — skjema for egen øvelse.
- `web/src/components/exercises/NewExerciseSheet.test.tsx` (NY).
- `web/src/components/training/detail/TemplateSheet.tsx` (ENDRE) — bytt inline-lista mot `ExercisePicker`.
- `web/src/components/training/detail/TemplateSheet.test.tsx` (ENDRE).
- `docs/ARCHITECTURE.md` (ENDRE) — skjema + migrasjonstabell.

---

## Task 1: Migrasjon 022 — egne øvelser + favoritter

**Files:**
- Create: `api/db/migrations/022_exercise_customs_and_favorites.sql`
- Modify: `docs/ARCHITECTURE.md`

- [ ] **Step 1: Skriv migrasjonen**

```sql
-- api/db/migrations/022_exercise_customs_and_favorites.sql
-- Egne øvelser + favoritter for øvelse-pickeren.
-- Se docs/superpowers/specs/2026-06-14-trening-surface-redesign-design.md.

-- Egne øvelser: nullbar user_id (NULL = seedet/global, non-null = brukerens egen).
ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_exercises_user ON exercises (user_id) WHERE user_id IS NOT NULL;

-- RLS (forsvar-i-dybden; backend forbigår, men håndhever user_id i WHERE).
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_select_global_or_own" ON exercises
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "exercises_insert_own" ON exercises
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "exercises_update_own" ON exercises
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "exercises_delete_own" ON exercises
    FOR DELETE USING (user_id = auth.uid());

-- Favoritter.
CREATE TABLE IF NOT EXISTS user_exercise_favorites (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, exercise_id)
);
ALTER TABLE user_exercise_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uef_select_own" ON user_exercise_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "uef_insert_own" ON user_exercise_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "uef_delete_own" ON user_exercise_favorites FOR DELETE USING (user_id = auth.uid());
```

- [ ] **Step 2: Kjør migrasjonen mot databasen**

Bruk prosjektets migrasjons-runner (samme som tidligere migrasjoner — sjekk `api/db/` for runner-skript, f.eks. `make migrate` eller psql). Forventet: ingen feil.

- [ ] **Step 3: Verifiser i Supabase (via MCP eller psql)**

```sql
SELECT column_name FROM information_schema.columns WHERE table_name='exercises' AND column_name='user_id';
SELECT relrowsecurity FROM pg_class WHERE relname='exercises';
SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('exercises','user_exercise_favorites');
```
Forventet: `user_id`-rad finnes; `relrowsecurity = t`; 7 policies (4 exercises + 3 favorites).

- [ ] **Step 4: Oppdater ARCHITECTURE.md**

Legg `user_id` til `exercises`-skjemaet, legg til `user_exercise_favorites`-tabellen, og en rad i migrasjonstabellen for 022.

- [ ] **Step 5: Commit**

```bash
git add api/db/migrations/022_exercise_customs_and_favorites.sql docs/ARCHITECTURE.md
git commit -m "feat(db): migrasjon 022 — egne øvelser (exercises.user_id) + favoritter"
```

---

## Task 2: `GET /exercises` returnerer global + egne med is_favorite/is_custom/last_used

**Files:**
- Modify: `api/app/routers/exercises.py` (funksjonen `get_exercises`)
- Test: `api/tests/test_exercises_router.py`

- [ ] **Step 1: Skriv den feilende testen**

```python
# api/tests/test_exercises_router.py
import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient


@pytest.mark.asyncio
async def test_get_exercises_includes_favorite_and_custom_flags(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    # id, name, primary_muscles, equipment, difficulty, primary, secondary, image_urls, is_custom, is_favorite, last_used
    cur.fetchall = AsyncMock(return_value=[
        ("bench-press", "Benkpress", ["chest"], ["barbell"], "intermediate",
         ["chest"], ["triceps"], [], False, True, None),
        ("usr-1", "Magnus' curl", ["biceps"], ["dumbbell"], "beginner",
         ["biceps"], [], [], True, False, None),
    ])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).get("/api/exercises")
    assert resp.status_code == 200
    body = resp.json()
    assert body[0]["is_favorite"] is True
    assert body[0]["is_custom"] is False
    assert body[1]["is_custom"] is True
```

- [ ] **Step 2: Kjør testen — verifiser at den feiler**

Run: `api/.venv/bin/pytest api/tests/test_exercises_router.py::test_get_exercises_includes_favorite_and_custom_flags -v`
Expected: FAIL (KeyError `is_favorite` — feltene finnes ikke i responsen ennå).

- [ ] **Step 3: Oppdater `get_exercises`**

Erstatt funksjonen i `api/app/routers/exercises.py`. NB: legg til `Request` og `get_current_user_id`-import øverst hvis ikke til stede (`from fastapi import APIRouter, HTTPException, Request`; `from app.auth import get_current_user_id`). Bytt også `print(...)` mot `logger.exception` (legg til `import logging` + `logger = logging.getLogger(__name__)`).

```python
@router.get("/exercises")
async def get_exercises(request: Request, muscle_group: str | None = None) -> list:
    user_id = get_current_user_id(request)
    sql = (
        "SELECT e.id, e.name, e.primary_muscles, e.equipment, e.difficulty, "
        "       e.primary_muscles, e.secondary_muscles, e.image_urls, "
        "       (e.user_id IS NOT NULL) AS is_custom, "
        "       (f.exercise_id IS NOT NULL) AS is_favorite, "
        "       MAX(w.completed_at) AS last_used "
        "FROM exercises e "
        "LEFT JOIN user_exercise_favorites f ON f.exercise_id = e.id AND f.user_id = %s "
        "LEFT JOIN workout_sets ws ON ws.exercise_id = e.id "
        "LEFT JOIN workouts w ON w.id = ws.workout_id AND w.user_id = %s "
        "WHERE (e.user_id IS NULL OR e.user_id = %s) "
    )
    params: list = [user_id, user_id, user_id]
    if muscle_group:
        sql += "AND %s = ANY(e.primary_muscles) "
        params.append(muscle_group)
    sql += "GROUP BY e.id, e.name, e.primary_muscles, e.equipment, e.difficulty, e.secondary_muscles, e.image_urls, e.user_id, f.exercise_id ORDER BY e.name"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(sql, tuple(params))
            rows = await cur.fetchall()
    except Exception:
        logger.exception("[get_exercises] failed")
        return []
    return [
        {
            "id": r[0], "name": r[1], "muscle_groups": r[2], "equipment": r[3],
            "difficulty": r[4], "primary_muscles": r[5], "secondary_muscles": r[6],
            "image_urls": r[7] or [], "is_custom": r[8], "is_favorite": r[9],
            "last_used": r[10].isoformat() if r[10] else None,
        }
        for r in rows
    ]
```

Legg `app.routers.exercises.get_current_user_id` til i `patch_auth`-fixturen i `api/tests/conftest.py` (samme mønster som de andre routerne) hvis ikke allerede der.

- [ ] **Step 4: Kjør testen — verifiser at den passerer**

Run: `api/.venv/bin/pytest api/tests/test_exercises_router.py -v`
Expected: PASS (alle, inkl. eksisterende).

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/exercises.py api/tests/test_exercises_router.py api/tests/conftest.py
git commit -m "feat(api): GET /exercises returnerer global+egne med is_favorite/is_custom/last_used"
```

---

## Task 3: Opprette og slette egen øvelse

**Files:**
- Modify: `api/app/routers/exercises.py`
- Test: `api/tests/test_exercises_router.py`

- [ ] **Step 1: Skriv de feilende testene**

```python
@pytest.mark.asyncio
async def test_create_custom_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("usr-abc", "Magnus' curl"))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/exercises", json={
        "name": "Magnus' curl", "primary_muscles": ["biceps"], "equipment": ["dumbbell"],
    })
    assert resp.status_code == 201
    assert resp.json()["name"] == "Magnus' curl"
    assert resp.json()["id"].startswith("usr-")


@pytest.mark.asyncio
async def test_create_custom_exercise_requires_name(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/exercises", json={"primary_muscles": ["biceps"]})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_delete_custom_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=("usr-abc",))
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/exercises/usr-abc")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_delete_custom_exercise_404_when_not_own(monkeypatch, mock_conn, make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)  # DELETE ... RETURNING traff ingen egen rad
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/exercises/bench-press")
    assert resp.status_code == 404
```

- [ ] **Step 2: Kjør testene — verifiser at de feiler**

Run: `api/.venv/bin/pytest api/tests/test_exercises_router.py -k "custom_exercise" -v`
Expected: FAIL (404 fra ukjent rute for POST/DELETE).

- [ ] **Step 3: Implementer endepunktene**

Legg til øverst i `api/app/routers/exercises.py`: `import uuid` og `from pydantic import BaseModel, Field`. Legg så til:

```python
class CustomExerciseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    primary_muscles: list[str] = Field(default_factory=list)
    equipment: list[str] = Field(default_factory=list)
    difficulty: str = "beginner"


@router.post("/exercises", status_code=201)
async def create_custom_exercise(request: Request, body: CustomExerciseCreate) -> dict:
    user_id = get_current_user_id(request)
    ex_id = f"usr-{uuid.uuid4()}"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO exercises "
                "(id, user_id, name, muscle_groups, equipment, difficulty, primary_muscles, secondary_muscles, image_urls, source) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'custom') RETURNING id, name",
                (ex_id, user_id, body.name.strip(), body.primary_muscles, body.equipment,
                 body.difficulty, body.primary_muscles, [], []),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception:
        logger.exception("[create_custom_exercise] failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": row[0], "name": row[1], "is_custom": True}


@router.delete("/exercises/{exercise_id}", status_code=200)
async def delete_custom_exercise(exercise_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM exercises WHERE id = %s AND user_id = %s RETURNING id",
            (exercise_id, user_id),
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Custom exercise not found")
    return {"status": "deleted"}
```

NB: `muscle_groups` er `NOT NULL` i skjemaet — vi setter den lik `primary_muscles` for bakoverkompatibilitet.

- [ ] **Step 4: Kjør testene — verifiser at de passerer**

Run: `api/.venv/bin/pytest api/tests/test_exercises_router.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/exercises.py api/tests/test_exercises_router.py
git commit -m "feat(api): opprett/slett egen øvelse (POST/DELETE /exercises)"
```

---

## Task 4: Favoritt-toggling

**Files:**
- Modify: `api/app/routers/exercises.py`
- Test: `api/tests/test_exercises_router.py`

- [ ] **Step 1: Skriv de feilende testene**

```python
@pytest.mark.asyncio
async def test_favorite_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    mock_conn.execute = AsyncMock(return_value=AsyncMock())
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).post("/api/exercises/bench-press/favorite")
    assert resp.status_code == 200
    assert resp.json()["is_favorite"] is True


@pytest.mark.asyncio
async def test_unfavorite_exercise(monkeypatch, mock_conn, make_mock_get_conn):
    mock_conn.execute = AsyncMock(return_value=AsyncMock())
    monkeypatch.setattr("app.routers.exercises.get_conn", make_mock_get_conn(mock_conn))
    from app.main import app
    resp = TestClient(app).delete("/api/exercises/bench-press/favorite")
    assert resp.status_code == 200
    assert resp.json()["is_favorite"] is False
```

- [ ] **Step 2: Kjør — verifiser feil**

Run: `api/.venv/bin/pytest api/tests/test_exercises_router.py -k favorite -v`
Expected: FAIL (404 ukjent rute).

- [ ] **Step 3: Implementer**

```python
@router.post("/exercises/{exercise_id}/favorite", status_code=200)
async def favorite_exercise(exercise_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO user_exercise_favorites (user_id, exercise_id) VALUES (%s, %s) "
            "ON CONFLICT (user_id, exercise_id) DO NOTHING",
            (user_id, exercise_id),
        )
        await conn.commit()
    return {"exercise_id": exercise_id, "is_favorite": True}


@router.delete("/exercises/{exercise_id}/favorite", status_code=200)
async def unfavorite_exercise(exercise_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        await conn.execute(
            "DELETE FROM user_exercise_favorites WHERE user_id = %s AND exercise_id = %s",
            (user_id, exercise_id),
        )
        await conn.commit()
    return {"exercise_id": exercise_id, "is_favorite": False}
```

- [ ] **Step 4: Kjør — verifiser pass**

Run: `api/.venv/bin/pytest api/tests/test_exercises_router.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/exercises.py api/tests/test_exercises_router.py
git commit -m "feat(api): favoritt-toggling for øvelser"
```

---

## Task 5: API-klient (api.ts)

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Utvid `Exercise`-typen**

Finn `export type Exercise = {` og legg til feltene:

```ts
export type Exercise = {
  id: string
  name: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: string
  primary_muscles: string[]
  secondary_muscles: string[]
  image_urls: string[]
  is_custom?: boolean
  is_favorite?: boolean
  last_used?: string | null
}
```

- [ ] **Step 2: Legg til funksjoner (etter `getExercises`)**

```ts
export async function createCustomExercise(body: {
  name: string
  primary_muscles?: string[]
  equipment?: string[]
}): Promise<{ id: string; name: string; is_custom: boolean }> {
  const res = await fetch(`${API_BASE}/api/exercises`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/exercises/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function setExerciseFavorite(id: string, fav: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/api/exercises/${id}/favorite`, {
    method: fav ? "POST" : "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
```

- [ ] **Step 3: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: ingen feil.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/api.ts
git commit -m "feat(web): api-klient for egne øvelser + favoritter"
```

---

## Task 6: ExercisePicker-komponenten

**Files:**
- Create: `web/src/components/exercises/ExercisePicker.tsx`
- Test: `web/src/components/exercises/ExercisePicker.test.tsx`

Props:
```ts
interface Props {
  open: boolean
  excludeIds?: string[]            // øvelser allerede i malen — skjules ikke, men markeres «lagt til»
  onClose: () => void
  onConfirm: (exerciseIds: string[]) => void   // multi-select bekreftet
}
```

- [ ] **Step 1: Skriv de feilende testene**

```tsx
// web/src/components/exercises/ExercisePicker.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ExercisePicker from "./ExercisePicker"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  getExercises: vi.fn(),
  setExerciseFavorite: vi.fn(),
}))

const exercises = [
  { id: "bench-press", name: "Benkpress", muscle_groups: ["chest"], equipment: ["barbell"], difficulty: "", primary_muscles: ["chest"], secondary_muscles: [], image_urls: [], is_favorite: true, is_custom: false, last_used: null },
  { id: "squat", name: "Knebøy", muscle_groups: ["legs"], equipment: ["barbell"], difficulty: "", primary_muscles: ["legs"], secondary_muscles: [], image_urls: [], is_favorite: false, is_custom: false, last_used: null },
]

function renderPicker(props = {}) {
  return render(<ExercisePicker open onClose={vi.fn()} onConfirm={vi.fn()} {...props} />)
}

describe("ExercisePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getExercises).mockResolvedValue(exercises as never)
  })

  it("renders nothing when closed", () => {
    const { container } = render(<ExercisePicker open={false} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("lists exercises from the API", async () => {
    renderPicker()
    expect(await screen.findByText("Benkpress")).toBeInTheDocument()
    expect(screen.getByText("Knebøy")).toBeInTheDocument()
  })

  it("filters by search query", async () => {
    renderPicker()
    await screen.findByText("Benkpress")
    fireEvent.change(screen.getByLabelText(/søk/i), { target: { value: "kne" } })
    expect(screen.queryByText("Benkpress")).not.toBeInTheDocument()
    expect(screen.getByText("Knebøy")).toBeInTheDocument()
  })

  it("multi-selects and confirms", async () => {
    const onConfirm = vi.fn()
    renderPicker({ onConfirm })
    await screen.findByText("Benkpress")
    fireEvent.click(screen.getByRole("button", { name: /velg benkpress/i }))
    fireEvent.click(screen.getByRole("button", { name: /velg knebøy/i }))
    fireEvent.click(screen.getByRole("button", { name: /legg til 2/i }))
    expect(onConfirm).toHaveBeenCalledWith(["bench-press", "squat"])
  })

  it("toggles a favorite", async () => {
    vi.mocked(api.setExerciseFavorite).mockResolvedValue(undefined)
    renderPicker()
    await screen.findByText("Knebøy")
    fireEvent.click(screen.getByRole("button", { name: /favoritt knebøy/i }))
    await waitFor(() => expect(api.setExerciseFavorite).toHaveBeenCalledWith("squat", true))
  })
})
```

- [ ] **Step 2: Kjør — verifiser feil**

Run: `cd web && npx vitest run src/components/exercises/ExercisePicker.test.tsx`
Expected: FAIL (modulen finnes ikke).

- [ ] **Step 3: Implementer `ExercisePicker.tsx`**

```tsx
"use client"
import { useEffect, useMemo, useState } from "react"
import { getExercises, setExerciseFavorite, type Exercise } from "@/lib/api"

interface Props {
  open: boolean
  excludeIds?: string[]
  onClose: () => void
  onConfirm: (exerciseIds: string[]) => void
}

const MUSCLES = ["Alle", "chest", "back", "legs", "shoulders", "arms", "core"]
const MUSCLE_NO: Record<string, string> = {
  chest: "Bryst", back: "Rygg", legs: "Bein", shoulders: "Skuldre", arms: "Armer", core: "Core",
}
type Sort = "az" | "recent" | "fav"

export default function ExercisePicker({ open, excludeIds = [], onClose, onConfirm }: Props) {
  const [all, setAll] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [muscle, setMuscle] = useState("Alle")
  const [sort, setSort] = useState<Sort>("az")
  const [selected, setSelected] = useState<string[]>([])
  const [favs, setFavs] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getExercises()
      .then((ex) => {
        if (cancelled) return
        setAll(ex)
        setFavs(Object.fromEntries(ex.map((e) => [e.id, !!e.is_favorite])))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const visible = useMemo(() => {
    let list = all
    if (muscle !== "Alle") list = list.filter((e) => e.primary_muscles.includes(muscle))
    if (q.trim()) {
      const needle = q.toLowerCase()
      list = list.filter(
        (e) => e.name.toLowerCase().includes(needle) || e.primary_muscles.some((m) => m.toLowerCase().includes(needle))
      )
    }
    const sorted = [...list]
    if (sort === "az") sorted.sort((a, b) => a.name.localeCompare(b.name, "no"))
    if (sort === "recent") sorted.sort((a, b) => (b.last_used ?? "").localeCompare(a.last_used ?? ""))
    if (sort === "fav") sorted.sort((a, b) => Number(favs[b.id]) - Number(favs[a.id]))
    return sorted
  }, [all, muscle, q, sort, favs])

  if (!open) return null

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const toggleFav = async (e: Exercise) => {
    const next = !favs[e.id]
    setFavs((f) => ({ ...f, [e.id]: next }))
    try {
      await setExerciseFavorite(e.id, next)
    } catch {
      setFavs((f) => ({ ...f, [e.id]: !next }))
    }
  }

  return (
    <div
      data-testid="picker-overlay"
      onClick={onClose}
      style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column" }}
    >
      <div
        className="forge"
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: "auto", height: "92%", background: "var(--brand-canvas)", color: "var(--brand-ink)", borderRadius: "20px 20px 0 0", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "14px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="display-title" style={{ fontSize: 18 }}>Legg til øvelse</span>
          <button type="button" aria-label="Lukk" onClick={onClose} style={{ background: "none", border: "none", color: "var(--brand-muted)", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: "0 18px 8px" }}>
          <input
            aria-label="Søk øvelse"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Søk øvelse…"
            style={{ width: "100%", boxSizing: "border-box", background: "var(--brand-subtle)", border: "1px solid var(--brand-border)", borderRadius: 12, padding: "11px 13px", color: "var(--brand-ink)", fontSize: 14 }}
          />
          <div style={{ display: "flex", gap: 7, overflowX: "auto", marginTop: 10 }}>
            {MUSCLES.map((m) => (
              <button key={m} type="button" onClick={() => setMuscle(m)}
                className={`chip${muscle === m ? " active" : ""}`}
                style={{ flex: "none", padding: "7px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
                  background: muscle === m ? "var(--brand-orange)" : "var(--brand-subtle)",
                  color: muscle === m ? "#fff" : "var(--brand-ink)",
                  border: `1px solid ${muscle === m ? "var(--brand-orange)" : "var(--brand-border)"}` }}>
                {m === "Alle" ? "Alle" : MUSCLE_NO[m] ?? m}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {(["az", "recent", "fav"] as Sort[]).map((s) => (
              <button key={s} type="button" onClick={() => setSort(s)}
                style={{ background: "none", border: "none", fontSize: 11.5, fontWeight: 700, cursor: "pointer",
                  color: sort === s ? "var(--brand-orange)" : "var(--brand-muted)" }}>
                {s === "az" ? "A–Å" : s === "recent" ? "Nylig" : "Favoritter"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 18px 12px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 24 }}>Laster…</div>
          ) : (
            visible.map((e) => {
              const sel = selected.includes(e.id)
              const already = excludeIds.includes(e.id)
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 2px", borderBottom: "1px solid var(--brand-border)" }}>
                  <button type="button" aria-label={`Velg ${e.name}`} onClick={() => toggle(e.id)}
                    style={{ width: 22, height: 22, borderRadius: 7, flex: "none", cursor: "pointer",
                      border: `1.5px solid ${sel ? "var(--brand-orange)" : "var(--brand-border)"}`,
                      background: sel ? "var(--brand-orange)" : "var(--brand-subtle)", color: "#fff", fontSize: 13 }}>
                    {sel ? "✓" : ""}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: e.is_custom ? "var(--brand-orange)" : "var(--brand-muted)" }}>
                      {e.is_custom ? "Egen øvelse" : `${MUSCLE_NO[e.primary_muscles[0]] ?? e.primary_muscles[0] ?? ""}${e.equipment[0] ? ` · ${e.equipment[0]}` : ""}`}
                      {already ? " · lagt til" : ""}
                    </div>
                  </div>
                  <button type="button" aria-label={`Favoritt ${e.name}`} onClick={() => toggleFav(e)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15,
                      color: favs[e.id] ? "var(--brand-orange)" : "var(--brand-faint)" }}>
                    {favs[e.id] ? "★" : "☆"}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--brand-border)" }}>
          <button type="button" disabled={selected.length === 0}
            onClick={() => onConfirm(selected)}
            className="btn btn-primary btn-block"
            style={{ opacity: selected.length === 0 ? 0.5 : 1 }}>
            Legg til {selected.length || ""} {selected.length === 1 ? "valgt" : "valgte"} <span className="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Kjør testene — verifiser pass**

Run: `cd web && npx vitest run src/components/exercises/ExercisePicker.test.tsx`
Expected: PASS (5 tester).

- [ ] **Step 5: Commit**

```bash
git add web/src/components/exercises/ExercisePicker.tsx web/src/components/exercises/ExercisePicker.test.tsx
git commit -m "feat(web): ExercisePicker — søk/filter/sortering/multi-select/favoritt"
```

---

## Task 7: NewExerciseSheet (lag egen øvelse)

**Files:**
- Create: `web/src/components/exercises/NewExerciseSheet.tsx`
- Test: `web/src/components/exercises/NewExerciseSheet.test.tsx`

Props: `{ open: boolean; onClose: () => void; onCreated: (id: string) => void }`.

- [ ] **Step 1: Skriv den feilende testen**

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import NewExerciseSheet from "./NewExerciseSheet"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({ createCustomExercise: vi.fn() }))

describe("NewExerciseSheet", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders nothing when closed", () => {
    const { container } = render(<NewExerciseSheet open={false} onClose={vi.fn()} onCreated={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("creates a custom exercise and calls onCreated", async () => {
    vi.mocked(api.createCustomExercise).mockResolvedValue({ id: "usr-1", name: "Min curl", is_custom: true })
    const onCreated = vi.fn()
    render(<NewExerciseSheet open onClose={vi.fn()} onCreated={onCreated} />)
    fireEvent.change(screen.getByLabelText(/navn/i), { target: { value: "Min curl" } })
    fireEvent.click(screen.getByRole("button", { name: /lag øvelse/i }))
    await waitFor(() => expect(api.createCustomExercise).toHaveBeenCalledWith(expect.objectContaining({ name: "Min curl" })))
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("usr-1"))
  })
})
```

- [ ] **Step 2: Kjør — verifiser feil**

Run: `cd web && npx vitest run src/components/exercises/NewExerciseSheet.test.tsx`
Expected: FAIL (modul mangler).

- [ ] **Step 3: Implementer `NewExerciseSheet.tsx`**

```tsx
"use client"
import { useState } from "react"
import { createCustomExercise } from "@/lib/api"

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

const MUSCLES = ["chest", "back", "legs", "shoulders", "arms", "core"]
const MUSCLE_NO: Record<string, string> = {
  chest: "Bryst", back: "Rygg", legs: "Bein", shoulders: "Skuldre", arms: "Armer", core: "Core",
}

export default function NewExerciseSheet({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("")
  const [muscle, setMuscle] = useState("chest")
  const [equipment, setEquipment] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await createCustomExercise({
        name: trimmed,
        primary_muscles: [muscle],
        equipment: equipment.trim() ? [equipment.trim()] : [],
      })
      onCreated(res.id)
    } catch {
      setError("Kunne ikke lage øvelsen. Prøv igjen.")
      setBusy(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div className="forge" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "var(--brand-canvas)", color: "var(--brand-ink)", borderRadius: "20px 20px 0 0", padding: "16px 20px 26px" }}>
        <div style={{ width: 32, height: 4, background: "var(--brand-border)", borderRadius: 99, margin: "0 auto 16px" }} />
        <h2 className="display-title" style={{ fontSize: 20, marginBottom: 14 }}>Ny øvelse</h2>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-muted)" }}>Navn</label>
        <input aria-label="Navn" value={name} onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", boxSizing: "border-box", margin: "6px 0 14px", background: "var(--brand-subtle)", border: "1px solid var(--brand-border)", borderRadius: 10, padding: "11px 12px", color: "var(--brand-ink)", fontSize: 14 }} />
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-muted)" }}>Målmuskel</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 14px" }}>
          {MUSCLES.map((m) => (
            <button key={m} type="button" onClick={() => setMuscle(m)}
              style={{ padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: muscle === m ? "var(--brand-orange)" : "var(--brand-subtle)",
                color: muscle === m ? "#fff" : "var(--brand-ink)",
                border: `1px solid ${muscle === m ? "var(--brand-orange)" : "var(--brand-border)"}` }}>
              {MUSCLE_NO[m]}
            </button>
          ))}
        </div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "var(--brand-muted)" }}>Utstyr (valgfritt)</label>
        <input aria-label="Utstyr" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="f.eks. manualer"
          style={{ width: "100%", boxSizing: "border-box", margin: "6px 0 16px", background: "var(--brand-subtle)", border: "1px solid var(--brand-border)", borderRadius: 10, padding: "11px 12px", color: "var(--brand-ink)", fontSize: 14 }} />
        {error && <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button type="button" onClick={submit} disabled={busy} className="btn btn-primary btn-block" style={{ opacity: busy ? 0.7 : 1 }}>
          Lag øvelse
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Kjør — verifiser pass**

Run: `cd web && npx vitest run src/components/exercises/NewExerciseSheet.test.tsx`
Expected: PASS.

- [ ] **Step 5: Koble «+ Lag ny øvelse» i ExercisePicker**

I `ExercisePicker.tsx`: importer `NewExerciseSheet`, legg til `const [newOpen, setNewOpen] = useState(false)`, en knapp «+ Lag ny øvelse» i bunn-baren (over «Legg til N valgte»), og render `<NewExerciseSheet open={newOpen} onClose={() => setNewOpen(false)} onCreated={(id) => { setNewOpen(false); getExercises().then((ex) => { setAll(ex); setSelected((s) => [...s, id]) }) }} />`. (Re-henter lista så den nye øvelsen vises og auto-velges.)

- [ ] **Step 6: Kjør picker-testene på nytt + commit**

Run: `cd web && npx vitest run src/components/exercises/`
Expected: PASS.

```bash
git add web/src/components/exercises/NewExerciseSheet.tsx web/src/components/exercises/NewExerciseSheet.test.tsx web/src/components/exercises/ExercisePicker.tsx
git commit -m "feat(web): lag egen øvelse fra pickeren"
```

---

## Task 8: Koble ExercisePicker inn i TemplateSheet

**Files:**
- Modify: `web/src/components/training/detail/TemplateSheet.tsx`
- Test: `web/src/components/training/detail/TemplateSheet.test.tsx`

I dag åpner «+ Legg til øvelse» en inline-liste via `pickerOpen`. Bytt den mot `ExercisePicker` med multi-select.

- [ ] **Step 1: Oppdater testen**

Erstatt testen `"adds an exercise from the picker"` i `TemplateSheet.test.tsx`. Legg `ExercisePicker` til i `@/lib/api`-mocken (den trenger `getExercises` — finnes allerede i mocken). Ny test:

```tsx
it("opens the picker and adds selected exercises", async () => {
  vi.mocked(api.getExercises).mockResolvedValue([
    { id: "squat", name: "Knebøy", muscle_groups: ["legs"], equipment: [], difficulty: "", primary_muscles: ["legs"], secondary_muscles: [], image_urls: [], is_favorite: false, is_custom: false, last_used: null },
  ] as never)
  vi.mocked(api.addExerciseToTemplate).mockResolvedValue({ template_exercise_id: "te-9", exercise_id: "squat" })
  renderSheet()
  await screen.findByText("Benkpress")
  fireEvent.click(screen.getByRole("button", { name: /legg til øvelse/i }))
  fireEvent.click(await screen.findByRole("button", { name: /velg knebøy/i }))
  fireEvent.click(screen.getByRole("button", { name: /legg til 1/i }))
  await waitFor(() => expect(api.addExerciseToTemplate).toHaveBeenCalledWith("t-1", { exercise_id: "squat" }))
})
```

- [ ] **Step 2: Kjør — verifiser feil**

Run: `cd web && npx vitest run src/components/training/detail/TemplateSheet.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementer**

I `TemplateSheet.tsx`: importer `ExercisePicker`. Fjern `pickerOpen`-inline-blokken og `pickable`-logikken. La «+ Legg til øvelse»-knappen sette `setPickerOpen(true)`. Render pickeren:

```tsx
<ExercisePicker
  open={pickerOpen}
  excludeIds={(detail?.exercises ?? []).map((e) => e.exercise_id)}
  onClose={() => setPickerOpen(false)}
  onConfirm={(ids) =>
    run(async () => {
      for (const id of ids) {
        await addExerciseToTemplate(templateId, { exercise_id: id })
      }
      setPickerOpen(false)
    })
  }
/>
```

(`run(...)` re-henter malen etterpå — eksisterende mønster.) Fjern `getExercises`-importen i `TemplateSheet` hvis den ikke lenger brukes til annet enn øvelsesnavn; behold den for `exerciseNames`-mappingen hvis den fortsatt trengs der.

- [ ] **Step 4: Kjør — verifiser pass**

Run: `cd web && npx vitest run src/components/training/detail/TemplateSheet.test.tsx`
Expected: PASS.

- [ ] **Step 5: `make check` + commit**

Run: `make check`
Expected: EXIT 0 (lint + typecheck + alle tester + build).

```bash
git add web/src/components/training/detail/TemplateSheet.tsx web/src/components/training/detail/TemplateSheet.test.tsx
git commit -m "feat(web): koble ExercisePicker inn i mal-popupen"
```

---

## Avslutning

- [ ] **Kjør full `make check`** — EXIT 0.
- [ ] **Manuell røyktest** (lokalt dev): Trening → åpne mal → «+ Legg til øvelse» → søk/filter/multi-select → «Legg til N» → øvelsene dukker opp i malen. Lag egen øvelse → vises i lista. Favoritt-★ veksler.
- [ ] **Verifiser migrasjon 022 i Supabase** (pg_policies + kolonne).
- [ ] **Push + åpne PR** mot main; sjekk CI grønt + Vercel-preview.

## Self-review-notater (utført)

- **Spec-dekning del 1:** søk/filter/sortering/multi-select (Task 6), egne øvelser (Task 1+3+7), favoritter (Task 1+4+6), detalj (gjenbruk `ExerciseDetailModal` — kobles via en info-knapp i pickeren; lagt som oppfølging i Task 6 hvis ønsket, ellers del 2), wiring i `TemplateSheet` (Task 8). ✅
- **Avgrenset:** øvelse-detalj-modal i pickeren er valgfri polish (ExerciseDetailModal finnes; kan kobles på en «ⓘ»-knapp per rad). «Nylig brukt»-sortering bruker `last_used` fra Task 2.
- **Migrasjonsnummer:** 022 her; `scheduled_days` (del 3) tar et senere nummer.
- **PR-formel:** estimert 1RM (Epley) gjelder del 2 (mal=økt-siden), ikke pickeren — NB at eksisterende `get_exercise_progression` bruker Brzycki; avstem i del 2.
