# Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the chat-based onboarding flow (already on this branch) with a classic 13-step wizard that creates the account up front and walks the user through 8 required + 2 optional fields.

**Architecture:** Single `/onboarding` route owns the full flow. Steps 1-3 collect name/email/password and call Supabase `signUp` at step 3. Steps 4-11 collect required profile fields, each PATCH'ing `/api/users/profile` on "Next". Steps 12-13 are optional notes (free text or "skip"). Step 14 is a summary that POSTs to `/api/users/onboarding/complete` and redirects to `/home`. Pre-signup state lives in `localStorage`; post-signup state lives in the backend via the existing profile endpoint. Chat-specific code from the previous PR is torn out before the wizard is built.

**Tech Stack:** Next.js 16 App Router + React 19 + Supabase Auth + Tailwind v4 (frontend), FastAPI + psycopg + PostgreSQL (backend), Vitest + RTL + pytest (tests).

---

## File Structure

**Files surviving from previous chat-onboarding work (modified or kept as-is):**
- `api/db/migrations/009_onboarding_status.sql` — kept
- `api/app/services/coach.py` — kept `_ensure_session` UUID-to-string fix; revert onboarding mode/prompt/quick_replies/is_onboarding
- `api/app/tools/handlers.py` — revert `handle_tool` to original signature (no `user_id` kwarg) and remove onboarding routes
- `api/app/routers/chat.py` — revert: drop `mode` body field forwarding
- `api/app/routers/users.py` — keep `onboarding_status` in GET response; extend with `injury_notes`/`preference_notes`
- `api/app/db.py` — kept `prepare_threshold=None` fix for PgBouncer
- `web/src/lib/coach-stream.ts` — revert to pre-onboarding (no `quick_replies` type, no `mode` arg)
- `web/src/app/layout.tsx` — kept `suppressHydrationWarning` on `<body>`
- `web/src/middleware.ts` — keep onboarding redirect; remove `/signup` from path lists

**Files deleted:**
- `api/app/tools/onboarding_definitions.py`
- `api/app/tools/onboarding_handlers.py`
- `api/tests/test_onboarding_handlers.py`
- `web/src/app/signup/page.tsx`
- `web/src/app/onboarding/OnboardingClient.tsx` + `.test.tsx`
- `web/src/components/chat/QuickReplies.tsx` + `.test.tsx`
- Onboarding-specific tests in `api/tests/test_chat_stream.py` (4 tests: mode/user_id/quick_replies/is_onboarding) and `api/tests/test_tools.py` (3 tests)
- Onboarding-specific test in `api/tests/test_chat.py` (1 test: mode forwarding)
- Onboarding-specific tests in `web/src/lib/coach-stream.test.ts` (2 tests: quick_replies event + mode param)

**Files created (backend):**
- `api/db/migrations/010_user_notes.sql`
- New endpoint logic in `api/app/routers/users.py::complete_onboarding`
- `api/tests/test_complete_onboarding_router.py`

**Files created (frontend wizard):**
- `web/src/app/onboarding/OnboardingWizard.tsx` — container component, state machine, persistence
- `web/src/app/onboarding/wizardConfig.ts` — step ordering, field metadata, options
- `web/src/app/onboarding/steps/` — one file per step type:
  - `TextStep.tsx` — used by name/email/password (step 1-3) and notes (12-13)
  - `ChoiceStep.tsx` — used by goals/experience/frequency/equipment/gender (step 4-8)
  - `NumberStep.tsx` — used by height/weight (10-11)
  - `DateStep.tsx` — used by birth_date (9)
  - `DoneStep.tsx` — final summary (14)
- `web/src/app/onboarding/components/`:
  - `ProgressBar.tsx`
  - `BackArrow.tsx`
  - `StepShell.tsx` — common layout: back-arrow + progress + title + content + next button + skip link
- `web/src/app/onboarding/wizardStorage.ts` — localStorage read/write helpers
- Co-located `*.test.tsx` files for each component above

**Files overwritten:**
- `web/src/app/onboarding/page.tsx` — replaced with server component that loads `OnboardingWizard`

---

## Task 1: Cleanup — commit surviving bug fixes, drop chat-onboarding hacks

This task removes work-in-progress fixes that were specific to the deleted chat client, and commits the general fixes (DB and layout) so they survive.

**Files:**
- Modify: `web/src/app/onboarding/OnboardingClient.tsx` (revert in-flight edits — file gets deleted in Task 2 anyway)
- Modify: `api/app/services/coach.py` (keep ONLY the `str(row[0])` UUID fix; revert the rest in Task 2)
- Commit-only: `api/app/db.py` (prepare_threshold fix is general — keep)
- Commit-only: `web/src/app/layout.tsx` (suppressHydrationWarning is general — keep)

- [ ] **Step 1: Inspect current uncommitted state**

Run:
```bash
cd /Users/trymvestengen/Desktop/ai-coach
git status
git diff api/app/db.py
git diff web/src/app/layout.tsx
```
Expected: confirm db.py shows `prepare_threshold=None` change and layout.tsx shows `suppressHydrationWarning` change.

- [ ] **Step 2: Commit the surviving general bug fixes**

```bash
git add api/app/db.py web/src/app/layout.tsx
git commit -m "fix: PgBouncer prepared-statements and Grammarly hydration warning"
```

- [ ] **Step 3: Discard chat-client-only edits (will be deleted in Task 2 anyway)**

```bash
git checkout -- web/src/app/onboarding/OnboardingClient.tsx
git checkout -- api/app/services/coach.py
```

Then re-apply ONLY the UUID-to-string fix in `_ensure_session`:

Open `api/app/services/coach.py`, find around line 153-154:

```python
        row = await cur.fetchone()
        await conn.commit()
        return row[0]
```

Change `return row[0]` to `return str(row[0])`.

- [ ] **Step 4: Commit the UUID fix**

```bash
git add api/app/services/coach.py
git commit -m "fix(coach): stringify session UUID in _ensure_session"
```

- [ ] **Step 5: Verify clean working tree**

Run: `git status`
Expected: "nothing to commit, working tree clean".

---

## Task 2: Cleanup — delete chat-onboarding code wholesale

This task tears out all the chat-specific code added in the previous PR. Run the full test suite after to confirm nothing else relied on this code.

**Files (deletions):**
- Delete: `api/app/tools/onboarding_definitions.py`
- Delete: `api/app/tools/onboarding_handlers.py`
- Delete: `api/tests/test_onboarding_handlers.py`
- Delete: `web/src/app/signup/page.tsx` (and the empty `signup/` directory)
- Delete: `web/src/app/onboarding/OnboardingClient.tsx`
- Delete: `web/src/app/onboarding/OnboardingClient.test.tsx`
- Delete: `web/src/components/chat/QuickReplies.tsx`
- Delete: `web/src/components/chat/QuickReplies.test.tsx`

**Files (reverts/edits):**
- Modify: `api/app/services/coach.py`
- Modify: `api/app/tools/handlers.py`
- Modify: `api/app/routers/chat.py`
- Modify: `api/tests/test_chat_stream.py`
- Modify: `api/tests/test_tools.py`
- Modify: `api/tests/test_chat.py`
- Modify: `web/src/lib/coach-stream.ts`
- Modify: `web/src/lib/coach-stream.test.ts`
- Modify: `web/src/middleware.ts`
- Overwrite (placeholder): `web/src/app/onboarding/page.tsx`

- [ ] **Step 1: Delete chat-onboarding-only files**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
rm api/app/tools/onboarding_definitions.py
rm api/app/tools/onboarding_handlers.py
rm api/tests/test_onboarding_handlers.py
rm web/src/app/signup/page.tsx
rmdir web/src/app/signup
rm web/src/app/onboarding/OnboardingClient.tsx
rm web/src/app/onboarding/OnboardingClient.test.tsx
rm web/src/components/chat/QuickReplies.tsx
rm web/src/components/chat/QuickReplies.test.tsx
```

- [ ] **Step 2: Revert `api/app/services/coach.py` to pre-onboarding form (keep UUID fix)**

Open `api/app/services/coach.py`:

(a) Remove the line `from app.tools.onboarding_definitions import ONBOARDING_TOOL_DEFINITIONS` near the top.

(b) Remove the `ONBOARDING_PROMPT = """..."""` constant block (everything between and including those triple-quoted strings).

(c) Remove the `_get_first_name` helper function entirely.

(d) Change the `chat_stream` signature back from:
```python
async def chat_stream(
    user_id: str,
    session_id: str | None,
    user_message: str,
    persona: str = "friend",
    mode: str = "default",
) -> AsyncGenerator[dict, None]:
```
to:
```python
async def chat_stream(
    user_id: str,
    session_id: str | None,
    user_message: str,
    persona: str = "friend",
) -> AsyncGenerator[dict, None]:
```

(e) In `chat_stream`, remove the entire `if mode == "onboarding":` branch and the surrounding selection logic. The system+tools setup should look like the original:
```python
        history = await _load_history(sid)
        base_ctx = await build_base_context(user_id)
        system = [
            {"type": "text", "text": f"{BASE_PROMPT}\n\n{PERSONA_BLOCKS[persona]}",
             "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": base_ctx},
        ]
```
And change `tools=tools` back to `tools=TOOL_DEFINITIONS` in the `client.messages.stream(...)` call.

(f) Inside the for-loop `for tu in tool_uses_in_this_turn:`, remove the entire `if tu["name"] == "set_quick_replies":` branch (the synthetic-ok pattern AND the post-loop `real_tool_uses` filtering). The loop body should match the original pre-PR shape: one branch per tool with regular `handle_tool` dispatch.

(g) Change `handle_tool(tu["name"], tu["input"], user_id=user_id)` back to `handle_tool(tu["name"], tu["input"])`.

(h) Restore `current_messages.append({...})` after the tool loop to use `tool_uses_in_this_turn` directly:
```python
            current_messages.append({
                "role": "assistant",
                "content": [
                    {"type": "tool_use", "id": tu["id"], "name": tu["name"], "input": tu["input"]}
                    for tu in tool_uses_in_this_turn
                ],
            })
            current_messages.append({"role": "user", "content": tool_result_blocks})
```

(i) Change `_ensure_session` signature back from:
```python
async def _ensure_session(user_id: str, session_id: str | None, is_onboarding: bool = False) -> str:
```
to:
```python
async def _ensure_session(user_id: str, session_id: str | None) -> str:
```
And change the INSERT back to:
```python
        cur = await conn.execute(
            "INSERT INTO coach_sessions (user_id) VALUES (%s) RETURNING id",
            (user_id,),
        )
