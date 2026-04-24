# Auth Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real authentication so users log in with email + password, all routes are protected by Next.js middleware, and FastAPI validates Supabase JWTs instead of using the hardcoded TEST_USER_ID.

**Architecture:** Supabase Auth handles identity. `@supabase/ssr` manages sessions in Next.js via cookies. Middleware redirects unauthenticated requests to `/login`. FastAPI verifies JWTs via Supabase's JWKS endpoint and extracts `user_id` from the token payload.

**Tech Stack:** Supabase Auth, `@supabase/ssr`, Next.js 15 App Router middleware, FastAPI, `python-jose[cryptography]`, PostgreSQL trigger.

---

## File Map

**Backend — new/modified:**
- `api/app/auth.py` — new: `get_current_user_id(request)` function
- `api/requirements.txt` — add `python-jose[cryptography]`
- `api/app/routers/workouts.py` — replace TEST_USER_ID with `get_current_user_id(request)`
- `api/app/routers/programs.py` — replace TEST_USER_ID with `get_current_user_id(request)`
- `api/app/constants.py` — remove TEST_USER_ID
- `api/tests/conftest.py` — add TEST_USER_ID constant + `patch_auth` autouse fixture
- `api/tests/test_auth.py` — new: unit tests for `get_current_user_id`

**Frontend — new/modified:**
- `web/src/lib/supabase.ts` — new: browser + server Supabase client factories
- `web/src/middleware.ts` — new: session refresh + route protection
- `web/src/app/login/page.tsx` — new: login page (email + password)
- `web/src/app/login/forgot-password/page.tsx` — new: forgot password page
- `web/src/app/login/reset-password/page.tsx` — new: reset password page
- `web/src/app/register/page.tsx` — new: registration page
- `web/src/lib/api.ts` — add auth token to all fetch calls

**Database — manual migration (run once):**
- `api/db/migrations/003_users_table.sql` — reference only; run in Supabase SQL editor

---

## Task 1: Database Migration (Manual)

**Files:**
- Reference: `api/db/migrations/003_users_table.sql`

This task is manual — no automated tests. Run the SQL in the Supabase dashboard.

- [ ] **Step 1: Create the migration file**

Create `api/db/migrations/003_users_table.sql` with this exact content:

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT NOT NULL,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 2: Run migration in Supabase SQL editor**

Go to Supabase Dashboard → SQL Editor → paste the SQL above → Run.

Verify by checking Table Editor — you should see a `users` table under the `public` schema.

- [ ] **Step 3: Configure Supabase Auth settings**

In Supabase Dashboard:
1. Authentication → Providers → enable **Email/Password**
2. Authentication → Providers → enable **Email** (magic link, used for password reset)
3. Authentication → URL Configuration → Site URL: `http://localhost:3000`
4. Authentication → URL Configuration → Redirect URLs: add `http://localhost:3000/login/reset-password`

- [ ] **Step 4: Add environment variables**

In `web/.env.local`, add:
```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

In `api/.env`, add:
```
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_JWKS_URL=https://<your-project>.supabase.co/auth/v1/.well-known/jwks.json
```

Find both values in Supabase Dashboard → Settings → API.

- [ ] **Step 5: Commit migration file**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/db/migrations/003_users_table.sql
git commit -m "feat: add public.users table and auth trigger migration"
```

---

## Task 2: Backend JWT Auth Module

**Files:**
- Create: `api/app/auth.py`
- Modify: `api/requirements.txt`
- Create: `api/tests/test_auth.py`

- [ ] **Step 1: Add `python-jose[cryptography]` to requirements**

Open `api/requirements.txt` and add one line at the end:

```
python-jose[cryptography]>=3.3.0
```

The full file should now be:
```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
anthropic>=0.40.0
python-dotenv>=1.0.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
psycopg[binary]>=3.1.0
psycopg-pool>=3.1.0
python-jose[cryptography]>=3.3.0
```

