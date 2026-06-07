# Exercise library upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing exercise data (15 local + 855 WGER, no images) with Free Exercise DB (870 exercises with 2 images each via GitHub raw URLs), expose images in picker + program detail + new ExerciseDetailModal.

**Architecture:** One-shot import script wipes `exercises` table + dependent rows and reseeds from yuhonas/free-exercise-db. Schema gains `force`, `mechanic`, `category`, `primary_muscles`, `secondary_muscles`, `image_urls`. Coach tools and frontend stop using local JSON / hardcoded data and query DB through `GET /api/exercises` and new `GET /api/exercises/{id}`.

**Tech Stack:** FastAPI + psycopg async, Supabase Postgres, Next.js 16 App Router + TypeScript, Vitest + RTL, pytest.

**Spec:** [`docs/superpowers/specs/2026-06-06-exercise-library-upgrade-design.md`](../specs/2026-06-06-exercise-library-upgrade-design.md)

---

## Phase 1: Backend

### Task 1: DB migration 013

**Files:**
- Create: `api/db/migrations/013_exercises_v2.sql`

- [ ] **Step 1: Write the migration SQL**

Create `api/db/migrations/013_exercises_v2.sql`:

```sql
-- api/db/migrations/013_exercises_v2.sql
-- Adds Free Exercise DB fields to the exercises table.
-- See docs/superpowers/specs/2026-06-06-exercise-library-upgrade-design.md.

ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS force            TEXT,
    ADD COLUMN IF NOT EXISTS mechanic         TEXT,
    ADD COLUMN IF NOT EXISTS category         TEXT,
    ADD COLUMN IF NOT EXISTS primary_muscles  TEXT[],
    ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[],
    ADD COLUMN IF NOT EXISTS image_urls       TEXT[];
```

- [ ] **Step 2: Apply via Supabase SQL Editor**

Paste the file contents into Supabase Dashboard → SQL Editor and Run.
Expected: `Success. No rows returned`.

- [ ] **Step 3: Verify**

In SQL Editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'exercises' AND column_name IN ('force','mechanic','category','primary_muscles','secondary_muscles','image_urls');
```
Expected: 6 rows returned.

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/db/migrations/013_exercises_v2.sql
git commit -m "feat(db): add Free Exercise DB fields to exercises table"
```

---

### Task 2: Import script + run

**Files:**
- Create: `api/db/seed_free_exercise_db.py`
- Test: `api/tests/test_seed_free_exercise_db.py`

- [ ] **Step 1: Write failing test for the parser**

Create `api/tests/test_seed_free_exercise_db.py`:

```python
import os
import pytest
from unittest.mock import patch
from db.seed_free_exercise_db import build_image_urls, build_row_params

os.environ.setdefault("DATABASE_URL", "postgresql://fake")


def test_build_image_urls_constructs_github_raw_urls():
    sample = {"images": ["Barbell_Squat/0.jpg", "Barbell_Squat/1.jpg"]}
    urls = build_image_urls(sample)
    assert urls == [
        "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
        "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/1.jpg",
    ]


def test_build_image_urls_handles_missing_images():
    sample = {}
    assert build_image_urls(sample) == []


def test_build_row_params_maps_fields():
    sample = {
        "id": "Barbell_Squat",
        "name": "Barbell Squat",
        "primaryMuscles": ["quadriceps"],
        "secondaryMuscles": ["glutes", "hamstrings"],
        "equipment": "barbell",
        "level": "intermediate",
        "instructions": ["Step 1", "Step 2"],
        "force": "push",
        "mechanic": "compound",
        "category": "strength",
        "images": ["Barbell_Squat/0.jpg"],
    }
    params = build_row_params(sample)
    assert params[0] == "Barbell_Squat"
    assert params[1] == "Barbell Squat"
    assert params[2] == ["quadriceps"]  # muscle_groups (from primaryMuscles)
    assert params[3] == ["barbell"]
    assert params[4] == "intermediate"
    assert params[5] == "Step 1\n\nStep 2"
    assert params[6] == "push"
    assert params[7] == "compound"
    assert params[8] == "strength"
    assert params[9] == ["quadriceps"]
    assert params[10] == ["glutes", "hamstrings"]
    assert params[11] == [
        "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
    ]


def test_build_row_params_handles_empty_equipment():
    sample = {
        "id": "X",
        "name": "X",
        "primaryMuscles": [],
        "secondaryMuscles": [],
        "equipment": None,
        "level": None,
        "instructions": [],
        "force": None,
        "mechanic": None,
        "category": None,
        "images": [],
    }
    params = build_row_params(sample)
    assert params[3] == []  # equipment
    assert params[5] == ""  # instructions
```