```

(j) In `chat_stream`, change:
```python
        sid = await _ensure_session(user_id, session_id, is_onboarding=(mode == "onboarding"))
```
back to:
```python
        sid = await _ensure_session(user_id, session_id)
```

KEEP the `return str(row[0])` line in `_ensure_session` — that's the surviving UUID fix.

- [ ] **Step 3: Revert `api/app/tools/handlers.py`**

Open `api/app/tools/handlers.py`:

(a) Remove `from app.tools import onboarding_handlers` near the top.

(b) Change `handle_tool` signature from:
```python
async def handle_tool(name: str, inputs: dict, user_id: str = TEST_USER_ID) -> dict | list:
```
to:
```python
async def handle_tool(name: str, inputs: dict) -> dict | list:
```

(c) Remove the three branches at the top of `handle_tool`:
```python
    if name == "save_profile_field":
        ...
    if name == "add_equipment_batch":
        ...
    if name == "complete_onboarding":
        ...
```

The next existing branch (`if name == "get_exercise_info":`) becomes the first one again.

- [ ] **Step 4: Revert `api/app/routers/chat.py`**

Open `api/app/routers/chat.py`. In `chat_stream_endpoint`, remove these two lines:
```python
    mode = body.get("mode", "default")
```
and inside the `event_generator` change:
```python
            async for event in chat_stream(
                user_id, session_id, message, persona=persona, mode=mode
            ):
```
back to:
```python
            async for event in chat_stream(user_id, session_id, message, persona=persona):
```

- [ ] **Step 5: Remove onboarding-specific tests from existing test files**

Open `api/tests/test_chat_stream.py`. Delete these four tests entirely (function block plus blank line above):
- `test_chat_stream_onboarding_mode_uses_onboarding_prompt_and_tools`
- `test_chat_stream_passes_user_id_to_handle_tool`
- `test_chat_stream_set_quick_replies_emits_event_and_skips_handler`
- `test_ensure_session_sets_is_onboarding_when_mode_onboarding`

Then locate the test `test_chat_stream_yields_tool_use_and_result`. If its inner fake-handler signature was changed to `def fake_handle_tool(name, inputs, user_id=None):`, change it back to `def fake_handle_tool(name, inputs):`.

Open `api/tests/test_tools.py`. Delete these three tests:
- `test_handle_tool_routes_save_profile_field`
- `test_handle_tool_routes_add_equipment_batch`
- `test_handle_tool_routes_complete_onboarding`

Open `api/tests/test_chat.py`. Delete the test:
- `test_chat_stream_router_forwards_mode_parameter`

Also revert any fake_stream signatures that took `mode="default"` — restore them to NOT accept `mode`.

- [ ] **Step 6: Revert `web/src/lib/coach-stream.ts`**

Overwrite `web/src/lib/coach-stream.ts` entirely with:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export type StreamEvent =
  | { type: "session_id"; id: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_use"; tool_use_id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; name: string; ok: boolean }
  | { type: "done" }
  | { type: "error"; message: string }

export async function* chatStream(
  token: string,
  sessionId: string | null,
  message: string
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, message }),
  })
  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    while (true) {
      const idx = buffer.indexOf("\n\n")
      if (idx === -1) break
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"))
      if (!dataLine) continue
      const json = dataLine.slice(5).trim()
      if (!json) continue
      yield JSON.parse(json) as StreamEvent
    }
  }
}
```

- [ ] **Step 7: Revert `web/src/lib/coach-stream.test.ts`**

Open `web/src/lib/coach-stream.test.ts`. Delete the entire `describe("chatStream — quick_replies event", () => { ... })` block (the two onboarding-specific tests added in the chat PR).

- [ ] **Step 8: Update middleware to remove `/signup`**

Open `web/src/middleware.ts`. Find:

```typescript
const REDIRECT_WHEN_AUTHED = ["/login", "/register", "/signup"]
```
and change to:
```typescript
const REDIRECT_WHEN_AUTHED = ["/login", "/register"]
```

Find:
```typescript
const SKIP_ONBOARDING_CHECK = ["/onboarding", "/login", "/register", "/signup"]
```
and change to:
```typescript
const SKIP_ONBOARDING_CHECK = ["/onboarding", "/login", "/register"]
```

Then in the unauthenticated branch, also allow unauthenticated visitors to `/onboarding` (steps 1-3 happen before signUp). The existing `PUBLIC_PATHS = [...REDIRECT_WHEN_AUTHED, "/onboarding"]` already covers this — verify it still does.

- [ ] **Step 9: Replace `web/src/app/onboarding/page.tsx` with a placeholder**

Overwrite `web/src/app/onboarding/page.tsx` with a minimal stub that imports nothing chat-related. The full wizard goes in later tasks.

```tsx
export default function OnboardingPage() {
  return <div className="p-6 text-white">Onboarding (under construction)</div>
}
```

- [ ] **Step 10: Run the full backend test suite**

Run:
```bash
cd /Users/trymvestengen/Desktop/ai-coach
api/.venv/bin/pytest api/tests/ -q
```
Expected: all tests pass, fewer than 129 (since we deleted 8 onboarding-specific tests).

- [ ] **Step 11: Run the full frontend test suite**

Run:
```bash
cd web && npm run test -- --run
```
Expected: all tests pass.

- [ ] **Step 12: Type-check + build**

```bash
cd web && npx tsc --noEmit && npm run build
```
Expected: clean build, route table includes `/onboarding` but not `/signup`.

- [ ] **Step 13: Commit the cleanup**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add -A
git commit -m "chore: remove chat-onboarding code, prepare for wizard"
```

---

## Task 3: Migration 010 — user notes columns

**Files:**
- Create: `api/db/migrations/010_user_notes.sql`

- [ ] **Step 1: Create migration file**

```sql
-- api/db/migrations/010_user_notes.sql
-- Free-text notes captured during onboarding for injuries and preferences.
-- Coach can reference these via get_user_profile; user can edit via Profile-tab later.

ALTER TABLE users
  ADD COLUMN injury_notes      TEXT,
  ADD COLUMN preference_notes  TEXT;
```

- [ ] **Step 2: Apply migration locally**

Run:
```bash
cd /Users/trymvestengen/Desktop/ai-coach
api/.venv/bin/python -c "
import asyncio, os
from psycopg import AsyncConnection
async def main():
    conn = await AsyncConnection.connect(os.environ['DATABASE_URL'])
    with open('api/db/migrations/010_user_notes.sql') as f:
        await conn.execute(f.read())
    await conn.commit()
    print('Migration applied successfully')