- [ ] **Step 2: Install the new dependency**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
source .venv/bin/activate && pip install python-jose[cryptography]
```

Expected: `Successfully installed python-jose-...`

- [ ] **Step 3: Write the failing tests for `auth.py`**

Create `api/tests/test_auth.py`:

```python
import os
import pytest
from unittest.mock import patch
from jose import JWTError
from fastapi import HTTPException
from starlette.requests import Request

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
os.environ.setdefault("SUPABASE_JWKS_URL", "https://fake.supabase.co/auth/v1/.well-known/jwks.json")


def make_request(headers: dict) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "query_string": b"",
        "headers": [(k.lower().encode(), v.encode()) for k, v in headers.items()],
    }
    return Request(scope)


def test_missing_authorization_header_raises_401():
    from app.auth import get_current_user_id
    request = make_request({})
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(request)
    assert exc_info.value.status_code == 401


def test_non_bearer_authorization_raises_401():
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Basic abc123"})
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(request)
    assert exc_info.value.status_code == 401


def test_valid_bearer_returns_sub():
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Bearer fake.jwt.token"})
    with patch("app.auth._get_jwks", return_value={}), \
         patch("app.auth.jwt.decode", return_value={"sub": "user-abc-123"}):
        user_id = get_current_user_id(request)
    assert user_id == "user-abc-123"


def test_jwt_error_raises_401():
    from app.auth import get_current_user_id
    request = make_request({"Authorization": "Bearer bad.token"})
    with patch("app.auth._get_jwks", return_value={}), \
         patch("app.auth.jwt.decode", side_effect=JWTError("invalid")):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user_id(request)
    assert exc_info.value.status_code == 401
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
source .venv/bin/activate && python -m pytest tests/test_auth.py -v
```

Expected: `ModuleNotFoundError: No module named 'app.auth'` or `ImportError`

- [ ] **Step 5: Create `api/app/auth.py`**

```python
import os
from functools import lru_cache
import httpx
from jose import jwt, JWTError
from fastapi import Request, HTTPException


@lru_cache
def _get_jwks() -> dict:
    url = os.environ["SUPABASE_JWKS_URL"]
    return httpx.get(url, timeout=10).json()


def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth.removeprefix("Bearer ")
    try:
        jwks = _get_jwks()
        payload = jwt.decode(token, jwks, algorithms=["RS256"], audience="authenticated")
        return payload["sub"]
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
source .venv/bin/activate && python -m pytest tests/test_auth.py -v
```

Expected: `4 passed`

- [ ] **Step 7: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/auth.py api/requirements.txt api/tests/test_auth.py
git commit -m "feat: add JWT auth dependency for Supabase token verification"
```

---

## Task 3: Wire Auth into Workouts Router

**Files:**
- Modify: `api/app/routers/workouts.py`
- Modify: `api/tests/conftest.py`
- Modify: `api/tests/test_workout_logging_router.py`
- Modify: `api/tests/test_workouts_router.py`

- [ ] **Step 1: Update conftest.py with TEST_USER_ID and autouse patch**

Open `api/tests/conftest.py`. Replace entire file with:

```python
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
```

- [ ] **Step 2: Update `api/app/routers/workouts.py`**

Replace the top of the file (imports + first function) with auth-aware version. The full new `workouts.py`:

```python
import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()


@router.get("/workouts")
async def get_workouts(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.completed_at, w.notes, w.rpe, w.started_at,
                       json_agg(
                           json_build_object(
                               'exercise_id', ws.exercise_id,
                               'set_number', ws.set_number,
                               'reps', ws.reps,
                               'weight_kg', ws.weight_kg::float,
                               'rpe', ws.rpe
                           ) ORDER BY ws.exercise_id, ws.set_number
                       ) AS sets
                FROM workouts w
                JOIN workout_sets ws ON ws.workout_id = w.id
                WHERE w.user_id = %s AND w.completed_at IS NOT NULL
                GROUP BY w.id, w.completed_at, w.notes, w.rpe, w.started_at
                ORDER BY w.completed_at DESC
                LIMIT 20
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_workouts] DB error: {e}")
        return []
    return [
        {
            "workout_id": str(r[0]),
            "date": r[1].isoformat() if r[1] else None,
            "notes": r[2],
            "rpe": r[3],
            "started_at": r[4].isoformat() if r[4] else None,
            "sets": r[5] or [],
        }
        for r in rows
    ]


class StartWorkoutBody(BaseModel):
    program_day_id: str | None = None


@router.post("/workouts", status_code=201)
async def start_workout(request: Request, body: StartWorkoutBody) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            workout_id = str(uuid.uuid4())
            cur = await conn.execute(
                "INSERT INTO workouts (id, user_id) VALUES (%s, %s) RETURNING id, started_at",
                (workout_id, user_id),
            )
            row = await cur.fetchone()
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[start_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"workout_id": str(row[0]), "started_at": row[1].isoformat()}


class LogSetBody(BaseModel):
    exercise_id: str = Field(min_length=1)
    set_number: int = Field(ge=1)
    reps: int = Field(ge=1)
    weight_kg: float | None = None
    rpe: int | None = Field(None, ge=1, le=10)


@router.post("/workouts/{workout_id}/sets", status_code=201)
async def log_set(workout_id: uuid.UUID, request: Request, body: LogSetBody) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")
            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO workout_sets (id, workout_id, exercise_id, set_number, reps, weight_kg, rpe) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (set_id, workout_id, body.exercise_id, body.set_number, body.reps, body.weight_kg, body.rpe),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[log_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {
        "id": set_id,
        "exercise_id": body.exercise_id,
        "set_number": body.set_number,
        "reps": body.reps,
        "weight_kg": body.weight_kg,
        "rpe": body.rpe,
    }


class CompleteWorkoutBody(BaseModel):
    rpe: int | None = Field(None, ge=1, le=10)
    notes: str | None = None


@router.patch("/workouts/{workout_id}/complete")
async def complete_workout(workout_id: uuid.UUID, request: Request, body: CompleteWorkoutBody) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE workouts SET completed_at = NOW(), rpe = %s, notes = %s "
                "WHERE id = %s AND user_id = %s AND completed_at IS NULL "
                "RETURNING id, completed_at",
                (body.rpe, body.notes, workout_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Workout not found or already completed")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[complete_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"workout_id": str(row[0]), "completed_at": row[1].isoformat()}
```

- [ ] **Step 3: Run existing workout tests to verify they still pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
source .venv/bin/activate && python -m pytest tests/test_workouts_router.py tests/test_workout_logging_router.py -v
```

Expected: all tests pass (the `patch_auth` autouse fixture in conftest provides the mock user_id)

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/routers/workouts.py api/tests/conftest.py
git commit -m "feat: wire real auth into workouts router, replace TEST_USER_ID"
```

---

## Task 4: Wire Auth into Programs Router + Remove TEST_USER_ID

**Files:**
- Modify: `api/app/routers/programs.py`
- Modify: `api/app/constants.py`

- [ ] **Step 1: Update `api/app/routers/programs.py`**

Replace the entire file. The key changes: add `Request` parameter to every handler, call `get_current_user_id(request)`, remove `from app.constants import TEST_USER_ID`.

Full new `programs.py`:

```python
import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id


class AddExerciseBody(BaseModel):
    exercise_id: str = Field(min_length=1)


router = APIRouter()


@router.get("/programs")
async def get_programs(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT p.id, p.name, p.is_active,
                       COUNT(pd.id)::int AS days_count
                FROM programs p
                LEFT JOIN program_days pd ON pd.program_id = p.id
                WHERE p.user_id = %s
                GROUP BY p.id, p.name, p.is_active, p.created_at
                ORDER BY p.is_active DESC, p.created_at DESC
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_programs] DB error: {e}")
        return []
    return [
        {"id": str(r[0]), "name": r[1], "is_active": r[2], "days_count": r[3]}
        for r in rows
    ]


@router.get("/programs/active")
async def get_active_program(request: Request) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, is_active FROM programs WHERE user_id = %s AND is_active = true LIMIT 1",
                (user_id,),
            )
            prog = await cur.fetchone()
            if prog is None:
                raise HTTPException(status_code=404, detail="No active program")

            cur = await conn.execute(
                """
                SELECT pd.id, pd.day_number, pd.name,
                       COALESCE(
                           json_agg(
                               json_build_object(
                                   'id',          pe.id::text,
                                   'exercise_id', pe.exercise_id,
                                   'name',        e.name,
                                   'muscle_groups', e.muscle_groups,
                                   'order_index', pe.order_index,
                                   'sets', (
                                       SELECT COALESCE(
                                           json_agg(
                                               json_build_object(
                                                   'id',         pes.id::text,
                                                   'set_number', pes.set_number,
                                                   'reps',       pes.reps,
                                                   'weight_kg',  pes.weight_kg::float
                                               ) ORDER BY pes.set_number
                                           ),
                                           '[]'::json
                                       )
                                       FROM program_exercise_sets pes
                                       WHERE pes.program_exercise_id = pe.id
                                   )
                               ) ORDER BY pe.order_index
                           ) FILTER (WHERE pe.id IS NOT NULL),
                           '[]'
                       ) AS exercises
                FROM program_days pd
                LEFT JOIN program_exercises pe ON pe.program_day_id = pd.id
                LEFT JOIN exercises e ON e.id = pe.exercise_id
                WHERE pd.program_id = %s
                GROUP BY pd.id, pd.day_number, pd.name
                ORDER BY pd.day_number
                """,
                (prog[0],),
            )
            day_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_active_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog[0]),
        "name": prog[1],
        "is_active": prog[2],
        "days": [
            {"id": str(r[0]), "day_number": r[1], "name": r[2], "exercises": r[3] or []}
            for r in day_rows
        ],
    }


@router.get("/programs/{program_id}")
async def get_program(program_id: uuid.UUID, request: Request) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, is_active FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
            )
            prog = await cur.fetchone()
            if prog is None:
                raise HTTPException(status_code=404, detail="Program not found")

            cur = await conn.execute(
                """
                SELECT pd.id, pd.day_number, pd.name,
                       COALESCE(
                           json_agg(
                               json_build_object(
                                   'id',          pe.id::text,
                                   'exercise_id', pe.exercise_id,
                                   'name',        e.name,
                                   'muscle_groups', e.muscle_groups,
                                   'order_index', pe.order_index,
                                   'sets', (
                                       SELECT COALESCE(
                                           json_agg(
                                               json_build_object(
                                                   'id',         pes.id::text,
                                                   'set_number', pes.set_number,
                                                   'reps',       pes.reps,
                                                   'weight_kg',  pes.weight_kg::float
                                               ) ORDER BY pes.set_number
                                           ),
                                           '[]'::json
                                       )
                                       FROM program_exercise_sets pes
                                       WHERE pes.program_exercise_id = pe.id
                                   )
                               ) ORDER BY pe.order_index
                           ) FILTER (WHERE pe.id IS NOT NULL),
                           '[]'
                       ) AS exercises
                FROM program_days pd
                LEFT JOIN program_exercises pe ON pe.program_day_id = pd.id
                LEFT JOIN exercises e ON e.id = pe.exercise_id
                WHERE pd.program_id = %s
                GROUP BY pd.id, pd.day_number, pd.name
                ORDER BY pd.day_number
                """,
                (program_id,),
            )
            day_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog[0]),
        "name": prog[1],
        "is_active": prog[2],
        "days": [
            {
                "id": str(r[0]),
                "day_number": r[1],
                "name": r[2],
                "exercises": r[3] or [],
            }
            for r in day_rows
        ],
    }


@router.get("/exercises")
async def get_exercises(muscle_group: str | None = None) -> list:
    try:
        async with get_conn() as conn:
            if muscle_group:
                cur = await conn.execute(
                    "SELECT id, name, muscle_groups, equipment, difficulty "
                    "FROM exercises WHERE %s = ANY(muscle_groups) ORDER BY name",
                    (muscle_group,),
                )
            else:
                cur = await conn.execute(
                    "SELECT id, name, muscle_groups, equipment, difficulty FROM exercises ORDER BY name"
                )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_exercises] DB error: {e}")
        return []
    return [
        {"id": r[0], "name": r[1], "muscle_groups": r[2], "equipment": r[3], "difficulty": r[4]}
        for r in rows
    ]


@router.post("/programs/{program_id}/days/{day_id}/exercises")
async def add_exercise_to_day(
    program_id: uuid.UUID, day_id: uuid.UUID, request: Request, body: AddExerciseBody
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Program not found")

            cur = await conn.execute(
                "SELECT id FROM program_days WHERE id = %s AND program_id = %s",
                (day_id, program_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Day not found")

            cur = await conn.execute(
                "SELECT COALESCE(MAX(order_index) + 1, 0) FROM program_exercises WHERE program_day_id = %s",
                (day_id,),
            )
            order_index = (await cur.fetchone())[0]

            cur = await conn.execute(
                "SELECT name, muscle_groups FROM exercises WHERE id = %s",
                (body.exercise_id,),
            )
            ex = await cur.fetchone()
            if ex is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            exercise_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercises (id, program_day_id, exercise_id, order_index) "
                "VALUES (%s, %s, %s, %s)",
                (exercise_id, day_id, body.exercise_id, order_index),
            )

            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercise_sets (id, program_exercise_id, set_number, reps) "
                "VALUES (%s, %s, %s, %s)",
                (set_id, exercise_id, 1, 10),
            )
            await conn.commit()

        return {
            "id": exercise_id,
            "exercise_id": body.exercise_id,
            "name": ex[0],
            "muscle_groups": ex[1],
            "order_index": order_index,
            "sets": [{"id": set_id, "set_number": 1, "reps": 10, "weight_kg": None}],
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_exercise_to_day] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}")
async def get_exercise_detail(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, request: Request
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id, pe.exercise_id, e.name, e.muscle_groups, pe.order_index
                FROM program_exercises pe
                JOIN exercises e ON e.id = pe.exercise_id
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "SELECT id, set_number, reps, weight_kg::float "
                "FROM program_exercise_sets WHERE program_exercise_id = %s ORDER BY set_number",
                (exercise_id,),
            )
            set_rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_exercise_detail] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(row[0]),
        "exercise_id": row[1],
        "name": row[2],
        "muscle_groups": row[3],
        "order_index": row[4],
        "sets": [
            {"id": str(s[0]), "set_number": s[1], "reps": s[2], "weight_kg": s[3]}
            for s in set_rows
        ],
    }


class SetBody(BaseModel):
    reps: int = Field(ge=1)
    weight_kg: float | None = None


@router.post("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets")
async def add_set(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, request: Request, body: SetBody
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "SELECT COALESCE(MAX(set_number) + 1, 1) "
                "FROM program_exercise_sets WHERE program_exercise_id = %s",
                (exercise_id,),
            )
            set_number = (await cur.fetchone())[0]

            set_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercise_sets "
                "(id, program_exercise_id, set_number, reps, weight_kg) "
                "VALUES (%s, %s, %s, %s, %s)",
                (set_id, exercise_id, set_number, body.reps, body.weight_kg),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[add_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {"id": set_id, "set_number": set_number, "reps": body.reps, "weight_kg": body.weight_kg}


@router.patch("/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets/{set_id}")
async def update_set(
    program_id: uuid.UUID,
    day_id: uuid.UUID,
    exercise_id: uuid.UUID,
    set_id: uuid.UUID,
    request: Request,
    body: SetBody,
) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "UPDATE program_exercise_sets SET reps = %s, weight_kg = %s "
                "WHERE id = %s AND program_exercise_id = %s "
                "RETURNING id, set_number, reps, weight_kg::float",
                (body.reps, body.weight_kg, set_id, exercise_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Set not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[update_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {"id": str(row[0]), "set_number": row[1], "reps": row[2], "weight_kg": row[3]}


@router.delete(
    "/programs/{program_id}/days/{day_id}/exercises/{exercise_id}/sets/{set_id}",
    status_code=204,
)
async def delete_set(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, set_id: uuid.UUID,
    request: Request,
) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur = await conn.execute(
                "DELETE FROM program_exercise_sets "
                "WHERE id = %s AND program_exercise_id = %s RETURNING id",
                (set_id, exercise_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Set not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_set] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/programs/{program_id}", status_code=204)
async def delete_program(program_id: uuid.UUID, request: Request) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM programs WHERE id = %s AND user_id = %s RETURNING id",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Program not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_program] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete(
    "/programs/{program_id}/days/{day_id}/exercises/{exercise_id}",
    status_code=204,
)
async def delete_exercise(
    program_id: uuid.UUID, day_id: uuid.UUID, exercise_id: uuid.UUID, request: Request
) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT pe.id FROM program_exercises pe
                JOIN program_days pd ON pd.id = pe.program_day_id
                JOIN programs p ON p.id = pd.program_id
                WHERE pe.id = %s AND pd.id = %s AND p.id = %s AND p.user_id = %s
                """,
                (exercise_id, day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")

            cur2 = await conn.execute(
                "DELETE FROM program_exercises WHERE id = %s RETURNING id",
                (exercise_id,),
            )
            if await cur2.fetchone() is None:
                raise HTTPException(status_code=404, detail="Exercise not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_exercise] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

- [ ] **Step 2: Remove TEST_USER_ID from `api/app/constants.py`**

Replace `api/app/constants.py` with an empty file (or delete the line). The simplest is to make it an empty file since other code may import from it in the future:

```python
```

(Empty file — just save it empty.)

- [ ] **Step 3: Run all backend tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
source .venv/bin/activate && python -m pytest tests/ -v
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/routers/programs.py api/app/constants.py
git commit -m "feat: wire real auth into programs router, remove TEST_USER_ID constant"
```