- [ ] **Step 2: Run tests to confirm failure**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_seed_free_exercise_db.py -v
```
Expected: FAIL (module not found).

- [ ] **Step 3: Implement seed script**

Create `api/db/seed_free_exercise_db.py`:

```python
"""Wipe and reimport the exercises table from yuhonas/free-exercise-db.

Run manually:
    cd api && .venv/bin/python db/seed_free_exercise_db.py
"""
import asyncio
import json
import sys
import urllib.request
from pathlib import Path

# Allow running this script directly: add the api/ root to sys.path so
# `from app.db import get_conn` resolves.
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import get_conn  # noqa: E402

JSON_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"


def fetch_json() -> list:
    with urllib.request.urlopen(JSON_URL) as r:
        return json.loads(r.read())


def build_image_urls(ex: dict) -> list[str]:
    return [f"{IMAGE_BASE}/{img}" for img in ex.get("images", [])]


def build_row_params(ex: dict) -> tuple:
    """Tuple of INSERT params in column order matching the SQL in main()."""
    return (
        ex["id"],
        ex["name"],
        ex.get("primaryMuscles", []),
        [ex["equipment"]] if ex.get("equipment") else [],
        ex.get("level"),
        "\n\n".join(ex.get("instructions", [])),
        ex.get("force"),
        ex.get("mechanic"),
        ex.get("category"),
        ex.get("primaryMuscles", []),
        ex.get("secondaryMuscles", []),
        build_image_urls(ex),
    )