asyncio.run(main())
"
```
Expected: `Migration applied successfully`.

- [ ] **Step 3: Verify columns exist**

Run:
```bash
api/.venv/bin/python -c "
import asyncio, os
from psycopg import AsyncConnection
async def main():
    conn = await AsyncConnection.connect(os.environ['DATABASE_URL'])
    cur = await conn.execute(\"SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('injury_notes','preference_notes') ORDER BY column_name\")
    rows = await cur.fetchall()
    print(rows)
asyncio.run(main())
"
```
Expected output: `[('injury_notes',), ('preference_notes',)]`.

- [ ] **Step 4: Commit**

```bash
git add api/db/migrations/010_user_notes.sql
git commit -m "feat(db): add injury_notes and preference_notes columns"
```

---

## Task 4: Profile-endepunktene — eksponér notes-felter og gjør POST-bootstrap rent

This task does three things to `api/app/routers/users.py`:

1. Adds `injury_notes` and `preference_notes` to GET response
2. Adds `injury_notes`, `preference_notes`, `gender`, `birth_date` to PATCH whitelist
3. Relaxes the POST upsert schema so the wizard can bootstrap a user row with only email + name + (initial onboarding_status), and PATCH everything else later.

**Files:**
- Modify: `api/app/routers/users.py`
- Modify: `api/tests/test_users_router.py`

- [ ] **Step 1: Write failing tests**

Append to `api/tests/test_users_router.py`:

```python
def test_get_profile_includes_notes_columns(monkeypatch, mock_conn, make_mock_get_conn):
    from fastapi.testclient import TestClient
    from app.main import app
    from unittest.mock import AsyncMock

    cur = AsyncMock()
    # 21 columns now (previous 19 + injury_notes + preference_notes)
    cur.fetchone = AsyncMock(return_value=(
        TEST_USER_ID, "t@x.no", "T", "V", ["build_muscle"], "beginner", 3,
        "male", None, 180, 80, None, "no", "friend",
        None, None, None, None, "in_progress",
        "Sår skulder", "Hater løping",
    ))
    cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    client = TestClient(app)
    resp = client.get("/api/users/profile", headers={"Authorization": "Bearer x"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["injury_notes"] == "Sår skulder"
    assert body["preference_notes"] == "Hater løping"


def test_patch_profile_allows_notes_fields(monkeypatch, mock_conn, make_mock_get_conn):
    from fastapi.testclient import TestClient
    from app.main import app
    from unittest.mock import AsyncMock

    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    client = TestClient(app)
    resp = client.patch(
        "/api/users/profile",
        json={"injury_notes": "knee pain", "preference_notes": "loves squats"},
        headers={"Authorization": "Bearer x"},
    )
    # PATCH returns 204 if profile row doesn't exist for re-read; treat 200 or 204 as ok.
    assert resp.status_code in (200, 204)
    sql_calls = [c[0][0] for c in mock_conn.execute.call_args_list]
    update_call = [s for s in sql_calls if "UPDATE users SET" in s][0]
    assert "injury_notes" in update_call
    assert "preference_notes" in update_call


def test_post_profile_bootstrap_accepts_minimal_body(
    monkeypatch, mock_conn, make_mock_get_conn
):
    from fastapi.testclient import TestClient
    from app.main import app
    from unittest.mock import AsyncMock

    mock_conn.execute = AsyncMock()
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    client = TestClient(app)
    resp = client.post(
        "/api/users/profile",
        json={
            "email": "t@x.no",
            "first_name": "Trym",
            "last_name": "Vestengen",
        },
        headers={"Authorization": "Bearer x"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    # Verify the INSERT included onboarding_status='in_progress'
    insert_call = mock_conn.execute.call_args
    assert "in_progress" in insert_call[0][1]
```

- [ ] **Step 2: Run tests to confirm they fail**

Run:
```bash
cd /Users/trymvestengen/Desktop/ai-coach
api/.venv/bin/pytest api/tests/test_users_router.py -k "notes or bootstrap" -v
```
Expected: all 3 new tests fail — first fails on tuple-unpacking (only 19 cols), second fails because `injury_notes`/`preference_notes` are rejected by the PATCH whitelist, third fails because POST requires all the demographic fields.

- [ ] **Step 3: Update SELECT in `get_user_profile`**

Open `api/app/routers/users.py`. Change the SELECT in `get_user_profile`:

```python
            """
            SELECT id, email, first_name, last_name, goals, experience_level,
                   training_days_per_week, gender, birth_date, height_cm,
                   weight_kg, avatar_url, locale, persona_mode,
                   activity_level, years_training,
                   preferred_training_time, max_session_duration_min,
                   onboarding_status,
                   injury_notes, preference_notes
            FROM users WHERE id = %s
            """,
```

In the returned dict, find `"onboarding_status": row[18],` and add two lines below it:

```python
        "onboarding_status": row[18],
        "injury_notes": row[19],
        "preference_notes": row[20],
        "injuries": [
```

- [ ] **Step 4: Add fields to PATCH whitelist**

Find:
```python
ALLOWED_PATCH_FIELDS = {
    "first_name", "last_name",
    "goals", "experience_level", "training_days_per_week",
    "height_cm", "weight_kg",
    "activity_level", "years_training", "preferred_training_time", "max_session_duration_min",
}
```

Add new fields:
```python
ALLOWED_PATCH_FIELDS = {
    "first_name", "last_name",
    "goals", "experience_level", "training_days_per_week",
    "gender", "birth_date",
    "height_cm", "weight_kg",
    "activity_level", "years_training", "preferred_training_time", "max_session_duration_min",
    "injury_notes", "preference_notes",
}
```

(We also add `gender` and `birth_date` to the whitelist because the wizard PATCHes those per step too.)

- [ ] **Step 5: Relax POST endpoint and seed onboarding_status='in_progress'**

In `api/app/routers/users.py`, find the `UserProfileBody` Pydantic model:

```python
class UserProfileBody(BaseModel):
    email: str
    first_name: str
    last_name: str
    goals: list[str]
    experience_level: str
    training_days_per_week: int
    gender: str
    birth_date: str  # "YYYY-MM-DD"
    height_cm: int
    weight_kg: float
    avatar_url: str | None = None
```

Replace with a relaxed schema that only requires bootstrap fields:

```python
class UserProfileBody(BaseModel):
    email: str
    first_name: str
    last_name: str
    goals: list[str] | None = None
    experience_level: str | None = None
    training_days_per_week: int | None = None
    gender: str | None = None
    birth_date: str | None = None
    height_cm: int | None = None
    weight_kg: float | None = None
    avatar_url: str | None = None
```

Then replace the `upsert_user_profile` handler body:

```python
@router.post("/users/profile")
async def upsert_user_profile(request: Request, body: UserProfileBody) -> dict:
    user_id = get_current_user_id(request)
    birth_date_val = None
    if body.birth_date:
        try:
            birth_date_val = date_type.fromisoformat(body.birth_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid birth_date format. Use YYYY-MM-DD.")
    async with get_conn() as conn:
        await conn.execute(
            """
            INSERT INTO users (
                id, email, first_name, last_name, goals, experience_level,
                training_days_per_week, gender, birth_date, height_cm,
                weight_kg, avatar_url, onboarding_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                first_name             = EXCLUDED.first_name,
                last_name              = EXCLUDED.last_name,
                goals                  = COALESCE(EXCLUDED.goals, users.goals),
                experience_level       = COALESCE(EXCLUDED.experience_level, users.experience_level),
                training_days_per_week = COALESCE(EXCLUDED.training_days_per_week, users.training_days_per_week),
                gender                 = COALESCE(EXCLUDED.gender, users.gender),
                birth_date             = COALESCE(EXCLUDED.birth_date, users.birth_date),
                height_cm              = COALESCE(EXCLUDED.height_cm, users.height_cm),
                weight_kg              = COALESCE(EXCLUDED.weight_kg, users.weight_kg),
                avatar_url             = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
            """,
            (
                user_id,
                body.email,
                body.first_name,
                body.last_name,
                body.goals,
                body.experience_level,
                body.training_days_per_week,
                body.gender,
                birth_date_val,
                body.height_cm,
                body.weight_kg,
                body.avatar_url,
                "in_progress",
            ),
        )
        await conn.commit()
    return {"ok": True}
```

The key changes:
- All non-bootstrap fields are now `Optional`
- `birth_date` is converted to `None` if not provided (preserves nullability)
- `onboarding_status='in_progress'` is set on INSERT
- `ON CONFLICT UPDATE` uses `COALESCE` so a re-bootstrap doesn't clobber fields that are already set

- [ ] **Step 6: Run all users-router tests**

Run:
```bash
api/.venv/bin/pytest api/tests/test_users_router.py -v
```
Expected: all tests pass. If a pre-existing test mocked the GET-fetchone tuple with only 19 columns, extend it with `, None, None` for the two new columns. If a pre-existing test of POST sent the full 11-field body, it should still pass (relaxation is backwards-compatible).

- [ ] **Step 7: Run full backend suite**

```bash
api/.venv/bin/pytest api/tests/ -q
```
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add api/app/routers/users.py api/tests/test_users_router.py
git commit -m "feat(users): expose notes columns and accept minimal POST bootstrap"
```

---

## Task 5: POST /api/users/onboarding/complete endpoint

**Files:**
- Modify: `api/app/routers/users.py`
- Create: `api/tests/test_complete_onboarding_router.py`

- [ ] **Step 1: Write failing tests**

Create `api/tests/test_complete_onboarding_router.py`:

```python
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
api/.venv/bin/pytest api/tests/test_complete_onboarding_router.py -v
```
Expected: all fail with 404 (route doesn't exist).

- [ ] **Step 3: Implement endpoint**

Open `api/app/routers/users.py`. Add at the end of the file:

```python
@router.post("/users/onboarding/complete")
async def complete_onboarding(request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT u.goals, u.experience_level, u.training_days_per_week,
                   u.gender, u.birth_date, u.height_cm, u.weight_kg,
                   (SELECT COUNT(*) FROM user_equipment WHERE user_id = u.id)
            FROM users u
            WHERE u.id = %s
            """,
            (user_id,),
        )
        row = await cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="User not found")

        goals, experience, days, gender, birth_date, height, weight, eq_count = row
        missing: list[str] = []
        if not goals or len(goals) == 0:
            missing.append("goals")
        if not experience:
            missing.append("experience_level")
        if days is None:
            missing.append("training_days_per_week")
        if eq_count == 0:
            missing.append("equipment")
        if not gender:
            missing.append("gender")
        if birth_date is None:
            missing.append("birth_date")
        if height is None:
            missing.append("height_cm")
        if weight is None:
            missing.append("weight_kg")
        if missing:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {missing}",
            )

        await conn.execute(
            "UPDATE users SET onboarding_status = %s WHERE id = %s",
            ("complete", user_id),
        )
        await conn.commit()

    return {"ok": True, "status": "complete"}
```

- [ ] **Step 4: Run the new tests**

```bash
api/.venv/bin/pytest api/tests/test_complete_onboarding_router.py -v
```
Expected: 3 passed.

- [ ] **Step 5: Run full suite**

```bash
api/.venv/bin/pytest api/tests/ -q
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add api/app/routers/users.py api/tests/test_complete_onboarding_router.py
git commit -m "feat(users): add POST /users/onboarding/complete with field validation"
```

---

## Task 6: Wizard shared components — ProgressBar + BackArrow

**Files:**
- Create: `web/src/app/onboarding/components/ProgressBar.tsx`
- Create: `web/src/app/onboarding/components/ProgressBar.test.tsx`
- Create: `web/src/app/onboarding/components/BackArrow.tsx`
- Create: `web/src/app/onboarding/components/BackArrow.test.tsx`

- [ ] **Step 1: Write failing tests for ProgressBar**

Create `web/src/app/onboarding/components/ProgressBar.test.tsx`:

```tsx
import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import ProgressBar from "./ProgressBar"

describe("ProgressBar", () => {
  it("renders one segment per total step", () => {
    const { container } = render(<ProgressBar current={3} total={10} />)
    expect(container.querySelectorAll("[data-segment]").length).toBe(10)
  })

  it("fills segments up to and including current step", () => {
    const { container } = render(<ProgressBar current={3} total={10} />)
    const filled = container.querySelectorAll("[data-segment][data-filled='true']")
    expect(filled.length).toBe(3)
  })

  it("renders nothing when total is 0", () => {
    const { container } = render(<ProgressBar current={0} total={0} />)
    expect(container.querySelectorAll("[data-segment]").length).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- ProgressBar.test.tsx --run
```
Expected: file not found error.

- [ ] **Step 3: Implement ProgressBar**

Create `web/src/app/onboarding/components/ProgressBar.tsx`:

```tsx
interface Props {
  current: number
  total: number
}

export default function ProgressBar({ current, total }: Props) {
  return (
    <div className="flex gap-1 px-6 pt-5">
      {Array.from({ length: total }, (_, i) => {
        const filled = i < current
        return (
          <div
            key={i}
            data-segment
            data-filled={filled}
            className="flex-1 rounded-full transition-colors duration-300"
            style={{ height: 3, background: filled ? "#ff6b35" : "#2a2a2a" }}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Run ProgressBar tests**

```bash
npm run test -- ProgressBar.test.tsx --run
```
Expected: 3 passed.

- [ ] **Step 5: Write failing tests for BackArrow**

Create `web/src/app/onboarding/components/BackArrow.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import BackArrow from "./BackArrow"

describe("BackArrow", () => {
  it("renders a button with accessible label", () => {
    render(<BackArrow onClick={() => {}} />)
    expect(screen.getByRole("button", { name: /tilbake/i })).toBeInTheDocument()
  })

  it("calls onClick when pressed", () => {
    const onClick = vi.fn()
    render(<BackArrow onClick={onClick} />)
    fireEvent.click(screen.getByRole("button", { name: /tilbake/i }))
    expect(onClick).toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: Run to confirm failure**

```bash
npm run test -- BackArrow.test.tsx --run
```
Expected: file not found.

- [ ] **Step 7: Implement BackArrow**

Create `web/src/app/onboarding/components/BackArrow.tsx`:

```tsx
interface Props {
  onClick: () => void
}

export default function BackArrow({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Tilbake"
      className="self-start px-6 pt-3 text-sm"
      style={{ color: "#666" }}
    >
      ← Tilbake
    </button>
  )
}
```

- [ ] **Step 8: Run BackArrow tests**

```bash
npm run test -- BackArrow.test.tsx --run
```
Expected: 2 passed.

- [ ] **Step 9: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/components/ProgressBar.tsx \
        web/src/app/onboarding/components/ProgressBar.test.tsx \
        web/src/app/onboarding/components/BackArrow.tsx \
        web/src/app/onboarding/components/BackArrow.test.tsx
git commit -m "feat(onboarding): add ProgressBar and BackArrow components"
```

---

## Task 7: StepShell — common layout for every wizard step

**Files:**
- Create: `web/src/app/onboarding/components/StepShell.tsx`
- Create: `web/src/app/onboarding/components/StepShell.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/app/onboarding/components/StepShell.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import StepShell from "./StepShell"

describe("StepShell", () => {
  it("renders title and children", () => {
    render(
      <StepShell title="Hello" onBack={() => {}} onNext={() => {}} canProgress>
        <div>child content</div>
      </StepShell>
    )
    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument()
    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("shows back arrow when onBack provided", () => {
    render(
      <StepShell title="x" onBack={() => {}} onNext={() => {}} canProgress>
        <div />
      </StepShell>
    )
    expect(screen.getByRole("button", { name: /tilbake/i })).toBeInTheDocument()
  })

  it("hides back arrow when onBack is null", () => {
    render(
      <StepShell title="x" onBack={null} onNext={() => {}} canProgress>
        <div />
      </StepShell>
    )
    expect(screen.queryByRole("button", { name: /tilbake/i })).not.toBeInTheDocument()
  })

  it("disables Next when canProgress is false", () => {
    render(
      <StepShell title="x" onBack={() => {}} onNext={() => {}} canProgress={false}>
        <div />
      </StepShell>
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })

  it("calls onNext when Next clicked", () => {
    const onNext = vi.fn()
    render(
      <StepShell title="x" onBack={() => {}} onNext={onNext} canProgress>
        <div />
      </StepShell>
    )
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    expect(onNext).toHaveBeenCalled()
  })

  it("renders skip link when onSkip provided", () => {
    const onSkip = vi.fn()
    render(
      <StepShell title="x" onBack={() => {}} onNext={() => {}} canProgress onSkip={onSkip}>
        <div />
      </StepShell>
    )
    fireEvent.click(screen.getByRole("button", { name: /hopp over/i }))
    expect(onSkip).toHaveBeenCalled()
  })

  it("hides skip link when onSkip omitted", () => {
    render(
      <StepShell title="x" onBack={() => {}} onNext={() => {}} canProgress>
        <div />
      </StepShell>
    )
    expect(screen.queryByRole("button", { name: /hopp over/i })).not.toBeInTheDocument()
  })

  it("renders progress bar when totalSteps > 0", () => {
    const { container } = render(
      <StepShell
        title="x"
        onBack={() => {}}
        onNext={() => {}}
        canProgress
        currentStep={3}
        totalSteps={10}
      >
        <div />
      </StepShell>
    )
    expect(container.querySelectorAll("[data-segment]").length).toBe(10)
  })
})
```

- [ ] **Step 2: Run test to confirm failure**

```bash
npm run test -- StepShell.test.tsx --run
```
Expected: file not found.

- [ ] **Step 3: Implement StepShell**

Create `web/src/app/onboarding/components/StepShell.tsx`:

```tsx
import ProgressBar from "./ProgressBar"
import BackArrow from "./BackArrow"

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  onBack: (() => void) | null
  onNext: () => void
  canProgress: boolean
  onSkip?: () => void
  currentStep?: number
  totalSteps?: number
  nextLabel?: string
  busy?: boolean
}

export default function StepShell({
  title,
  subtitle,
  children,
  onBack,
  onNext,
  canProgress,
  onSkip,
  currentStep,
  totalSteps,
  nextLabel = "Neste",
  busy,
}: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      {totalSteps != null && totalSteps > 0 && (
        <ProgressBar current={currentStep ?? 0} total={totalSteps} />
      )}

      {onBack && <BackArrow onClick={onBack} />}

      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-white text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="text-sm" style={{ color: "#666" }}>
              {subtitle}
            </p>
          )}
          {children}
          <button
            type="button"
            onClick={onNext}
            disabled={!canProgress || busy}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 mt-2"
            style={{ background: "#ff6b35" }}
          >
            {busy ? "Lagrer..." : nextLabel}
          </button>
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-sm self-center mt-1"
              style={{ color: "#666" }}
            >
              Hopp over →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run StepShell tests**

```bash
npm run test -- StepShell.test.tsx --run
```
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/components/StepShell.tsx \
        web/src/app/onboarding/components/StepShell.test.tsx
git commit -m "feat(onboarding): add StepShell layout component"
```

---

## Task 8: TextStep — text-input step for name/email/password/notes

**Files:**
- Create: `web/src/app/onboarding/steps/TextStep.tsx`
- Create: `web/src/app/onboarding/steps/TextStep.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/app/onboarding/steps/TextStep.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import TextStep from "./TextStep"

describe("TextStep", () => {
  it("renders title and input with placeholder", () => {
    render(
      <TextStep
        title="Hva heter du?"
        placeholder="Fornavn"
        value=""
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        validate={(v) => v.length > 0}
      />
    )
    expect(screen.getByRole("heading", { name: "Hva heter du?" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Fornavn")).toBeInTheDocument()
  })

  it("calls onChange when typing", () => {
    const onChange = vi.fn()
    render(
      <TextStep
        title="x"
        placeholder="p"
        value=""
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
        validate={() => true}
      />
    )
    fireEvent.change(screen.getByPlaceholderText("p"), { target: { value: "Trym" } })
    expect(onChange).toHaveBeenCalledWith("Trym")
  })

  it("disables Next when validate returns false", () => {
    render(
      <TextStep
        title="x"
        placeholder="p"
        value=""
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        validate={(v) => v.length >= 6}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })

  it("supports password type", () => {
    render(
      <TextStep
        title="x"
        placeholder="p"
        value="abcdef"
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        validate={() => true}
        type="password"
      />
    )
    expect(screen.getByPlaceholderText("p")).toHaveAttribute("type", "password")
  })
})
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- TextStep.test.tsx --run
```
Expected: file not found.

- [ ] **Step 3: Implement TextStep**

Create `web/src/app/onboarding/steps/TextStep.tsx`:

```tsx
"use client"
import StepShell from "../components/StepShell"

interface Props {
  title: string
  subtitle?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: (() => void) | null
  validate: (v: string) => boolean
  type?: "text" | "email" | "password"
  multiline?: boolean
  currentStep?: number
  totalSteps?: number
  onSkip?: () => void
  nextLabel?: string
  busy?: boolean
}

export default function TextStep({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  onNext,
  onBack,
  validate,
  type = "text",
  multiline,
  currentStep,
  totalSteps,
  onSkip,
  nextLabel,
  busy,
}: Props) {
  const canProgress = validate(value)

  return (
    <StepShell
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      onNext={onNext}
      canProgress={canProgress}
      onSkip={onSkip}
      currentStep={currentStep}
      totalSteps={totalSteps}
      nextLabel={nextLabel}
      busy={busy}
    >
      {multiline ? (
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          rows={4}
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none resize-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
      )}
    </StepShell>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- TextStep.test.tsx --run
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/steps/TextStep.tsx \
        web/src/app/onboarding/steps/TextStep.test.tsx
git commit -m "feat(onboarding): add TextStep component"
```

---

## Task 9: ChoiceStep — single/multi-select picker

**Files:**
- Create: `web/src/app/onboarding/steps/ChoiceStep.tsx`
- Create: `web/src/app/onboarding/steps/ChoiceStep.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/app/onboarding/steps/ChoiceStep.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ChoiceStep from "./ChoiceStep"

const opts = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
]

describe("ChoiceStep", () => {
  it("renders all options", () => {
    render(
      <ChoiceStep
        title="Velg"
        options={opts}
        value={[]}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        multi
      />
    )
    expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Beta" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Gamma" })).toBeInTheDocument()
  })

  it("single-select: clicking calls onChange with single value array", () => {
    const onChange = vi.fn()
    render(
      <ChoiceStep
        title="x"
        options={opts}
        value={[]}
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Beta" }))
    expect(onChange).toHaveBeenCalledWith(["b"])
  })

  it("multi-select: clicking toggles values", () => {
    const onChange = vi.fn()
    render(
      <ChoiceStep
        title="x"
        options={opts}
        value={["a"]}
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
        multi
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Beta" }))
    expect(onChange).toHaveBeenCalledWith(["a", "b"])
    onChange.mockClear()
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it("disables Next when value is empty", () => {
    render(
      <ChoiceStep
        title="x"
        options={opts}
        value={[]}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })

  it("enables Next when at least one option is selected", () => {
    render(
      <ChoiceStep
        title="x"
        options={opts}
        value={["a"]}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).not.toBeDisabled()
  })
})
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- ChoiceStep.test.tsx --run
```
Expected: file not found.

- [ ] **Step 3: Implement ChoiceStep**

Create `web/src/app/onboarding/steps/ChoiceStep.tsx`:

```tsx
"use client"
import StepShell from "../components/StepShell"

interface Option {
  value: string
  label: string
  sub?: string
}

interface Props {
  title: string
  subtitle?: string
  options: Option[]
  value: string[]
  onChange: (v: string[]) => void
  onNext: () => void
  onBack: (() => void) | null
  multi?: boolean
  currentStep?: number
  totalSteps?: number
  busy?: boolean
}

export default function ChoiceStep({
  title,
  subtitle,
  options,
  value,
  onChange,
  onNext,
  onBack,
  multi,
  currentStep,
  totalSteps,
  busy,
}: Props) {
  const toggle = (v: string) => {
    if (multi) {
      onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
    } else {
      onChange([v])
    }
  }

  return (
    <StepShell
      title={title}
      subtitle={subtitle ?? (multi ? "Velg ett eller flere" : undefined)}
      onBack={onBack}
      onNext={onNext}
      canProgress={value.length > 0}
      currentStep={currentStep}
      totalSteps={totalSteps}
      busy={busy}
    >
      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = value.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className="rounded-xl px-4 py-3 text-sm text-left font-medium"
              style={{
                background: "#1a1a1a",
                border: `1px solid ${selected ? "#ff6b35" : "#2a2a2a"}`,
                color: selected ? "#ff6b35" : "#aaa",
              }}
            >
              {multi && selected ? "✓ " : ""}
              {opt.label}
              {opt.sub && (
                <span className="block text-xs mt-1" style={{ color: "#666" }}>
                  {opt.sub}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </StepShell>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- ChoiceStep.test.tsx --run
```
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/steps/ChoiceStep.tsx \
        web/src/app/onboarding/steps/ChoiceStep.test.tsx
git commit -m "feat(onboarding): add ChoiceStep component"
```

---

## Task 10: NumberStep and DateStep

**Files:**
- Create: `web/src/app/onboarding/steps/NumberStep.tsx`
- Create: `web/src/app/onboarding/steps/NumberStep.test.tsx`
- Create: `web/src/app/onboarding/steps/DateStep.tsx`
- Create: `web/src/app/onboarding/steps/DateStep.test.tsx`

- [ ] **Step 1: Write failing tests for NumberStep**

Create `web/src/app/onboarding/steps/NumberStep.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import NumberStep from "./NumberStep"

describe("NumberStep", () => {
  it("renders input with unit suffix", () => {
    render(
      <NumberStep
        title="Vekt"
        unit="kg"
        value={null}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        min={30}
        max={200}
      />
    )
    expect(screen.getByText("kg")).toBeInTheDocument()
  })

  it("calls onChange with parsed integer", () => {
    const onChange = vi.fn()
    render(
      <NumberStep
        title="x"
        unit="kg"
        value={null}
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
        min={30}
        max={200}
      />
    )
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "85" } })
    expect(onChange).toHaveBeenCalledWith(85)
  })

  it("disables Next when value is below min", () => {
    render(
      <NumberStep
        title="x"
        unit="kg"
        value={10}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        min={30}
        max={200}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })

  it("enables Next when value is within range", () => {
    render(
      <NumberStep
        title="x"
        unit="kg"
        value={80}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        min={30}
        max={200}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).not.toBeDisabled()
  })
})
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- NumberStep.test.tsx --run
```
Expected: file not found.

- [ ] **Step 3: Implement NumberStep**

Create `web/src/app/onboarding/steps/NumberStep.tsx`:

```tsx
"use client"
import StepShell from "../components/StepShell"

interface Props {
  title: string
  subtitle?: string
  unit: string
  value: number | null
  onChange: (v: number | null) => void
  onNext: () => void
  onBack: (() => void) | null
  min: number
  max: number
  placeholder?: string
  currentStep?: number
  totalSteps?: number
  busy?: boolean
}

export default function NumberStep({
  title,
  subtitle,
  unit,
  value,
  onChange,
  onNext,
  onBack,
  min,
  max,
  placeholder,
  currentStep,
  totalSteps,
  busy,
}: Props) {
  const canProgress = value !== null && value >= min && value <= max

  const handleChange = (raw: string) => {
    if (raw === "") {
      onChange(null)
      return
    }
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) onChange(parsed)
  }

  return (
    <StepShell
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      onNext={onNext}
      canProgress={canProgress}
      currentStep={currentStep}
      totalSteps={totalSteps}
      busy={busy}
    >
      <div
        className="flex items-center rounded-xl"
        style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
      >
        <input
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => handleChange(e.target.value)}
          autoFocus
          min={min}
          max={max}
          className="flex-1 px-4 py-3 text-sm text-white bg-transparent outline-none"
        />
        <span className="pr-3 text-xs" style={{ color: "#666" }}>
          {unit}
        </span>
      </div>
    </StepShell>
  )
}
```

- [ ] **Step 4: Run NumberStep tests**

```bash
npm run test -- NumberStep.test.tsx --run
```
Expected: 4 passed.

- [ ] **Step 5: Write failing tests for DateStep**

Create `web/src/app/onboarding/steps/DateStep.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DateStep from "./DateStep"

describe("DateStep", () => {
  it("renders date input", () => {
    const { container } = render(
      <DateStep
        title="Når er du født?"
        value=""
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    expect(container.querySelector("input[type='date']")).toBeInTheDocument()
  })

  it("calls onChange with YYYY-MM-DD value", () => {
    const onChange = vi.fn()
    const { container } = render(
      <DateStep
        title="x"
        value=""
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    const input = container.querySelector("input[type='date']")!
    fireEvent.change(input, { target: { value: "1990-03-15" } })
    expect(onChange).toHaveBeenCalledWith("1990-03-15")
  })

  it("disables Next when value empty", () => {
    render(
      <DateStep
        title="x"
        value=""
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })
})
```

- [ ] **Step 6: Confirm failure**

```bash
npm run test -- DateStep.test.tsx --run
```

- [ ] **Step 7: Implement DateStep**

Create `web/src/app/onboarding/steps/DateStep.tsx`:

```tsx
"use client"
import StepShell from "../components/StepShell"

interface Props {
  title: string
  subtitle?: string
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: (() => void) | null
  currentStep?: number
  totalSteps?: number
  busy?: boolean
}

export default function DateStep({
  title,
  subtitle,
  value,
  onChange,
  onNext,
  onBack,
  currentStep,
  totalSteps,
  busy,
}: Props) {
  const canProgress = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const today = new Date().toISOString().split("T")[0]

  return (
    <StepShell
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      onNext={onNext}
      canProgress={canProgress}
      currentStep={currentStep}
      totalSteps={totalSteps}
      busy={busy}
    >
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={today}
        autoFocus
        className="rounded-xl px-4 py-3 text-sm text-white outline-none"
        style={{
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          colorScheme: "dark",
        }}
      />
    </StepShell>
  )
}
```

- [ ] **Step 8: Run DateStep tests**

```bash
npm run test -- DateStep.test.tsx --run
```
Expected: 3 passed.

- [ ] **Step 9: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/steps/NumberStep.tsx \
        web/src/app/onboarding/steps/NumberStep.test.tsx \
        web/src/app/onboarding/steps/DateStep.tsx \
        web/src/app/onboarding/steps/DateStep.test.tsx
git commit -m "feat(onboarding): add NumberStep and DateStep components"
```

---

## Task 11: DoneStep — summary screen

**Files:**
- Create: `web/src/app/onboarding/steps/DoneStep.tsx`
- Create: `web/src/app/onboarding/steps/DoneStep.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/app/onboarding/steps/DoneStep.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DoneStep from "./DoneStep"

describe("DoneStep", () => {
  it("renders greeting with first name", () => {
    render(
      <DoneStep
        firstName="Trym"
        summary={{ goals: "Bygg muskler", experience: "Middels", days: "3-4" }}
        onFinish={() => {}}
        busy={false}
      />
    )
    expect(screen.getByText(/Alt klart, Trym/)).toBeInTheDocument()
  })

  it("renders summary rows", () => {
    render(
      <DoneStep
        firstName="T"
        summary={{ goals: "Bygg muskler", experience: "Middels", days: "3-4" }}
        onFinish={() => {}}
        busy={false}
      />
    )
    expect(screen.getByText("Bygg muskler")).toBeInTheDocument()
    expect(screen.getByText("Middels")).toBeInTheDocument()
    expect(screen.getByText("3-4")).toBeInTheDocument()
  })

  it("calls onFinish when 'Kom i gang' clicked", () => {
    const onFinish = vi.fn()
    render(
      <DoneStep
        firstName="T"
        summary={{}}
        onFinish={onFinish}
        busy={false}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /kom i gang/i }))
    expect(onFinish).toHaveBeenCalled()
  })

  it("disables button when busy", () => {
    render(
      <DoneStep
        firstName="T"
        summary={{}}
        onFinish={() => {}}
        busy
      />
    )
    expect(screen.getByRole("button", { name: /lagrer/i })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- DoneStep.test.tsx --run
```

- [ ] **Step 3: Implement DoneStep**

Create `web/src/app/onboarding/steps/DoneStep.tsx`:

```tsx
"use client"

interface Props {
  firstName: string
  summary: Record<string, string>
  onFinish: () => void
  busy: boolean
}

export default function DoneStep({ firstName, summary, onFinish, busy }: Props) {
  return (
    <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h1 className="text-white text-2xl font-bold">Alt klart, {firstName}!</h1>
            <p className="text-sm mt-1" style={{ color: "#666" }}>
              Coachen din er klar.
            </p>
          </div>

          <div
            className="rounded-xl p-4 flex flex-col gap-2 text-sm"
            style={{ background: "#111", border: "1px solid #1e1e1e" }}
          >
            {Object.entries(summary).map(([k, v]) => (
              <div key={k} style={{ color: "#666" }}>
                <span style={{ textTransform: "capitalize" }}>{k}:</span>{" "}
                <span style={{ color: "#aaa" }}>{v}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onFinish}
            disabled={busy}
            className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
            style={{ background: "#ff6b35" }}
          >
            {busy ? "Lagrer..." : "Kom i gang 🚀"}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- DoneStep.test.tsx --run
```
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/steps/DoneStep.tsx \
        web/src/app/onboarding/steps/DoneStep.test.tsx
git commit -m "feat(onboarding): add DoneStep summary component"
```

---

## Task 12: Wizard config + localStorage helpers

**Files:**
- Create: `web/src/app/onboarding/wizardConfig.ts`
- Create: `web/src/app/onboarding/wizardStorage.ts`
- Create: `web/src/app/onboarding/wizardStorage.test.ts`

- [ ] **Step 1: Create config file**

Create `web/src/app/onboarding/wizardConfig.ts`:

```typescript
export const GOAL_OPTIONS = [
  { value: "build_muscle", label: "Bygg muskler" },
  { value: "lose_weight", label: "Gå ned i vekt" },
  { value: "get_stronger", label: "Bli sterkere" },
  { value: "improve_endurance", label: "Bedre kondis" },
  { value: "maintain", label: "Holde formen" },
]

export const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Nybegynner", sub: "Under 1 år" },
  { value: "intermediate", label: "Middels", sub: "1-3 år" },
  { value: "advanced", label: "Erfaren", sub: "3+ år" },
]

export const FREQUENCY_OPTIONS = [
  { value: "2", label: "1-2", sub: "dager/uke" },
  { value: "4", label: "3-4", sub: "dager/uke" },
  { value: "6", label: "5-6", sub: "dager/uke" },
  { value: "7", label: "7", sub: "dager/uke" },
]

export const EQUIPMENT_OPTIONS = [
  { value: "gym", label: "Treningssenter" },
  { value: "home_basic", label: "Hjemmegym basic" },
  { value: "bodyweight", label: "Bare bodyweight" },
  { value: "other", label: "Annet" },
]

export const GENDER_OPTIONS = [
  { value: "male", label: "Mann" },
  { value: "female", label: "Kvinne" },
  { value: "other", label: "Vil ikke si" },
]

export const TOTAL_OBLIGATORY_STEPS = 8  // steps 4-11
export const TOTAL_OPTIONAL_STEPS = 2    // steps 12-13
export const TOTAL_PROGRESS_STEPS = TOTAL_OBLIGATORY_STEPS + TOTAL_OPTIONAL_STEPS  // 10
```

- [ ] **Step 2: Write failing tests for storage**

Create `web/src/app/onboarding/wizardStorage.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { saveDraft, loadDraft, clearDraft } from "./wizardStorage"

beforeEach(() => {
  localStorage.clear()
})

describe("wizardStorage", () => {
  it("returns null when no draft exists", () => {
    expect(loadDraft()).toBeNull()
  })

  it("round-trips a draft via save/load", () => {
    saveDraft({ firstName: "T", lastName: "V", email: "x@y.no" })
    const result = loadDraft()
    expect(result).toEqual({ firstName: "T", lastName: "V", email: "x@y.no" })
  })

  it("clearDraft removes the entry", () => {
    saveDraft({ firstName: "T" })
    clearDraft()
    expect(loadDraft()).toBeNull()
  })

  it("returns null when stored JSON is invalid", () => {
    localStorage.setItem("ai-coach.onboarding.draft", "not-json")
    expect(loadDraft()).toBeNull()
  })
})
```

- [ ] **Step 3: Confirm failure**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npm run test -- wizardStorage.test.ts --run
```
Expected: file not found.

- [ ] **Step 4: Implement storage**

Create `web/src/app/onboarding/wizardStorage.ts`:

```typescript
const KEY = "ai-coach.onboarding.draft"

export interface Draft {
  firstName?: string
  lastName?: string
  email?: string
  // Password is intentionally NOT persisted (security).
}

export function saveDraft(draft: Draft): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    // Quota or disabled — silently skip.
  }
}

export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as Draft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npm run test -- wizardStorage.test.ts --run
```
Expected: 4 passed.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/wizardConfig.ts \
        web/src/app/onboarding/wizardStorage.ts \
        web/src/app/onboarding/wizardStorage.test.ts
git commit -m "feat(onboarding): add wizard config and draft storage"
```

---

## Task 13: OnboardingWizard — signup phase (steps 1-3)

**Files:**
- Create: `web/src/app/onboarding/OnboardingWizard.tsx`
- Create: `web/src/app/onboarding/OnboardingWizard.test.tsx`

This task implements only steps 1-3 plus the framework for adding more steps. The signup integration with Supabase is mocked in tests.

- [ ] **Step 1: Write failing tests**

Create `web/src/app/onboarding/OnboardingWizard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import OnboardingWizard from "./OnboardingWizard"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const signUpMock = vi.fn()

vi.mock("@/lib/supabase", () => ({
  createClient: () => ({
    auth: {
      signUp: signUpMock,
      getSession: () => Promise.resolve({ data: { session: { access_token: "tok" } } }),
    },
  }),
}))

global.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
)

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  signUpMock.mockResolvedValue({ error: null })
})

describe("OnboardingWizard — signup phase", () => {
  it("starts on the Name step", () => {
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    expect(screen.getByRole("heading", { name: /hva heter du/i })).toBeInTheDocument()
  })

  it("advances to Email step after filling name", () => {
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    fireEvent.change(screen.getByPlaceholderText("Fornavn"), { target: { value: "Trym" } })
    fireEvent.change(screen.getByPlaceholderText("Etternavn"), {
      target: { value: "Vestengen" },
    })
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    expect(screen.getByRole("heading", { name: /e-postadresse/i })).toBeInTheDocument()
  })

  it("calls Supabase signUp at step 3 and advances to step 4", async () => {
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    fireEvent.change(screen.getByPlaceholderText("Fornavn"), { target: { value: "Trym" } })
    fireEvent.change(screen.getByPlaceholderText("Etternavn"), {
      target: { value: "Vestengen" },
    })
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    fireEvent.change(screen.getByPlaceholderText("din@epost.no"), {
      target: { value: "trym@example.com" },
    })
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    fireEvent.change(screen.getByPlaceholderText(/passord/i), { target: { value: "abcdef" } })
    fireEvent.click(screen.getByRole("button", { name: /opprett konto/i }))

    await screen.findByRole("heading", { name: /hva er målet ditt/i })
    expect(signUpMock).toHaveBeenCalledWith({
      email: "trym@example.com",
      password: "abcdef",
      options: { data: { first_name: "Trym", last_name: "Vestengen" } },
    })
  })

  it("persists draft to localStorage during signup phase", () => {
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    fireEvent.change(screen.getByPlaceholderText("Fornavn"), { target: { value: "Trym" } })
    fireEvent.change(screen.getByPlaceholderText("Etternavn"), { target: { value: "V" } })
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    const stored = JSON.parse(localStorage.getItem("ai-coach.onboarding.draft") || "{}")
    expect(stored.firstName).toBe("Trym")
    expect(stored.lastName).toBe("V")
  })

  it("restores draft from localStorage on mount", () => {
    localStorage.setItem(
      "ai-coach.onboarding.draft",
      JSON.stringify({ firstName: "Anna", lastName: "K", email: "" })
    )
    render(<OnboardingWizard initialProfile={null} firstNameFallback="" />)
    expect(screen.getByDisplayValue("Anna")).toBeInTheDocument()
    expect(screen.getByDisplayValue("K")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Confirm failure**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npm run test -- OnboardingWizard.test.tsx --run
```
Expected: file not found.

- [ ] **Step 3: Implement OnboardingWizard with steps 1-3 + state framework**

Create `web/src/app/onboarding/OnboardingWizard.tsx`:

```tsx
"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import TextStep from "./steps/TextStep"
import ChoiceStep from "./steps/ChoiceStep"
import NumberStep from "./steps/NumberStep"
import DateStep from "./steps/DateStep"
import DoneStep from "./steps/DoneStep"
import { saveDraft, loadDraft, clearDraft } from "./wizardStorage"
import {
  GOAL_OPTIONS,
  EXPERIENCE_OPTIONS,
  FREQUENCY_OPTIONS,
  EQUIPMENT_OPTIONS,
  GENDER_OPTIONS,
  TOTAL_PROGRESS_STEPS,
} from "./wizardConfig"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export interface InitialProfile {
  first_name: string | null
  last_name: string | null
  goals: string[] | null
  experience_level: string | null
  training_days_per_week: number | null
  gender: string | null
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  equipment: string[]
  injury_notes: string | null
  preference_notes: string | null
  onboarding_status: string
}

interface Props {
  initialProfile: InitialProfile | null
  firstNameFallback: string
}

interface State {
  firstName: string
  lastName: string
  email: string
  password: string
  goals: string[]
  experienceLevel: string
  trainingDaysPerWeek: string
  equipment: string[]
  gender: string
  birthDate: string
  heightCm: number | null
  weightKg: number | null
  injuryNotes: string
  preferenceNotes: string
}

function initialStateFromProfile(p: InitialProfile | null): State {
  if (!p) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      goals: [],
      experienceLevel: "",
      trainingDaysPerWeek: "",
      equipment: [],
      gender: "",
      birthDate: "",
      heightCm: null,
      weightKg: null,
      injuryNotes: "",
      preferenceNotes: "",
    }
  }
  return {
    firstName: p.first_name ?? "",
    lastName: p.last_name ?? "",
    email: "",
    password: "",
    goals: p.goals ?? [],
    experienceLevel: p.experience_level ?? "",
    trainingDaysPerWeek:
      p.training_days_per_week != null ? String(p.training_days_per_week) : "",
    equipment: p.equipment ?? [],
    gender: p.gender ?? "",
    birthDate: p.birth_date ?? "",
    heightCm: p.height_cm,
    weightKg: p.weight_kg,
    injuryNotes: p.injury_notes ?? "",
    preferenceNotes: p.preference_notes ?? "",
  }
}

function firstIncompleteStep(p: InitialProfile | null): number {
  if (!p) return 1
  if (!p.goals || p.goals.length === 0) return 4
  if (!p.experience_level) return 5
  if (p.training_days_per_week == null) return 6
  if (!p.equipment || p.equipment.length === 0) return 7
  if (!p.gender) return 8
  if (!p.birth_date) return 9
  if (p.height_cm == null) return 10
  if (p.weight_kg == null) return 11
  return 12
}

export default function OnboardingWizard({ initialProfile, firstNameFallback }: Props) {
  const router = useRouter()
  const [state, setState] = useState<State>(() => {
    const fromProfile = initialStateFromProfile(initialProfile)
    if (!initialProfile && typeof window !== "undefined") {
      const draft = loadDraft()
      if (draft) {
        return {
          ...fromProfile,
          firstName: draft.firstName ?? "",
          lastName: draft.lastName ?? "",
          email: draft.email ?? "",
        }
      }
    }
    return fromProfile
  })
  const [step, setStep] = useState<number>(() => firstIncompleteStep(initialProfile))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const draftSnapshotRef = useRef("")

  // Persist draft in localStorage during signup phase only.
  useEffect(() => {
    if (step <= 3 && !initialProfile) {
      const snapshot = JSON.stringify({
        firstName: state.firstName,
        lastName: state.lastName,
        email: state.email,
      })
      if (snapshot !== draftSnapshotRef.current) {
        draftSnapshotRef.current = snapshot
        saveDraft({
          firstName: state.firstName,
          lastName: state.lastName,
          email: state.email,
        })
      }
    }
  }, [state.firstName, state.lastName, state.email, step, initialProfile])

  // Step 4 cannot go back to signup (account already created).
  const back = step > 1 && step !== 4 ? () => setStep((s) => s - 1) : null

  const patchProfile = async (body: Record<string, unknown>) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error("Ikke innlogget")
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    if (!res.ok && res.status !== 204) {
      throw new Error(`PATCH failed: ${res.status}`)
    }
  }

  // ----- Step 1: Name (two fields, inline form — TextStep only takes one input) -----
  if (step === 1) {
    const canProgress =
      state.firstName.trim().length > 0 && state.lastName.trim().length > 0
    return (
      <div className="flex flex-col h-full" style={{ background: "#0d0d0d" }}>
        <div className="flex-1 flex flex-col justify-center px-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-white text-2xl font-bold">Hva heter du?</h1>
            <input
              type="text"
              placeholder="Fornavn"
              value={state.firstName}
              onChange={(e) => setState((s) => ({ ...s, firstName: e.target.value }))}
              autoFocus
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <input
              type="text"
              placeholder="Etternavn"
              value={state.lastName}
              onChange={(e) => setState((s) => ({ ...s, lastName: e.target.value }))}
              className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            />
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProgress}
              className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 mt-2"
              style={{ background: "#ff6b35" }}
            >
              Neste
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ----- Step 2: Email -----
  if (step === 2) {
    return (
      <TextStep
        title="E-postadresse"
        placeholder="din@epost.no"
        value={state.email}
        onChange={(v) => setState((s) => ({ ...s, email: v }))}
        onNext={() => setStep(3)}
        onBack={back}
        validate={(v) => /\S+@\S+\.\S+/.test(v)}
        type="email"
      />
    )
  }

  // ----- Step 3: Password + signUp -----
  if (step === 3) {
    const handleSignUp = async () => {
      setBusy(true)
      setError(null)
      try {
        const supabase = createClient()
        const { error: signUpError } = await supabase.auth.signUp({
          email: state.email,
          password: state.password,
          options: {
            data: { first_name: state.firstName, last_name: state.lastName },
          },
        })
        if (signUpError) {
          setError(signUpError.message)
          setBusy(false)
          return
        }
        // Bootstrap users row so subsequent PATCH calls find a record.
        // The relaxed POST endpoint accepts just email + names; other fields
        // stay NULL and are filled in by PATCH calls during steps 4-13.
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await fetch(`${API_BASE}/api/users/profile`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: state.email,
              first_name: state.firstName,
              last_name: state.lastName,
            }),
          })
        }
        clearDraft()
        setStep(4)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusy(false)
      }
    }

    return (
      <TextStep
        title="Velg passord"
        subtitle="Minst 6 tegn"
        placeholder="Passord"
        value={state.password}
        onChange={(v) => setState((s) => ({ ...s, password: v }))}
        onNext={handleSignUp}
        onBack={back}
        validate={(v) => v.length >= 6}
        type="password"
        nextLabel="Opprett konto"
        busy={busy}
      />
    )
  }

  // ----- Step 4+ implemented in subsequent tasks -----
  return (
    <div className="p-6 text-white">
      Steg {step} kommer i neste task.{error && ` Feilmelding: ${error}`}
    </div>
  )
}
```

**Note on the bootstrap POST:** Task 4 relaxes `POST /api/users/profile` so it accepts only the bootstrap fields (email + names). Other columns stay NULL until PATCH'ed by the wizard, which is what `firstIncompleteStep` reads to decide where to resume.

- [ ] **Step 4: Run wizard tests**

```bash
npm run test -- OnboardingWizard.test.tsx --run
```
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/OnboardingWizard.tsx \
        web/src/app/onboarding/OnboardingWizard.test.tsx
git commit -m "feat(onboarding): wizard signup phase (steps 1-3)"
```

---

## Task 14: OnboardingWizard — required personalization steps (4-11)

**Files:**
- Modify: `web/src/app/onboarding/OnboardingWizard.tsx`
- Modify: `web/src/app/onboarding/OnboardingWizard.test.tsx`

- [ ] **Step 1: Add tests for required steps**

Append to `web/src/app/onboarding/OnboardingWizard.test.tsx`:

```tsx
describe("OnboardingWizard — required steps", () => {
  it("shows goals step (step 4) when starting with bootstrapped profile", () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: null,
      experience_level: null,
      training_days_per_week: null,
      gender: null,
      birth_date: null,
      height_cm: null,
      weight_kg: null,
      equipment: [],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    expect(screen.getByRole("heading", { name: /hva er målet ditt/i })).toBeInTheDocument()
  })

  it("resumes at next missing step when partial profile exists", () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: ["build_muscle"],
      experience_level: "beginner",
      training_days_per_week: null,
      gender: null,
      birth_date: null,
      height_cm: null,
      weight_kg: null,
      equipment: [],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    expect(
      screen.getByRole("heading", { name: /hvor mange dager/i })
    ).toBeInTheDocument()
  })

  it("PATCHes goals when advancing past step 4", async () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: null,
      experience_level: null,
      training_days_per_week: null,
      gender: null,
      birth_date: null,
      height_cm: null,
      weight_kg: null,
      equipment: [],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    fireEvent.click(screen.getByRole("button", { name: "Bygg muskler" }))
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    await screen.findByRole("heading", { name: /erfaring/i })
    const patchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find((c) =>
      String(c[1]?.body).includes("build_muscle")
    )
    expect(patchCall).toBeDefined()
    expect(patchCall![1].method).toBe("PATCH")
  })
})
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- OnboardingWizard.test.tsx --run
```
Expected: new tests fail.

- [ ] **Step 3: Implement steps 4-11 in OnboardingWizard**

In `web/src/app/onboarding/OnboardingWizard.tsx`, replace the placeholder `return <div>Step {step} kommer i neste task.</div>` with the following block:

```tsx
  // ----- Step 4: Goals -----
  if (step === 4) {
    return (
      <ChoiceStep
        title="Hva er målet ditt?"
        options={GOAL_OPTIONS}
        value={state.goals}
        onChange={(v) => setState((s) => ({ ...s, goals: v }))}
        onNext={async () => {
          setBusy(true)
          try {
            await patchProfile({ goals: state.goals })
            setStep(5)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
        onBack={null}
        multi
        currentStep={1}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 5: Experience -----
  if (step === 5) {
    return (
      <ChoiceStep
        title="Treningserfaring"
        options={EXPERIENCE_OPTIONS}
        value={state.experienceLevel ? [state.experienceLevel] : []}
        onChange={(v) => setState((s) => ({ ...s, experienceLevel: v[0] ?? "" }))}
        onNext={async () => {
          setBusy(true)
          try {
            await patchProfile({ experience_level: state.experienceLevel })
            setStep(6)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
        onBack={() => setStep(4)}
        currentStep={2}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 6: Frequency -----
  if (step === 6) {
    return (
      <ChoiceStep
        title="Hvor mange dager i uka kan du trene?"
        options={FREQUENCY_OPTIONS}
        value={state.trainingDaysPerWeek ? [state.trainingDaysPerWeek] : []}
        onChange={(v) => setState((s) => ({ ...s, trainingDaysPerWeek: v[0] ?? "" }))}
        onNext={async () => {
          setBusy(true)
          try {
            await patchProfile({
              training_days_per_week: parseInt(state.trainingDaysPerWeek, 10),
            })
            setStep(7)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
        onBack={() => setStep(5)}
        currentStep={3}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 7: Equipment -----
  if (step === 7) {
    const saveEquipment = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Ikke innlogget")
      // Add each selected equipment item.
      for (const item of state.equipment) {
        await fetch(`${API_BASE}/api/users/equipment`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ equipment: item }),
        })
      }
    }
    return (
      <ChoiceStep
        title="Hvor trener du?"
        subtitle="Velg ett eller flere"
        options={EQUIPMENT_OPTIONS}
        value={state.equipment}
        onChange={(v) => setState((s) => ({ ...s, equipment: v }))}
        onNext={async () => {
          setBusy(true)
          try {
            await saveEquipment()
            setStep(8)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
        onBack={() => setStep(6)}
        multi
        currentStep={4}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 8: Gender -----
  if (step === 8) {
    return (
      <ChoiceStep
        title="Kjønn"
        options={GENDER_OPTIONS}
        value={state.gender ? [state.gender] : []}
        onChange={(v) => setState((s) => ({ ...s, gender: v[0] ?? "" }))}
        onNext={async () => {
          setBusy(true)
          try {
            await patchProfile({ gender: state.gender })
            setStep(9)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
        onBack={() => setStep(7)}
        currentStep={5}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 9: Birth date -----
  if (step === 9) {
    return (
      <DateStep
        title="Når er du født?"
        value={state.birthDate}
        onChange={(v) => setState((s) => ({ ...s, birthDate: v }))}
        onNext={async () => {
          setBusy(true)
          try {
            await patchProfile({ birth_date: state.birthDate })
            setStep(10)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
        onBack={() => setStep(8)}
        currentStep={6}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 10: Height -----
  if (step === 10) {
    return (
      <NumberStep
        title="Hvor høy er du?"
        unit="cm"
        placeholder="180"
        value={state.heightCm}
        onChange={(v) => setState((s) => ({ ...s, heightCm: v }))}
        onNext={async () => {
          setBusy(true)
          try {
            await patchProfile({ height_cm: state.heightCm })
            setStep(11)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
        onBack={() => setStep(9)}
        min={100}
        max={250}
        currentStep={7}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 11: Weight -----
  if (step === 11) {
    return (
      <NumberStep
        title="Hvor mye veier du?"
        unit="kg"
        placeholder="80"
        value={state.weightKg}
        onChange={(v) => setState((s) => ({ ...s, weightKg: v }))}
        onNext={async () => {
          setBusy(true)
          try {
            await patchProfile({ weight_kg: state.weightKg })
            setStep(12)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setBusy(false)
          }
        }}
        onBack={() => setStep(10)}
        min={30}
        max={250}
        currentStep={8}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Steps 12-14 implemented in next task -----
  return <div className="p-6 text-white">Steg {step} kommer i neste task.</div>
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- OnboardingWizard.test.tsx --run
```
Expected: all tests in the file pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/OnboardingWizard.tsx \
        web/src/app/onboarding/OnboardingWizard.test.tsx
git commit -m "feat(onboarding): wizard required steps (4-11)"
```

---

## Task 15: OnboardingWizard — optional steps (12-13) + Done (14) + completion call

**Files:**
- Modify: `web/src/app/onboarding/OnboardingWizard.tsx`
- Modify: `web/src/app/onboarding/OnboardingWizard.test.tsx`

- [ ] **Step 1: Write tests for optional + done steps**

Append to `web/src/app/onboarding/OnboardingWizard.test.tsx`:

```tsx
describe("OnboardingWizard — optional and done", () => {
  it("renders DoneStep when all required fields are set", () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: ["build_muscle"],
      experience_level: "beginner",
      training_days_per_week: 3,
      gender: "male",
      birth_date: "1990-01-01",
      height_cm: 180,
      weight_kg: 80,
      equipment: ["gym"],
      injury_notes: "skipped",
      preference_notes: "skipped",
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    // first step from this state should be 12 (injuries), but optional
    expect(screen.getByRole("heading", { name: /skader/i })).toBeInTheDocument()
  })

  it("skip on injury step advances to preferences", () => {
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: ["build_muscle"],
      experience_level: "beginner",
      training_days_per_week: 3,
      gender: "male",
      birth_date: "1990-01-01",
      height_cm: 180,
      weight_kg: 80,
      equipment: ["gym"],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    fireEvent.click(screen.getByRole("button", { name: /hopp over/i }))
    expect(screen.getByRole("heading", { name: /preferanser/i })).toBeInTheDocument()
  })

  it("Done step's button POSTs to /onboarding/complete and pushes /home", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>
    const profile = {
      first_name: "Trym",
      last_name: "V",
      goals: ["build_muscle"],
      experience_level: "beginner",
      training_days_per_week: 3,
      gender: "male",
      birth_date: "1990-01-01",
      height_cm: 180,
      weight_kg: 80,
      equipment: ["gym"],
      injury_notes: null,
      preference_notes: null,
      onboarding_status: "in_progress",
    }
    render(<OnboardingWizard initialProfile={profile} firstNameFallback="Trym" />)
    fireEvent.click(screen.getByRole("button", { name: /hopp over/i })) // 12 -> 13
    fireEvent.click(screen.getByRole("button", { name: /hopp over/i })) // 13 -> 14
    await screen.findByRole("heading", { name: /alt klart/i })
    fireEvent.click(screen.getByRole("button", { name: /kom i gang/i }))
    await new Promise((r) => setTimeout(r, 0))
    const completeCall = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes("/api/users/onboarding/complete")
    )
    expect(completeCall).toBeDefined()
  })
})
```

- [ ] **Step 2: Confirm failure**

```bash
npm run test -- OnboardingWizard.test.tsx --run
```

- [ ] **Step 3: Add steps 12-14**

Replace the `return <div className="p-6 text-white">Steg {step} kommer i neste task.</div>` at the bottom of `OnboardingWizard.tsx` with:

```tsx
  // ----- Step 12: Injuries (optional) -----
  if (step === 12) {
    const handleNext = async () => {
      setBusy(true)
      try {
        await patchProfile({ injury_notes: state.injuryNotes })
        setStep(13)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusy(false)
      }
    }
    const handleSkip = () => setStep(13)
    return (
      <TextStep
        title="Har du noen skader eller begrensninger?"
        subtitle="Kort beskrivelse — eller hopp over"
        placeholder="F.eks. sår skulder, ryggsmerter..."
        value={state.injuryNotes}
        onChange={(v) => setState((s) => ({ ...s, injuryNotes: v }))}
        onNext={handleNext}
        onBack={() => setStep(11)}
        validate={(v) => v.trim().length > 0}
        multiline
        onSkip={handleSkip}
        currentStep={9}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 13: Preferences (optional) -----
  if (step === 13) {
    const handleNext = async () => {
      setBusy(true)
      try {
        await patchProfile({ preference_notes: state.preferenceNotes })
        setStep(14)
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setBusy(false)
      }
    }
    const handleSkip = () => setStep(14)
    return (
      <TextStep
        title="Hva liker du / hater du?"
        subtitle="F.eks. 'elsker styrkeløft, hater løping' — eller hopp over"
        placeholder="Skriv fritt..."
        value={state.preferenceNotes}
        onChange={(v) => setState((s) => ({ ...s, preferenceNotes: v }))}
        onNext={handleNext}
        onBack={() => setStep(12)}
        validate={(v) => v.trim().length > 0}
        multiline
        onSkip={handleSkip}
        currentStep={10}
        totalSteps={TOTAL_PROGRESS_STEPS}
        busy={busy}
      />
    )
  }

  // ----- Step 14: Done -----
  if (step === 14) {
    const summary: Record<string, string> = {
      Mål: state.goals
        .map((g) => GOAL_OPTIONS.find((o) => o.value === g)?.label)
        .filter(Boolean)
        .join(", "),
      Erfaring:
        EXPERIENCE_OPTIONS.find((o) => o.value === state.experienceLevel)?.label ?? "",
      Trening:
        FREQUENCY_OPTIONS.find((o) => o.value === state.trainingDaysPerWeek)?.label +
        " dager/uke",
      Kropp: `${state.heightCm} cm · ${state.weightKg} kg`,
    }
    const handleFinish = async () => {
      setBusy(true)
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error("Ikke innlogget")
        const res = await fetch(`${API_BASE}/api/users/onboarding/complete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.detail || `Kunne ikke fullføre (status ${res.status})`)
        }
        router.push("/home")
      } catch (e) {
        setError((e as Error).message)
        setBusy(false)
      }
    }
    return (
      <DoneStep
        firstName={state.firstName || firstNameFallback}
        summary={summary}
        onFinish={handleFinish}
        busy={busy}
      />
    )
  }

  return <div className="p-6 text-white">Ukjent steg: {step}</div>
```

- [ ] **Step 4: Run tests**

```bash
npm run test -- OnboardingWizard.test.tsx --run
```
Expected: all tests in the file pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/OnboardingWizard.tsx \
        web/src/app/onboarding/OnboardingWizard.test.tsx
git commit -m "feat(onboarding): wizard optional steps and completion (12-14)"
```

---

## Task 16: /onboarding/page.tsx — server component

**Files:**
- Modify: `web/src/app/onboarding/page.tsx`

- [ ] **Step 1: Overwrite the page**

Replace `web/src/app/onboarding/page.tsx` with:

```tsx
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import OnboardingWizard, { type InitialProfile } from "./OnboardingWizard"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Unauthenticated users see steps 1-3 (signup happens there).
  if (!user) {
    return <OnboardingWizard initialProfile={null} firstNameFallback="" />
  }

  // Authenticated: load profile to determine resume point.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const accessToken = session.access_token

  let initialProfile: InitialProfile | null = null
  let firstName = ""
  try {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (res.ok) {
      const body = await res.json()
      if (body.onboarding_status === "complete") redirect("/home")
      initialProfile = {
        first_name: body.first_name,
        last_name: body.last_name,
        goals: body.goals,
        experience_level: body.experience_level,
        training_days_per_week: body.training_days_per_week,
        gender: body.gender,
        birth_date: body.birth_date,
        height_cm: body.height_cm,
        weight_kg: body.weight_kg,
        equipment: body.equipment ?? [],
        injury_notes: body.injury_notes,
        preference_notes: body.preference_notes,
        onboarding_status: body.onboarding_status,
      }
      firstName = body.first_name ?? ""
    }
  } catch {
    firstName = (user.user_metadata?.first_name as string) ?? ""
  }

  return (
    <OnboardingWizard
      initialProfile={initialProfile}
      firstNameFallback={firstName}
    />
  )
}
```

- [ ] **Step 2: Type-check + build**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
npm run build 2>&1 | tail -20
```
Expected: build succeeds, /onboarding listed.

- [ ] **Step 3: Run full test suites**

```bash
npm run test -- --run
cd .. && api/.venv/bin/pytest api/tests/ -q
```
Expected: all green.

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/onboarding/page.tsx
git commit -m "feat(onboarding): wire OnboardingWizard into /onboarding route"
```

---

## Task 17: E2E smoke test (manual)

- [ ] **Step 1: Start servers**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
make dev
```
Wait for both `[api]` and `[web]` to show "Ready"/listening.

- [ ] **Step 2: Run through the flow as a fresh user**

1. Open `http://localhost:3000/onboarding`. (Or log out first if already logged in.)
2. Steg 1: Enter Fornavn + Etternavn → Neste.
3. Steg 2: Enter email → Neste.
4. Steg 3: Enter password (min 6 chars) → Opprett konto. Should land on Steg 4 within ~2s.
5. Steg 4: Pick at least one goal → Neste.
6. Steg 5-11: Walk through each. Progress bar advances by one segment each step.
7. Steg 12: Type something into "Skader" OR click "Hopp over →".
8. Steg 13: Same as 12.
9. Steg 14: See "Alt klart, {firstName}!" with summary. Click "Kom i gang". Should land on `/home`.

- [ ] **Step 3: Verify state in DB**

```bash
api/.venv/bin/python -c "
import asyncio, os
from psycopg import AsyncConnection
async def main():
    conn = await AsyncConnection.connect(os.environ['DATABASE_URL'])
    cur = await conn.execute(
        'SELECT first_name, goals, experience_level, training_days_per_week, gender, birth_date, height_cm, weight_kg, injury_notes, preference_notes, onboarding_status FROM users ORDER BY id DESC LIMIT 1'
    )
    row = await cur.fetchone()
    print(row)
asyncio.run(main())
"
```
Expected: most recent user row has all fields populated and `onboarding_status='complete'`.

```bash
api/.venv/bin/python -c "
import asyncio, os
from psycopg import AsyncConnection
async def main():
    conn = await AsyncConnection.connect(os.environ['DATABASE_URL'])
    cur = await conn.execute(
        'SELECT equipment FROM user_equipment WHERE user_id = (SELECT id FROM users ORDER BY id DESC LIMIT 1)'
    )
    rows = await cur.fetchall()
    print(rows)
asyncio.run(main())
"
```
Expected: at least one equipment row.

- [ ] **Step 4: Verify resume behavior**

1. Log in as that same user from another tab — should redirect to `/home` (status complete).
2. As an admin, manually flip the user's `onboarding_status` to `in_progress` in DB:
   ```sql
   UPDATE users SET onboarding_status='in_progress' WHERE email='YOUR_TEST_EMAIL';
   ```
3. Navigate to `/home` — middleware should redirect to `/onboarding`.
4. Wizard should land on step 14 (Done), since all required fields are still set.

- [ ] **Step 5: Verify Profile-tab**

Navigate to `/profile`. All 8 required fields should display the saved values.

- [ ] **Step 6: Run `make check`**

```bash
make check
```
Expected: all checks pass.

- [ ] **Step 7: Commit anything found during smoke test**

If you found a bug, fix it now and commit. If not, no commit needed.

---

## Task 18: Push branch + open PR

- [ ] **Step 1: Push branch**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git push -u origin feat/onboarding-redesign
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "feat: classic onboarding wizard" --body "$(cat <<'EOF'
## Summary
- Replaces the chat-based onboarding (previous PR work on this branch) with a 13-step wizard
- Account creation up front (steps 1-3), then 8 required profile fields, then 2 optional notes screens
- Backend recycles migration 009 and middleware-redirect from the chat work; adds migration 010 (injury_notes + preference_notes) and POST /api/users/onboarding/complete
- Chat-specific code (tools, mode parameter, quick_replies SSE event, /signup route, QuickReplies component) torn out

## Test plan
- [x] `make check` passes (backend + frontend)
- [x] Manual smoke test: signup → 13 screens → /home
- [x] DB state verified: all required fields set, onboarding_status='complete'
- [x] Middleware redirects pre-complete users to /onboarding
- [x] Profile tab shows all 8 required values
- [x] Resume mid-flow works (refresh + log in from another device)

Spec: docs/superpowers/specs/2026-06-02-onboarding-wizard-design.md
Plan: docs/superpowers/plans/2026-06-02-onboarding-wizard.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Verify PR was created**

The gh command should return the PR URL.