---

## Task 5: Frontend Supabase Client

**Files:**
- Modify: `web/package.json` (install dependency)
- Create: `web/src/lib/supabase.ts`

- [ ] **Step 1: Install `@supabase/ssr`**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npm install @supabase/ssr @supabase/supabase-js
```

Expected: packages added to `node_modules` and `package.json`

- [ ] **Step 2: Create `web/src/lib/supabase.ts`**

```typescript
import { createBrowserClient } from "@supabase/ssr"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/package.json web/package-lock.json web/src/lib/supabase.ts
git commit -m "feat: add Supabase browser and server client factories"
```

---

## Task 6: Next.js Middleware

**Files:**
- Create: `web/src/middleware.ts`

The middleware refreshes the Supabase session on every request and redirects unauthenticated users to `/login`. Authenticated users visiting `/login` or `/register` are sent to `/home`.

- [ ] **Step 1: Create `web/src/middleware.ts`**

```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login", "/register"]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isPublic) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/middleware.ts
git commit -m "feat: add Next.js middleware for session refresh and route protection"
```

---

## Task 7: Login, Forgot Password, and Reset Password Pages

**Files:**
- Create: `web/src/app/login/page.tsx`
- Create: `web/src/app/login/forgot-password/page.tsx`
- Create: `web/src/app/login/reset-password/page.tsx`

All pages use dark theme matching the app (dark bg `#0d0d0d`, accent `var(--ai-accent)` orange). The `/login` page uses layout B: hero section with branding on top, form in a rounded bottom panel.