async def main():
    data = fetch_json()
    print(f"Fetched {len(data)} exercises from Free Exercise DB")

    async with get_conn() as conn:
        # Clear FK-dependent rows first.
        await conn.execute("DELETE FROM program_exercise_sets")
        await conn.execute("DELETE FROM program_exercises")
        await conn.execute("DELETE FROM workout_sets")
        await conn.execute("DELETE FROM exercises")

        for ex in data:
            await conn.execute(
                """
                INSERT INTO exercises (
                    id, name, muscle_groups, equipment, difficulty, instructions,
                    force, mechanic, category,
                    primary_muscles, secondary_muscles, image_urls
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                build_row_params(ex),
            )
        await conn.commit()
    print(f"Imported {len(data)} exercises")


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_seed_free_exercise_db.py -v
```
Expected: 4/4 PASS.

- [ ] **Step 5: Run the seed against Supabase**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/python db/seed_free_exercise_db.py
```
Expected: `Fetched ~870 exercises ... Imported ~870 exercises`.

- [ ] **Step 6: Verify in Supabase SQL Editor**

```sql
SELECT COUNT(*) FROM exercises;
SELECT id, name, image_urls[1] FROM exercises LIMIT 3;
```
Expected: count ~870; sample rows have GitHub raw URLs.

- [ ] **Step 7: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/db/seed_free_exercise_db.py api/tests/test_seed_free_exercise_db.py
git commit -m "feat(db): add seed_free_exercise_db.py import script"
```

---

### Task 3: Backend exercise endpoints

**Files:**
- Modify: `api/app/routers/programs.py` (extend existing `GET /api/exercises`, add new `GET /api/exercises/{id}`)
- Modify: `api/tests/test_programs_router.py` (append tests)

- [ ] **Step 1: Write failing tests**

Append to `api/tests/test_programs_router.py`:

```python
@pytest.mark.asyncio
async def test_get_exercises_includes_new_fields(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[
        (
            "Barbell_Squat", "Barbell Squat", ["quadriceps"], ["barbell"], "intermediate",
            ["quadriceps"], ["glutes"],
            ["https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg"],
        ),
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/exercises")

    body = res.json()
    assert res.status_code == 200
    assert body[0]["id"] == "Barbell_Squat"
    assert body[0]["primary_muscles"] == ["quadriceps"]
    assert body[0]["image_urls"][0].startswith("https://raw.githubusercontent.com/")


@pytest.mark.asyncio
async def test_get_exercise_by_id_returns_full_detail(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(
        "Barbell_Squat", "Barbell Squat", ["quadriceps"], ["barbell"], "intermediate",
        "Step 1\n\nStep 2", "push", "compound", "strength",
        ["quadriceps"], ["glutes", "hamstrings"],
        ["https://raw.githubusercontent.com/.../0.jpg", "https://raw.githubusercontent.com/.../1.jpg"],
    ))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/exercises/Barbell_Squat")

    assert res.status_code == 200
    body = res.json()
    assert body["id"] == "Barbell_Squat"
    assert body["primary_muscles"] == ["quadriceps"]
    assert body["secondary_muscles"] == ["glutes", "hamstrings"]
    assert body["force"] == "push"
    assert body["mechanic"] == "compound"
    assert body["category"] == "strength"
    assert len(body["image_urls"]) == 2
    assert body["instructions"] == "Step 1\n\nStep 2"


@pytest.mark.asyncio
async def test_get_exercise_by_id_returns_404(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.get("/api/exercises/Nonexistent")

    assert res.status_code == 404
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_programs_router.py -v -k "exercises"
```
Expected: the 3 new tests fail (existing `get_exercises` response shape differs, no `/api/exercises/{id}` endpoint).

- [ ] **Step 3: Update `GET /api/exercises` + add new endpoint**

In `api/app/routers/programs.py`, find the existing `@router.get("/exercises")` function (around line 187) and REPLACE it with:

```python
@router.get("/exercises")
async def get_exercises(muscle_group: str | None = None) -> list:
    sql = (
        "SELECT id, name, primary_muscles, equipment, difficulty, "
        "       primary_muscles, secondary_muscles, image_urls "
        "FROM exercises"
    )
    params: tuple = ()
    if muscle_group:
        sql += " WHERE %s = ANY(primary_muscles)"
        params = (muscle_group,)
    sql += " ORDER BY name"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(sql, params)
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_exercises] DB error: {e}")
        return []
    return [
        {
            "id": r[0],
            "name": r[1],
            "muscle_groups": r[2],  # alias for back-compat
            "equipment": r[3],
            "difficulty": r[4],
            "primary_muscles": r[5],
            "secondary_muscles": r[6],
            "image_urls": r[7] or [],
        }
        for r in rows
    ]


@router.get("/exercises/{exercise_id}")
async def get_exercise_by_id(exercise_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, primary_muscles, equipment, difficulty, "
                "       instructions, force, mechanic, category, "
                "       primary_muscles, secondary_muscles, image_urls "
                "FROM exercises WHERE id = %s",
                (exercise_id,),
            )
            row = await cur.fetchone()
    except Exception as e:
        print(f"[get_exercise_by_id] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    if row is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {
        "id": row[0],
        "name": row[1],
        "muscle_groups": row[2],
        "equipment": row[3],
        "difficulty": row[4],
        "instructions": row[5] or "",
        "force": row[6],
        "mechanic": row[7],
        "category": row[8],
        "primary_muscles": row[9],
        "secondary_muscles": row[10],
        "image_urls": row[11] or [],
    }
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_programs_router.py -v -k "exercises"
```
Expected: all PASS.

- [ ] **Step 5: Run full backend suite**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest -v 2>&1 | tail -10
```
Expected: 0 failures.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/routers/programs.py api/tests/test_programs_router.py
git commit -m "feat(api): expose new fields in GET /api/exercises + add GET /api/exercises/{id}"
```

---

### Task 4: Coach tools read from DB

**Files:**
- Modify: `api/app/tools/handlers/read_handlers.py` (replace `search_exercises` and `get_exercise_info`)
- Delete: `api/app/data/exercises.json`
- Modify: `api/tests/test_tools.py` (update existing tests, mocked DB)

- [ ] **Step 1: Update test mocks for the new DB-based implementation**

Open `api/tests/test_tools.py`. Find tests covering `search_exercises` and `get_exercise_info`. They currently mock the file-based `_load_exercises`. Update each to mock the DB pattern. For each test, replace the file-mock with:

```python
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_search_exercises_filters_by_muscle_group(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchall = AsyncMock(return_value=[
        ("Barbell_Squat", "Barbell Squat", ["quadriceps"], ["barbell"], "intermediate"),
    ])
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool("test-user", "search_exercises", {"muscle_group": "quadriceps"})

    assert result["ok"] is True
    assert len(result["exercises"]) == 1
    assert result["exercises"][0]["id"] == "Barbell_Squat"


@pytest.mark.asyncio
async def test_get_exercise_info_returns_detail(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(
        "Barbell_Squat", "Barbell Squat", ["quadriceps"], ["barbell"],
        "intermediate", "Step 1", "push", "compound", "strength",
        ["quadriceps"], ["glutes"],
        ["https://raw.githubusercontent.com/.../0.jpg"],
    ))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool("test-user", "get_exercise_info", {"exercise_id": "Barbell_Squat"})

    assert result["ok"] is True
    assert result["id"] == "Barbell_Squat"
    assert result["instructions"] == "Step 1"
    assert len(result["image_urls"]) == 1


@pytest.mark.asyncio
async def test_get_exercise_info_returns_not_found(make_mock_get_conn):
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.read_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool("test-user", "get_exercise_info", {"exercise_id": "Nope"})

    assert result["ok"] is False
```

Find and DELETE any existing file-based tests for `search_exercises` / `get_exercise_info` (they used `_load_exercises` mocks). Replace with these three.

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_tools.py -v -k "exercise"
```
Expected: FAIL (current handler still reads from JSON).

- [ ] **Step 3: Replace search_exercises and get_exercise_info implementations**

Open `api/app/tools/handlers/read_handlers.py`. Find the existing implementations and the `_load_exercises()` helper. Replace them with:

```python
from app.db import get_conn


async def get_exercise_info(user_id: str, exercise_id: str) -> dict:
    """Return full detail for a single exercise."""
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, primary_muscles, equipment, difficulty, "
                "       instructions, force, mechanic, category, "
                "       primary_muscles, secondary_muscles, image_urls "
                "FROM exercises WHERE id = %s",
                (exercise_id,),
            )
            row = await cur.fetchone()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    if row is None:
        return {"ok": False, "error": f"Exercise '{exercise_id}' not found"}
    return {
        "ok": True,
        "id": row[0],
        "name": row[1],
        "primary_muscles": row[2],
        "equipment": row[3],
        "difficulty": row[4],
        "instructions": row[5] or "",
        "force": row[6],
        "mechanic": row[7],
        "category": row[8],
        "secondary_muscles": row[10],
        "image_urls": row[11] or [],
    }


async def search_exercises(
    user_id: str,
    muscle_group: str | None = None,
    equipment: str | None = None,
    difficulty: str | None = None,
) -> dict:
    """Search exercises by filter. Returns up to 50 matches."""
    sql = "SELECT id, name, primary_muscles, equipment, difficulty FROM exercises WHERE 1=1"
    params: list = []
    if muscle_group:
        sql += " AND %s = ANY(primary_muscles)"
        params.append(muscle_group)
    if equipment:
        sql += " AND %s = ANY(equipment)"
        params.append(equipment)
    if difficulty:
        sql += " AND difficulty = %s"
        params.append(difficulty)
    sql += " ORDER BY name LIMIT 50"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(sql, params)
            rows = await cur.fetchall()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {
        "ok": True,
        "exercises": [
            {
                "id": r[0],
                "name": r[1],
                "primary_muscles": r[2],
                "equipment": r[3],
                "difficulty": r[4],
            }
            for r in rows
        ],
    }
```

Then DELETE the now-unused `_load_exercises()` function (look at the top of the file — it reads from `app/data/exercises.json`). Also DELETE any import of `pathlib.Path` or `json` that becomes unused.

- [ ] **Step 4: Delete the local JSON file**

```bash
rm /Users/trymvestengen/Desktop/ai-coach/api/app/data/exercises.json
```

- [ ] **Step 5: Run to confirm pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_tools.py -v -k "exercise"
```
Expected: 3/3 PASS.

- [ ] **Step 6: Run full backend suite**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest -v 2>&1 | tail -10
```
Expected: 0 failures.

- [ ] **Step 7: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/handlers/read_handlers.py api/app/data/exercises.json api/tests/test_tools.py
git commit -m "feat(coach): read exercises from DB (search + info), drop local JSON cache"
```

---

## Phase 2: Frontend

### Task 5: Lib types + getExerciseDetail

**Files:**
- Modify: `web/src/lib/api.ts`

- [ ] **Step 1: Replace the Exercise type and add ExerciseDetail + getExerciseDetail**

Open `web/src/lib/api.ts`. Find the existing `Exercise` type (likely near the top). REPLACE it with:

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
}

export type ExerciseDetail = Exercise & {
  force: string | null
  mechanic: string | null
  category: string | null
  instructions: string
}
```

Then append at the bottom of the file:

```ts
export async function getExerciseDetail(id: string): Promise<ExerciseDetail> {
  const res = await fetch(`${API_BASE}/api/exercises/${encodeURIComponent(id)}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ExerciseDetail>
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck
```
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/lib/api.ts
git commit -m "feat(web): extend Exercise type + add getExerciseDetail"
```

---

### Task 6: ExerciseDetailModal component

**Files:**
- Create: `web/src/components/exercises/ExerciseDetailModal.tsx`
- Create: `web/src/components/exercises/ExerciseDetailModal.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/components/exercises/ExerciseDetailModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ExerciseDetailModal from "./ExerciseDetailModal"

vi.mock("@/lib/api", () => ({
  getExerciseDetail: vi.fn(),
}))

const MOCK_DETAIL = {
  id: "Barbell_Squat",
  name: "Barbell Squat",
  muscle_groups: ["quadriceps"],
  equipment: ["barbell"],
  difficulty: "intermediate",
  primary_muscles: ["quadriceps"],
  secondary_muscles: ["glutes", "hamstrings"],
  image_urls: [
    "https://raw.githubusercontent.com/.../0.jpg",
    "https://raw.githubusercontent.com/.../1.jpg",
  ],
  force: "push",
  mechanic: "compound",
  category: "strength",
  instructions: "Step 1\n\nStep 2",
}

describe("ExerciseDetailModal", () => {
  it("renders nothing when closed", () => {
    render(<ExerciseDetailModal exerciseId={null} onClose={() => {}} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("fetches and renders detail when opened", async () => {
    const { getExerciseDetail } = await import("@/lib/api")
    vi.mocked(getExerciseDetail).mockResolvedValueOnce(MOCK_DETAIL)

    render(<ExerciseDetailModal exerciseId="Barbell_Squat" onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText("Barbell Squat")).toBeInTheDocument()
    })
    expect(screen.getByText(/quadriceps/i)).toBeInTheDocument()
    expect(screen.getByText(/Step 1/)).toBeInTheDocument()
  })

  it("shows 'Legg til denne' button when onPick prop is provided", async () => {
    const { getExerciseDetail } = await import("@/lib/api")
    vi.mocked(getExerciseDetail).mockResolvedValueOnce(MOCK_DETAIL)
    const onPick = vi.fn()

    render(
      <ExerciseDetailModal
        exerciseId="Barbell_Squat"
        onClose={() => {}}
        onPick={onPick}
      />
    )

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Legg til denne/i })).toBeInTheDocument()
    })
  })

  it("hides 'Legg til denne' button when onPick is omitted", async () => {
    const { getExerciseDetail } = await import("@/lib/api")
    vi.mocked(getExerciseDetail).mockResolvedValueOnce(MOCK_DETAIL)

    render(<ExerciseDetailModal exerciseId="Barbell_Squat" onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText("Barbell Squat")).toBeInTheDocument()
    })
    expect(screen.queryByRole("button", { name: /Legg til denne/i })).not.toBeInTheDocument()
  })

  it("closes when × is clicked", async () => {
    const { getExerciseDetail } = await import("@/lib/api")
    vi.mocked(getExerciseDetail).mockResolvedValueOnce(MOCK_DETAIL)
    const onClose = vi.fn()

    render(<ExerciseDetailModal exerciseId="Barbell_Squat" onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText("Barbell Squat")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /Lukk/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- ExerciseDetailModal.test --run
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement ExerciseDetailModal**

Create `web/src/components/exercises/ExerciseDetailModal.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { getExerciseDetail, type ExerciseDetail } from "@/lib/api"

interface Props {
  exerciseId: string | null
  onClose: () => void
  onPick?: (exerciseId: string) => void
}

export default function ExerciseDetailModal({ exerciseId, onClose, onPick }: Props) {
  const [detail, setDetail] = useState<ExerciseDetail | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!exerciseId) {
      setDetail(null)
      return
    }
    setLoading(true)
    setError(null)
    setActiveImage(0)
    getExerciseDetail(exerciseId)
      .then((d) => setDetail(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Kunne ikke laste"))
      .finally(() => setLoading(false))
  }, [exerciseId])

  if (!exerciseId) return null

  return (
    <div
      role="dialog"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "16px 20px 28px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          type="button"
          aria-label="Lukk"
          onClick={onClose}
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 999,
            width: 32,
            height: 32,
            color: "var(--brand-muted)",
            fontSize: 16,
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        {loading && (
          <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 40 }}>
            Laster…
          </div>
        )}

        {error && (
          <div style={{ color: "var(--danger)", textAlign: "center", padding: 20 }}>
            {error}
          </div>
        )}

        {detail && (
          <>
            {detail.image_urls.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setActiveImage((i) => (i + 1) % detail.image_urls.length)
                }
                aria-label={`Bytt bilde (${activeImage + 1} av ${detail.image_urls.length})`}
                style={{
                  width: "100%",
                  border: "none",
                  background: "var(--brand-surface)",
                  borderRadius: 14,
                  padding: 0,
                  cursor: detail.image_urls.length > 1 ? "pointer" : "default",
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detail.image_urls[activeImage]}
                  alt={detail.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none"
                  }}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "contain",
                    background: "var(--brand-subtle)",
                  }}
                />
              </button>
            )}

            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--brand-ink)",
                letterSpacing: "-0.02em",
                marginBottom: 8,
              }}
            >
              {detail.name}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {detail.primary_muscles.map((m) => (
                <span
                  key={m}
                  style={{
                    background: "var(--brand-subtle)",
                    color: "var(--brand-orange-deep)",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {m}
                </span>
              ))}
              {detail.secondary_muscles.map((m) => (
                <span
                  key={m}
                  style={{
                    background: "var(--brand-surface)",
                    color: "var(--brand-muted)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {m}
                </span>
              ))}
            </div>

            {detail.equipment.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--brand-muted)", marginBottom: 14 }}>
                Utstyr: {detail.equipment.join(", ")}
              </div>
            )}

            {detail.instructions && (
              <div
                style={{
                  fontSize: 14,
                  color: "var(--brand-ink)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  marginBottom: 18,
                }}
              >
                {detail.instructions}
              </div>
            )}

            {onPick && (
              <button
                type="button"
                onClick={() => onPick(detail.id)}
                style={{
                  width: "100%",
                  background: "var(--brand-orange)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Legg til denne
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run to confirm pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- ExerciseDetailModal.test --run
```
Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/exercises/ExerciseDetailModal.tsx web/src/components/exercises/ExerciseDetailModal.test.tsx
git commit -m "feat(web): add ExerciseDetailModal with image carousel + instructions"
```

---

### Task 7: ExercisePickerSheet shows thumbnails + opens modal

**Files:**
- Modify: `web/src/components/program/workout/ExercisePickerSheet.tsx`

- [ ] **Step 1: Open the file and inspect the current structure**

Look at the file at `web/src/components/program/workout/ExercisePickerSheet.tsx`. The current rendering loop iterates over `filtered` exercises and calls `onPick(ex)` on item tap. We're going to:
1. Add a small thumbnail (image_urls[0]) on the left side of each item.
2. Change the tap behavior: instead of immediately calling `onPick`, open `ExerciseDetailModal` and let the modal's "Legg til denne" button call onPick.

- [ ] **Step 2: Update the component**

REPLACE the entire contents of `web/src/components/program/workout/ExercisePickerSheet.tsx` with:

```tsx
"use client"
import { useEffect, useMemo, useState } from "react"
import { getExercises, type Exercise } from "@/lib/api"
import ExerciseDetailModal from "@/components/exercises/ExerciseDetailModal"

interface Props {
  open: boolean
  onClose: () => void
  onPick: (exercise: Exercise) => void
}

export default function ExercisePickerSheet({ open, onClose, onPick }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)

  useEffect(() => {
    if (!open || exercises.length > 0) return
    setLoading(true)
    setError(null)
    getExercises()
      .then(setExercises)
      .catch((e) => setError(e instanceof Error ? e.message : "Kunne ikke laste"))
      .finally(() => setLoading(false))
  }, [open, exercises.length])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return exercises.slice(0, 100)
    return exercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.primary_muscles.some((mg) => mg.toLowerCase().includes(q))
      )
      .slice(0, 100)
  }, [exercises, query])

  const handlePickFromModal = (exerciseId: string) => {
    const ex = exercises.find((e) => e.id === exerciseId)
    if (ex) {
      onPick(ex)
      setDetailId(null)
      onClose()
    }
  }

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 60,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 480,
            background: "var(--brand-canvas)",
            borderRadius: "20px 20px 0 0",
            padding: "14px 20px 28px",
            height: "80vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: 32,
              height: 4,
              background: "var(--brand-border)",
              borderRadius: 999,
              margin: "0 auto 14px",
            }}
          />
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--brand-ink)",
              textAlign: "center",
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            Velg øvelse
          </div>

          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk øvelse eller muskelgruppe…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--brand-surface)",
              border: "1.5px solid var(--brand-border)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 13,
              color: "var(--brand-ink)",
              marginBottom: 12,
            }}
          />

          {error && (
            <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>
          )}

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 20 }}>
                Laster…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 20 }}>
                Ingen treff
              </div>
            ) : (
              filtered.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setDetailId(ex.id)}
                  style={{
                    width: "100%",
                    background: "var(--brand-surface)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 6,
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      background: "var(--brand-subtle)",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {ex.image_urls[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ex.image_urls[0]}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none"
                        }}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>
                      {ex.name}
                    </div>
                    {ex.primary_muscles.length > 0 && (
                      <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 2 }}>
                        {ex.primary_muscles.join(", ")}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <ExerciseDetailModal
        exerciseId={detailId}
        onClose={() => setDetailId(null)}
        onPick={handlePickFromModal}
      />
    </>
  )
}
```

- [ ] **Step 3: Run typecheck + tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck && npm run test -- ExerciseDetailModal.test --run
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/program/workout/ExercisePickerSheet.tsx
git commit -m "feat(web): show thumbnails in ExercisePickerSheet + open detail modal on tap"
```

---

### Task 8: Program-detalj shows thumbnails + modal trigger

**Files:**
- Modify: `web/src/components/program/detail/DayCard.tsx`

- [ ] **Step 1: Find where exercise rows render in the program-detail UI**

The program-detail page is at `web/src/app/(tabs)/program/[programId]/page.tsx`, which renders `web/src/components/program/detail/ProgramDetail.tsx`, which iterates over `program.days` and renders `DayCard` per day. The day card likely shows day name + exercise count today, NOT the exercise rows themselves.

Open `web/src/components/program/detail/DayCard.tsx`. Inspect: does it display exercises? If it only shows the count (e.g. "4 øvelser"), the per-exercise rendering happens elsewhere (probably an expand-on-tap or just doesn't exist yet).

If `DayCard` only shows counts: extend it to show a collapsible list of exercises when tapped. Each exercise row has thumbnail + name + tap → opens ExerciseDetailModal.

- [ ] **Step 2: Extend DayCard with expandable exercise list + modal**

REPLACE the entire contents of `web/src/components/program/detail/DayCard.tsx` with:

```tsx
"use client"
import { useState } from "react"
import ExerciseDetailModal from "@/components/exercises/ExerciseDetailModal"

interface ExerciseRow {
  id: string
  exercise_id: string
  name: string
  image_url?: string | null
}

export interface DaySummary {
  id: string
  day_number: number
  name: string
  exercise_count: number
  exercises?: ExerciseRow[]
}

interface Props {
  day: DaySummary
  isToday: boolean
  onOpen?: (id: string) => void
}

export default function DayCard({ day, isToday, onOpen }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  const handleToggle = () => {
    setExpanded((x) => !x)
    onOpen?.(day.id)
  }

  return (
    <>
      <div
        style={{
          background: "var(--brand-surface)",
          border: "1px solid var(--brand-border)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={handleToggle}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-ink)" }}>
              {day.name}
              {isToday && (
                <span
                  style={{
                    marginLeft: 8,
                    background: "var(--brand-orange)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 999,
                  }}
                >
                  I DAG
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 2 }}>
              {day.exercise_count} øvelser
            </div>
          </div>
          <span style={{ fontSize: 14, color: "var(--brand-muted)" }}>
            {expanded ? "▾" : "▸"}
          </span>
        </button>

        {expanded && day.exercises && day.exercises.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {day.exercises.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setDetailId(ex.exercise_id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--brand-canvas)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: "var(--brand-subtle)",
                    flexShrink: 0,
                    overflow: "hidden",
                  }}
                >
                  {ex.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ex.image_url}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none"
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  )}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>
                  {ex.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <ExerciseDetailModal
        exerciseId={detailId}
        onClose={() => setDetailId(null)}
      />
    </>
  )
}
```

- [ ] **Step 3: Update ProgramDetail to pass exercises into DayCard**

Open `web/src/components/program/detail/ProgramDetail.tsx`. Find the loop that renders `<DayCard day={...} isToday={...} />`. The current `day` prop is the day summary. The full program data (from `GET /api/programs/{id}`) includes `exercises` array per day with each exercise's name and the `exercise_id`. We need to map that into the new `ExerciseRow` shape.

In the rendering loop:

```tsx
{program.days.map((day) => (
  <DayCard
    key={day.id}
    day={{
      id: day.id,
      day_number: day.day_number,
      name: day.name,
      exercise_count: day.exercises?.length ?? 0,
      exercises: day.exercises?.map((ex) => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        name: ex.name,
        image_url: null, // image_url not in current program shape
      })),
    }}
    isToday={day.day_number === todayDayNumber}
  />
))}
```

Find the existing DayCard call inside ProgramDetail and apply this mapping. Image URLs aren't joined into the program-detail API response yet — they'll just be null, and the thumbnail will show a placeholder. That's acceptable for this iteration (the modal still fetches and shows them).

- [ ] **Step 4: Run typecheck + tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck && npm run test -- DayCard.test --run
```
Expected: typecheck PASS; existing DayCard tests may need slight prop adjustment if they used different shape.

If DayCard tests fail because of the prop-shape change, update them to use the new `DaySummary` shape (the test fixtures should add empty `exercises: []` to match).

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/program/detail/DayCard.tsx web/src/components/program/detail/DayCard.test.tsx web/src/components/program/detail/ProgramDetail.tsx
git commit -m "feat(web): expandable DayCard with exercise rows + open ExerciseDetailModal on tap"
```

---

## Phase 3: Cleanup

### Task 9: Delete stale files

**Files to delete (after verifying nothing references them):**

- `api/db/exercises_wger.json`
- `api/db/seed_wger.py`
- `web/src/lib/exercises.ts` (15428 lines of hardcoded exercise data)
- `web/src/components/exercises/ExerciseLibrary.tsx` (likely unused after this refactor)
- `web/src/components/exercises/ExerciseDetail.tsx` (replaced by new modal)
- `web/src/app/exercises/[id]/` (if route exists and is now obsolete)

- [ ] **Step 1: Find all references**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
grep -rn "exercises_wger\|seed_wger" api/
grep -rn 'from "@/lib/exercises"\|from "@/components/exercises/ExerciseLibrary"\|from "@/components/exercises/ExerciseDetail"' web/src/
```

For each reference outside the files being deleted, plan a fix:
- If `web/src/lib/exercises.ts` is imported by an active page or component, replace the import with the new API-based flow (call `getExercises()` from `@/lib/api`).
- If `ExerciseLibrary.tsx` or old `ExerciseDetail.tsx` is referenced, remove the reference (the new `ExerciseDetailModal` is the replacement).

- [ ] **Step 2: Update references to use new patterns**

For each active reference found in Step 1, edit the file to use `getExercises` / `getExerciseDetail` from `@/lib/api` and `ExerciseDetailModal` from `@/components/exercises/ExerciseDetailModal`. Do NOT delete files that still have referencers until all referencers are switched.

- [ ] **Step 3: Delete the stale files**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
rm api/db/exercises_wger.json api/db/seed_wger.py
rm web/src/lib/exercises.ts
# Conditional — only if Step 1 confirmed no remaining referencers:
rm -f web/src/components/exercises/ExerciseLibrary.tsx web/src/components/exercises/ExerciseDetail.tsx
rm -rf web/src/app/exercises/[id] 2>/dev/null || true
```

- [ ] **Step 4: Run full check**

```bash
cd /Users/trymvestengen/Desktop/ai-coach && make check
```
Expected: lint + typecheck + tests + build all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add -A
git commit -m "chore: delete stale exercise data files (wger json, frontend hardcode, old ExerciseLibrary/Detail)"
```

---

## Phase 4: Verification

### Task 10: Manual verification

After all backend + frontend tasks are complete, restart dev servers and verify in the browser:

- [ ] **Scenario 1: Picker shows thumbnails**

Open `localhost:3000/program/workout/<workout_id>` (start a workout first from /program → "+ Start tom økt"). Tap "+ Legg til øvelse". Verify:
- Picker opens with 100 visible exercises
- Each row has a thumbnail (silhouette image from Free Exercise DB)
- Some images may take a moment to load (GitHub CDN)

- [ ] **Scenario 2: Tap exercise → detail modal**

In the picker, tap any exercise. Verify:
- ExerciseDetailModal slides up
- Both images displayed (tap to cycle)
- Name, primary muscle chips (orange), secondary chips (grey)
- Equipment line, instructions block
- "Legg til denne" button at bottom

Tap "Legg til denne". Verify:
- Modal closes, picker closes, exercise appears in the workout-run screen.

- [ ] **Scenario 3: Program-detail expansion + modal**

Open `localhost:3000/program/<program_id>` (any program). Tap a day card. Verify:
- Day expands to show exercise rows
- Each row has thumbnail (or grey placeholder if image_url is null)
- Tap any exercise → ExerciseDetailModal opens with full data
- "Legg til denne" button is NOT shown (modal opened without onPick)

- [ ] **Scenario 4: Coach builds program with new library**

Open `localhost:3000/coach`. Send: "Lag et 3-dagers styrkeprogram med vekter". Verify:
- Coach calls search_exercises (pill: "🔎 Søker etter øvelser")
- Coach calls create_program with proper input (pill: "💪 Lager program…")
- Pill turns "💪 Laget program ✓ [Se →]"
- Tap the link → program detail with the new exercises

If any scenario fails, debug at the appropriate layer.

---

## Self-Review

**1. Spec coverage:**
- ✅ Schema migration (force, mechanic, category, primary/secondary_muscles, image_urls) — Task 1
- ✅ Seed script with FK-dependent cleanup — Task 2
- ✅ GET /api/exercises returns new fields, GET /api/exercises/{id} — Task 3
- ✅ Coach tools query DB instead of file — Task 4
- ✅ Lib types + getExerciseDetail — Task 5
- ✅ ExerciseDetailModal with 2 images + instructions + Legg-til-button — Task 6
- ✅ Picker thumbnails + opens modal — Task 7
- ✅ Program-detalj expandable exercise rows + modal — Task 8
- ✅ Stale file deletion — Task 9
- ✅ Manual 4-scenario verification — Task 10

**2. Placeholder scan:** No "TBD"/"TODO". Task 9 has explicit conditional deletes — that's appropriate caution, not a placeholder.

**3. Type consistency:** `Exercise` shape consistent (id, name, muscle_groups, equipment, difficulty, primary_muscles, secondary_muscles, image_urls). `ExerciseDetail` extends with force, mechanic, category, instructions. `ExerciseRow` (sub-prop on DayCard) has id, exercise_id, name, image_url — distinct from Exercise because it carries the program_exercise.id + exercise_id mapping.

Plan ready.