- [ ] **Step 1: Create `web/src/app/login/page.tsx`**

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("Feil e-post eller passord")
      setLoading(false)
      return
    }
    router.push("/home")
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg, #ff6b35, #c94a1a)" }}
        >
          💪
        </div>
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold tracking-tight">AI Coach</h1>
          <p
            className="text-xs font-semibold uppercase tracking-widest mt-1"
            style={{ color: "var(--ai-accent)" }}
          >
            Din personlige trener
          </p>
        </div>
        <p className="text-sm text-center leading-relaxed mt-1" style={{ color: "#555", maxWidth: 200 }}>
          Logg treninger, følg progresjon og få personlig coaching
        </p>
      </div>

      <div className="rounded-t-3xl px-6 pt-6 pb-8" style={{ background: "#111" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
            }}
          />
          <input
            type="password"
            placeholder="Passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
            }}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 mt-1"
            style={{ background: "var(--ai-accent)" }}
          >
            {loading ? "Logger inn..." : "Logg inn"}
          </button>
        </form>
        <div className="flex justify-between mt-4">
          <Link href="/login/forgot-password" className="text-xs" style={{ color: "#666" }}>
            Glemt passord?
          </Link>
          <Link href="/register" className="text-xs" style={{ color: "#666" }}>
            Ny bruker?
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `web/src/app/login/forgot-password/page.tsx`**

```tsx
"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/login/reset-password",
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg, #ff6b35, #c94a1a)" }}
        >
          💪
        </div>
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-tight">Glemt passord?</h1>
          <p className="text-sm mt-2" style={{ color: "#666" }}>
            Vi sender deg en lenke for å tilbakestille passordet
          </p>
        </div>
      </div>

      <div className="rounded-t-3xl px-6 pt-6 pb-8" style={{ background: "#111" }}>
        {sent ? (
          <div className="text-center py-4">
            <p className="text-white font-semibold">Sjekk e-posten din</p>
            <p className="text-sm mt-2" style={{ color: "#666" }}>
              Vi har sendt en tilbakestillingslenke til {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="E-post"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 mt-1"
              style={{ background: "var(--ai-accent)" }}
            >
              {loading ? "Sender..." : "Send tilbakestillingslenke"}
            </button>
          </form>
        )}
        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs" style={{ color: "#666" }}>
            ← Tilbake til innlogging
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `web/src/app/login/reset-password/page.tsx`**

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/home")
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg, #ff6b35, #c94a1a)" }}
        >
          💪
        </div>
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-tight">Nytt passord</h1>
          <p className="text-sm mt-2" style={{ color: "#666" }}>
            Velg et nytt passord for kontoen din
          </p>
        </div>
      </div>

      <div className="rounded-t-3xl px-6 pt-6 pb-8" style={{ background: "#111" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="Nytt passord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 mt-1"
            style={{ background: "var(--ai-accent)" }}
          >
            {loading ? "Lagrer..." : "Lagre passord"}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/login/
git commit -m "feat: add login, forgot password, and reset password pages"
```

---

## Task 8: Register Page

**Files:**
- Create: `web/src/app/register/page.tsx`

Temporary simple registration (will be replaced by onboarding flow in the next sprint). Collects fornavn, etternavn, e-post, passord.

- [ ] **Step 1: Create `web/src/app/register/page.tsx`**

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push("/home")
  }

  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: "linear-gradient(135deg, #ff6b35, #c94a1a)" }}
        >
          💪
        </div>
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold tracking-tight">Opprett konto</h1>
          <p className="text-sm mt-2" style={{ color: "#666" }}>
            Kom i gang med AI Coach
          </p>
        </div>
      </div>

      <div className="rounded-t-3xl px-6 pt-6 pb-8" style={{ background: "#111" }}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Fornavn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <input
              type="text"
              placeholder="Etternavn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
          </div>
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          />
          <input
            type="password"
            placeholder="Passord (minst 6 tegn)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 mt-1"
            style={{ background: "var(--ai-accent)" }}
          >
            {loading ? "Oppretter konto..." : "Opprett konto"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-xs" style={{ color: "#666" }}>
            Har du allerede en konto? Logg inn
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/register/
git commit -m "feat: add temporary register page (replaced by onboarding in next sprint)"
```

---

## Task 9: Auth Headers in API Client

**Files:**
- Modify: `web/src/lib/api.ts`

Add `getAuthHeaders()` helper and attach `Authorization: Bearer <token>` to every existing `fetch()` call.

- [ ] **Step 1: Update `web/src/lib/api.ts`**

Replace the entire file with the auth-aware version:

```typescript
import { createClient } from "./supabase"

export type Message = {
  role: "user" | "assistant"
  content: string
}

export type Persona = "friend" | "sergeant" | "analyst"

export type WorkoutSet = {
  exercise_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  rpe: number | null
}

export type Workout = {
  workout_id: string
  date: string
  notes: string | null
  rpe: number | null
  started_at: string | null
  sets: WorkoutSet[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function getAuthHeaders(): Promise<HeadersInit> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

export async function sendMessage(messages: Message[], persona: Persona = "friend"): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ messages, persona }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const data = await res.json()
  return data.message as string
}

export async function getWorkouts(): Promise<Workout[]> {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Workout[]>
}

export interface ProgramExerciseSet {
  id: string
  set_number: number
  reps: number
  weight_kg: number | null
}

export interface ProgramExercise {
  id: string
  exercise_id: string
  name: string
  muscle_groups: string[]
  order_index: number
  sets: ProgramExerciseSet[]
}

export type ProgramDay = {
  id: string
  day_number: number
  name: string
  exercises: ProgramExercise[]
}

export type Program = {
  id: string
  name: string
  is_active: boolean
  days_count?: number
  days?: ProgramDay[]
}

export type Exercise = {
  id: string
  name: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: string
}

export async function getPrograms(): Promise<Program[]> {
  const res = await fetch(`${API_BASE}/api/programs`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program[]>
}

export async function getProgram(id: string): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/${id}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

export async function getExercises(muscleGroup?: string): Promise<Exercise[]> {
  const base = `${API_BASE}/api/exercises`
  const url = muscleGroup ? `${base}?muscle_group=${encodeURIComponent(muscleGroup)}` : base
  const res = await fetch(url, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Exercise[]>
}

export async function addExerciseToDay(
  programId: string,
  dayId: string,
  body: { exercise_id: string }
): Promise<ProgramExercise> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days/${dayId}/exercises`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExercise>
}

export async function getExerciseDetail(
  programId: string,
  dayId: string,
  exerciseId: string
): Promise<ProgramExercise> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExercise>
}

export async function addSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  body: { reps: number; weight_kg?: number | null }
): Promise<ProgramExerciseSet> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets`,
    {
      method: "POST",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExerciseSet>
}

export async function updateSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  setId: string,
  body: { reps: number; weight_kg: number | null }
): Promise<ProgramExerciseSet> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets/${setId}`,
    {
      method: "PATCH",
      headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ProgramExerciseSet>
}

export async function deleteSet(
  programId: string,
  dayId: string,
  exerciseId: string,
  setId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}/sets/${setId}`,
    {
      method: "DELETE",
      headers: await getAuthHeaders(),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function deleteExercise(
  programId: string,
  dayId: string,
  exerciseId: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/programs/${programId}/days/${dayId}/exercises/${exerciseId}`,
    {
      method: "DELETE",
      headers: await getAuthHeaders(),
    }
  )
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function deleteProgram(programId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/programs/${programId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function getActiveProgram(): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/active`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

export async function startWorkout(programDayId?: string): Promise<{ workout_id: string; started_at: string }> {
  const res = await fetch(`${API_BASE}/api/workouts`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ program_day_id: programDayId ?? null }),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

export async function logSet(
  workoutId: string,
  body: {
    exercise_id: string
    set_number: number
    reps: number
    weight_kg?: number | null
    rpe?: number | null
  }
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/sets`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}

export async function completeWorkout(
  workoutId: string,
  body?: { rpe?: number; notes?: string }
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/workouts/${workoutId}/complete`, {
    method: "PATCH",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/lib/api.ts
git commit -m "feat: attach Supabase auth token to all API fetch calls"
```

---

## Manual Verification Checklist

After all tasks are complete, verify the full flow with a running app:

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npm run dev:all
```

1. Visit `http://localhost:3000` — should redirect to `/login`
2. Visit `http://localhost:3000/home` — should redirect to `/login`
3. On `/login`, enter wrong credentials — should show "Feil e-post eller passord"
4. On `/login`, click "Ny bruker?" — should go to `/register`
5. On `/register`, create a new account — should redirect to `/home`
6. On `/home`, confirm the page loads (not redirected back to `/login`)
7. Refresh the page — should stay on `/home` (session persists in cookie)
8. Visit `/login` while logged in — should redirect to `/home`
9. Click "Glemt passord?" → enter email → confirm "Sjekk e-posten din" appears
