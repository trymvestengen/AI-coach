# Onboarding Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 11-step onboarding wizard with a conversational chat-based flow led by the coach, collecting 8 profile fields through quick-reply buttons and free text.

**Architecture:** New `/signup` route handles account creation (name, email, password). After signup, users land on `/onboarding` — a chat UI that calls `/api/chat/stream` with `mode="onboarding"`. The backend uses an onboarding-specific system prompt and a restricted tool set (`save_profile_field`, `add_equipment_batch`, `set_quick_replies`, `complete_onboarding`). Quick-reply buttons are driven by a new `set_quick_replies` tool that emits a `quick_replies` SSE event attached to the assistant's next message. Middleware redirects users with `users.onboarding_status != 'complete'` back to `/onboarding`.

**Tech Stack:** FastAPI + psycopg + Anthropic Claude Sonnet 4.5 (backend), Next.js 16 App Router + Supabase Auth + Tailwind v4 (frontend), pytest (backend tests), Vitest + React Testing Library (frontend tests).

---

## File Structure

**Backend files created:**
- `api/db/migrations/009_onboarding_status.sql` — schema migration
- `api/app/tools/onboarding_handlers.py` — handler functions for onboarding tools
- `api/app/tools/onboarding_definitions.py` — tool definitions for onboarding mode

**Backend files modified:**
- `api/app/services/coach.py` — add `ONBOARDING_PROMPT`, accept `mode` parameter in `chat_stream`, route `set_quick_replies` to special SSE event, mark session `is_onboarding` when mode=onboarding
- `api/app/tools/handlers.py` — route onboarding tool names to `onboarding_handlers`
- `api/app/routers/chat.py` — accept `mode` field in `/chat/stream` body
- `api/app/routers/users.py` — include `onboarding_status` in `get_user_profile` response

**Frontend files created:**
- `web/src/app/signup/page.tsx` — minimal account-creation form
- `web/src/app/onboarding/OnboardingClient.tsx` — chat client for onboarding flow
- `web/src/components/chat/QuickReplies.tsx` — quick-reply button row
- `web/src/components/chat/QuickReplies.test.tsx` — component test

**Frontend files modified:**
- `web/src/lib/coach-stream.ts` — extend `StreamEvent` type with `quick_replies`, accept `mode` argument
- `web/src/app/onboarding/page.tsx` — replace 535-line wizard with server component that loads OnboardingClient
- `web/src/middleware.ts` — redirect users with non-complete onboarding to `/onboarding`

---

## Task 1: Migration 009 — onboarding_status column

**Files:**
- Create: `api/db/migrations/009_onboarding_status.sql`

- [ ] **Step 1: Create migration file**

```sql
-- api/db/migrations/009_onboarding_status.sql
-- Track onboarding completion state per user, and mark coach sessions
-- that were used for onboarding.

ALTER TABLE users
  ADD COLUMN onboarding_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'complete'));

ALTER TABLE coach_sessions
  ADD COLUMN is_onboarding BOOLEAN NOT NULL DEFAULT false;
```

- [ ] **Step 2: Apply migration locally**

Run: `psql "$DATABASE_URL" -f api/db/migrations/009_onboarding_status.sql`
Expected: `ALTER TABLE` × 2, no errors.

- [ ] **Step 3: Apply migration in Supabase**

Open Supabase dashboard → SQL Editor → paste contents of 009_onboarding_status.sql → Run.
Expected: success message.

- [ ] **Step 4: Verify columns exist**

Run: `psql "$DATABASE_URL" -c "\d users" | grep onboarding_status`
Expected: `onboarding_status | text | not null | 'not_started'::text`

Run: `psql "$DATABASE_URL" -c "\d coach_sessions" | grep is_onboarding`
Expected: `is_onboarding | boolean | not null | false`

- [ ] **Step 5: Commit**

```bash
git add api/db/migrations/009_onboarding_status.sql
git commit -m "feat(db): add onboarding_status and is_onboarding columns"
```

---

## Task 2: Onboarding tool definitions

**Files:**
- Create: `api/app/tools/onboarding_definitions.py`

- [ ] **Step 1: Create the tool definitions module**

```python
# api/app/tools/onboarding_definitions.py
"""Tool definitions exposed to the coach only during onboarding mode."""

ONBOARDING_TOOL_DEFINITIONS = [
    {
        "name": "save_profile_field",
        "description": (
            "Save a single profile field. Call this AS SOON AS the user has confirmed "
            "a value. Use the exact field names listed in the schema. For multi-select "
            "fields like 'goals', pass an array of values."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "field": {
                    "type": "string",
                    "enum": [
                        "goals",
                        "experience_level",
                        "training_days_per_week",
                        "weight_kg",
                        "height_cm",
                        "birth_date",
                        "gender",
                    ],
                    "description": (
                        "goals: array of values from "
                        "['build_muscle','lose_weight','get_stronger','improve_endurance','maintain']. "
                        "experience_level: one of 'beginner','intermediate','advanced'. "
                        "training_days_per_week: integer 1-7. "
                        "weight_kg: number. height_cm: integer. "
                        "birth_date: 'YYYY-MM-DD'. "
                        "gender: one of 'male','female','other'."
                    ),
                },
                "value": {
                    "description": "Field value. Type varies by field — see field description."
                },
            },
            "required": ["field", "value"],
        },
    },
    {
        "name": "add_equipment_batch",
        "description": (
            "Add one or more equipment items the user has access to. Pass canonical "
            "strings like 'barbell','dumbbells','bench','rack','cable_machine','bodyweight'. "
            "If the user describes their setup in free text, infer the canonical items."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of equipment identifiers.",
                },
            },
            "required": ["items"],
        },
    },
    {
        "name": "set_quick_replies",
        "description": (
            "Attach quick-reply buttons to your NEXT assistant message. "
            "Use this immediately BEFORE asking a question that has a fixed set of answers. "
            "Max 5 options. The user can still type free text to override."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "options": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Button labels, max 5, in Norwegian.",
                },
            },
            "required": ["options"],
        },
    },
    {
        "name": "complete_onboarding",
        "description": (
            "Call when ALL Tier 1 fields (goals, experience_level, training_days_per_week, "
            "equipment) have been saved AND Tier 2 fields (weight_kg, height_cm, birth_date, "
            "gender) have either been saved or explicitly skipped by the user. "
            "If a Tier 1 field is missing, this will return an error telling you which."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
]
```

- [ ] **Step 2: Commit**

```bash
git add api/app/tools/onboarding_definitions.py
git commit -m "feat(tools): add onboarding tool definitions"
```

---

## Task 3: Onboarding handlers — save_profile_field

**Files:**
- Create: `api/app/tools/onboarding_handlers.py`
- Create: `api/tests/test_onboarding_handlers.py`

- [ ] **Step 1: Write the failing test**

```python
# api/tests/test_onboarding_handlers.py
from unittest.mock import AsyncMock

import pytest

from app.tools import onboarding_handlers

USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_save_profile_field_writes_scalar(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(mock_conn))

    result = await onboarding_handlers.save_profile_field(
        USER_ID, field="experience_level", value="intermediate"
    )

    assert result == {"ok": True, "field": "experience_level"}
    mock_conn.execute.assert_called_once()
    call_args = mock_conn.execute.call_args
    sql = call_args[0][0]
    params = call_args[0][1]
    assert "UPDATE users SET experience_level" in sql
    assert params == ("intermediate", USER_ID)


@pytest.mark.asyncio
async def test_save_profile_field_writes_array_for_goals(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(mock_conn))

    result = await onboarding_handlers.save_profile_field(
        USER_ID, field="goals", value=["build_muscle", "get_stronger"]
    )

    assert result == {"ok": True, "field": "goals"}
    sql = mock_conn.execute.call_args[0][0]
    params = mock_conn.execute.call_args[0][1]
    assert "UPDATE users SET goals" in sql
    assert params == (["build_muscle", "get_stronger"], USER_ID)


@pytest.mark.asyncio
async def test_save_profile_field_rejects_unknown_field():
    result = await onboarding_handlers.save_profile_field(
        USER_ID, field="not_a_real_field", value="x"
    )
    assert "error" in result
    assert "field" in result["error"].lower()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_onboarding_handlers.py -v`
Expected: ModuleNotFoundError or `save_profile_field` does not exist.

- [ ] **Step 3: Create the handler module**

```python
# api/app/tools/onboarding_handlers.py
"""Handlers for onboarding-only tools. Each handler is parameterised by user_id."""

from datetime import date as date_type
from app.db import get_conn

# Whitelist of users-table columns the onboarding flow may write.
_ALLOWED_USER_FIELDS = {
    "goals",
    "experience_level",
    "training_days_per_week",
    "weight_kg",
    "height_cm",
    "birth_date",
    "gender",
}


async def save_profile_field(user_id: str, field: str, value) -> dict:
    if field not in _ALLOWED_USER_FIELDS:
        return {"error": f"Unknown field '{field}'. Allowed: {sorted(_ALLOWED_USER_FIELDS)}"}

    if field == "birth_date" and isinstance(value, str):
        try:
            value = date_type.fromisoformat(value)
        except ValueError:
            return {"error": "birth_date must be in YYYY-MM-DD format"}

    async with get_conn() as conn:
        await conn.execute(
            f"UPDATE users SET {field} = %s WHERE id = %s",
            (value, user_id),
        )
        await conn.commit()

    return {"ok": True, "field": field}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd api && .venv/bin/pytest tests/test_onboarding_handlers.py -v`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add api/app/tools/onboarding_handlers.py api/tests/test_onboarding_handlers.py
git commit -m "feat(tools): add save_profile_field handler"
```

---

## Task 4: Onboarding handler — add_equipment_batch

**Files:**
- Modify: `api/app/tools/onboarding_handlers.py`
- Modify: `api/tests/test_onboarding_handlers.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_onboarding_handlers.py`:

```python
@pytest.mark.asyncio
async def test_add_equipment_batch_inserts_each_item(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(mock_conn))

    result = await onboarding_handlers.add_equipment_batch(
        USER_ID, items=["barbell", "dumbbells", "rack"]
    )

    assert result == {"ok": True, "count": 3}
    assert mock_conn.execute.call_count == 3
    inserted = [c[0][1][1] for c in mock_conn.execute.call_args_list]
    assert inserted == ["barbell", "dumbbells", "rack"]


@pytest.mark.asyncio
async def test_add_equipment_batch_empty_list(monkeypatch, mock_conn, make_mock_get_conn):
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(mock_conn))
    result = await onboarding_handlers.add_equipment_batch(USER_ID, items=[])
    assert result == {"ok": True, "count": 0}
    mock_conn.execute.assert_not_called()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_onboarding_handlers.py::test_add_equipment_batch_inserts_each_item -v`
Expected: `AttributeError: module 'app.tools.onboarding_handlers' has no attribute 'add_equipment_batch'`

- [ ] **Step 3: Add the handler**

Append to `api/app/tools/onboarding_handlers.py`:

```python
async def add_equipment_batch(user_id: str, items: list[str]) -> dict:
    if not items:
        return {"ok": True, "count": 0}

    async with get_conn() as conn:
        for item in items:
            await conn.execute(
                "INSERT INTO user_equipment (user_id, equipment) VALUES (%s, %s) "
                "ON CONFLICT DO NOTHING",
                (user_id, item),
            )
        await conn.commit()

    return {"ok": True, "count": len(items)}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && .venv/bin/pytest tests/test_onboarding_handlers.py -v`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add api/app/tools/onboarding_handlers.py api/tests/test_onboarding_handlers.py
git commit -m "feat(tools): add add_equipment_batch handler"
```

---

## Task 5: Onboarding handler — complete_onboarding

**Files:**
- Modify: `api/app/tools/onboarding_handlers.py`
- Modify: `api/tests/test_onboarding_handlers.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_onboarding_handlers.py`:

```python
@pytest.mark.asyncio
async def test_complete_onboarding_success_when_tier1_set(monkeypatch, make_mock_get_conn):
    conn = AsyncMock()
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(["build_muscle"], "beginner", 3, 1))
    cur_update = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])
    conn.commit = AsyncMock()

    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(conn))

    result = await onboarding_handlers.complete_onboarding(USER_ID)

    assert result == {"ok": True, "status": "complete"}
    update_call = conn.execute.call_args_list[1]
    assert "UPDATE users SET onboarding_status" in update_call[0][0]
    assert update_call[0][1] == ("complete", USER_ID)


@pytest.mark.asyncio
async def test_complete_onboarding_blocks_when_goals_missing(monkeypatch, make_mock_get_conn):
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(None, "beginner", 3, 1))
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(conn))

    result = await onboarding_handlers.complete_onboarding(USER_ID)

    assert "error" in result
    assert "goals" in result["error"]
    assert conn.execute.call_count == 1


@pytest.mark.asyncio
async def test_complete_onboarding_blocks_when_equipment_missing(monkeypatch, make_mock_get_conn):
    conn = AsyncMock()
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(["build_muscle"], "beginner", 3, 0))
    conn.execute = AsyncMock(return_value=cur)
    conn.commit = AsyncMock()
    monkeypatch.setattr("app.tools.onboarding_handlers.get_conn", make_mock_get_conn(conn))

    result = await onboarding_handlers.complete_onboarding(USER_ID)

    assert "error" in result
    assert "equipment" in result["error"]
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && .venv/bin/pytest tests/test_onboarding_handlers.py -k complete_onboarding -v`
Expected: `AttributeError: module 'app.tools.onboarding_handlers' has no attribute 'complete_onboarding'`

- [ ] **Step 3: Add the handler**

Append to `api/app/tools/onboarding_handlers.py`:

```python
async def complete_onboarding(user_id: str) -> dict:
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT u.goals, u.experience_level, u.training_days_per_week,
                   (SELECT COUNT(*) FROM user_equipment WHERE user_id = u.id)
            FROM users u
            WHERE u.id = %s
            """,
            (user_id,),
        )
        row = await cur.fetchone()
        if row is None:
            return {"error": "User not found"}

        goals, experience, days, equipment_count = row
        missing = []
        if not goals or len(goals) == 0:
            missing.append("goals")
        if not experience:
            missing.append("experience_level")
        if days is None:
            missing.append("training_days_per_week")
        if equipment_count == 0:
            missing.append("equipment")
        if missing:
            return {
                "error": (
                    f"Cannot complete onboarding — missing required fields: {missing}. "
                    f"Ask the user about these before calling complete_onboarding again."
                )
            }

        await conn.execute(
            "UPDATE users SET onboarding_status = %s WHERE id = %s",
            ("complete", user_id),
        )
        await conn.commit()

    return {"ok": True, "status": "complete"}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && .venv/bin/pytest tests/test_onboarding_handlers.py -v`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add api/app/tools/onboarding_handlers.py api/tests/test_onboarding_handlers.py
git commit -m "feat(tools): add complete_onboarding handler with Tier 1 validation"
```

---

## Task 6: Wire onboarding tools into handle_tool dispatch

**Files:**
- Modify: `api/app/tools/handlers.py`
- Modify: `api/tests/test_tools.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_tools.py`:

```python
@pytest.mark.asyncio
async def test_handle_tool_routes_save_profile_field(monkeypatch):
    from app.tools import handlers
    called = {}

    async def fake_save(user_id, field, value):
        called["args"] = (user_id, field, value)
        return {"ok": True, "field": field}

    monkeypatch.setattr("app.tools.handlers.onboarding_handlers.save_profile_field", fake_save)
    result = await handlers.handle_tool(
        "save_profile_field",
        {"field": "experience_level", "value": "beginner"},
        user_id="user-123",
    )
    assert result == {"ok": True, "field": "experience_level"}
    assert called["args"] == ("user-123", "experience_level", "beginner")


@pytest.mark.asyncio
async def test_handle_tool_routes_add_equipment_batch(monkeypatch):
    from app.tools import handlers
    async def fake_add(user_id, items):
        return {"ok": True, "count": len(items)}
    monkeypatch.setattr("app.tools.handlers.onboarding_handlers.add_equipment_batch", fake_add)
    result = await handlers.handle_tool(
        "add_equipment_batch", {"items": ["barbell", "rack"]}, user_id="user-123"
    )
    assert result == {"ok": True, "count": 2}


@pytest.mark.asyncio
async def test_handle_tool_routes_complete_onboarding(monkeypatch):
    from app.tools import handlers
    async def fake_complete(user_id):
        return {"ok": True, "status": "complete"}
    monkeypatch.setattr("app.tools.handlers.onboarding_handlers.complete_onboarding", fake_complete)
    result = await handlers.handle_tool(
        "complete_onboarding", {}, user_id="user-123"
    )
    assert result == {"ok": True, "status": "complete"}
```

Make sure `import pytest` is at top of the file (it already is — verify).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd api && .venv/bin/pytest tests/test_tools.py -k onboarding -v`
Expected: TypeError or routing failure (handle_tool doesn't know `user_id` kwarg).

- [ ] **Step 3: Update handle_tool signature and routes**

Edit `api/app/tools/handlers.py`. Add import near the top:

```python
from app.tools import onboarding_handlers
```

Change the `handle_tool` signature and add new branches. Replace this:

```python
async def handle_tool(name: str, inputs: dict) -> dict | list:
    if name == "get_exercise_info":
```

with:

```python
async def handle_tool(name: str, inputs: dict, user_id: str = TEST_USER_ID) -> dict | list:
    if name == "save_profile_field":
        return await onboarding_handlers.save_profile_field(
            user_id, field=inputs["field"], value=inputs["value"]
        )
    if name == "add_equipment_batch":
        return await onboarding_handlers.add_equipment_batch(
            user_id, items=inputs.get("items", [])
        )
    if name == "complete_onboarding":
        return await onboarding_handlers.complete_onboarding(user_id)
    if name == "get_exercise_info":
```

(The rest of the function stays unchanged — TEST_USER_ID is still used for legacy paths until they're migrated.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd api && .venv/bin/pytest tests/test_tools.py -v`
Expected: existing tests + 3 new tests all pass.

- [ ] **Step 5: Run the full backend test suite**

Run: `cd api && .venv/bin/pytest -q`
Expected: all pass (no regressions).

- [ ] **Step 6: Commit**

```bash
git add api/app/tools/handlers.py api/tests/test_tools.py
git commit -m "feat(tools): route onboarding tool calls through handle_tool"
```

---

## Task 7: Onboarding system prompt + mode param in chat_stream

**Files:**
- Modify: `api/app/services/coach.py`
- Modify: `api/tests/test_chat_stream.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_chat_stream.py` (read the existing test file first to see fixture and patching patterns):

```python
@pytest.mark.asyncio
async def test_chat_stream_onboarding_mode_uses_onboarding_prompt_and_tools(monkeypatch):
    """When mode='onboarding', chat_stream must use the onboarding system prompt
    and only expose onboarding tools."""
    from app.services import coach

    captured = {}

    class FakeStreamCtx:
        async def __aenter__(self):
            return self
        async def __aexit__(self, *a):
            return False
        def __aiter__(self):
            async def gen():
                if False:
                    yield None
            return gen()

    def fake_stream(**kwargs):
        captured["system"] = kwargs.get("system")
        captured["tools"] = kwargs.get("tools")
        return FakeStreamCtx()

    monkeypatch.setattr(coach.client.messages, "stream", fake_stream)
    monkeypatch.setattr(coach, "_ensure_session", AsyncMock(return_value="sess-1"))
    monkeypatch.setattr(coach, "_save_message", AsyncMock())
    monkeypatch.setattr(coach, "_load_history", AsyncMock(return_value=[]))
    monkeypatch.setattr(coach, "build_base_context", AsyncMock(return_value="ctx"))

    events = []
    async for ev in coach.chat_stream(
        user_id="user-1", session_id=None, user_message="hi", mode="onboarding"
    ):
        events.append(ev)

    system_text = " ".join(s["text"] for s in captured["system"])
    assert "ONBOARDING MODE" in system_text
    tool_names = {t["name"] for t in captured["tools"]}
    assert "save_profile_field" in tool_names
    assert "complete_onboarding" in tool_names
    assert "get_workout_history" not in tool_names  # regular tools excluded
```

(`AsyncMock` import: ensure `from unittest.mock import AsyncMock` is at the top.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py::test_chat_stream_onboarding_mode_uses_onboarding_prompt_and_tools -v`
Expected: TypeError — `chat_stream()` got unexpected keyword argument `mode`.

- [ ] **Step 3: Add the onboarding prompt constant**

In `api/app/services/coach.py`, add after the `PERSONA_BLOCKS` dict (around line 47):

```python
ONBOARDING_PROMPT = """You are AI Coach in ONBOARDING MODE. You're meeting {first_name} for the first time.

Your job: warmly collect 8 profile fields through natural conversation.
Use save_profile_field() as each piece of data is confirmed.
Use set_quick_replies() before asking questions with a fixed answer set.
When ALL Tier 1 fields are saved AND Tier 2 fields are saved-or-skipped, call complete_onboarding().

FIELDS:
TIER 1 (required — must collect):
1. goals (multi-select, save with save_profile_field field='goals', value=array)
2. experience_level (one of 'beginner','intermediate','advanced')
3. training_days_per_week (integer 1-7)
4. equipment (use add_equipment_batch with canonical items)

TIER 2 (recommended — allow "hopp over" / skip):
5. weight_kg (number)
6. height_cm (integer)
7. birth_date ('YYYY-MM-DD')
8. gender ('male','female','other')

ADAPTIVE RULES:
- If the user volunteers info ahead of time, save it and skip that question later.
- Tier 2: if the user says "hopp over" or "skip", do NOT save NULL — just move on.
- Answer side-questions briefly (1 sentence) then re-ask the original.
- After complete_onboarding succeeds, send a short warm goodbye in 1-2 sentences.

PERSONALITY: warm, knowledgeable, slightly humorous. Keep messages 1-3 sentences. Norwegian.
"""
```

- [ ] **Step 4: Update chat_stream signature and prompt/tool selection**

Edit `api/app/services/coach.py`. Add import near top:

```python
from app.tools.onboarding_definitions import ONBOARDING_TOOL_DEFINITIONS
```

Change the `chat_stream` signature from:

```python
async def chat_stream(
    user_id: str,
    session_id: str | None,
    user_message: str,
    persona: str = "friend",
) -> AsyncGenerator[dict, None]:
```

to:

```python
async def chat_stream(
    user_id: str,
    session_id: str | None,
    user_message: str,
    persona: str = "friend",
    mode: str = "default",
) -> AsyncGenerator[dict, None]:
```

Inside the function, replace the `system = [...]` construction with:

```python
        if mode == "onboarding":
            first_name = await _get_first_name(user_id) or "der"
            system = [
                {"type": "text",
                 "text": ONBOARDING_PROMPT.format(first_name=first_name),
                 "cache_control": {"type": "ephemeral"}},
            ]
            tools = ONBOARDING_TOOL_DEFINITIONS
        else:
            base_ctx = await build_base_context(user_id)
            system = [
                {"type": "text",
                 "text": f"{BASE_PROMPT}\n\n{PERSONA_BLOCKS[persona]}",
                 "cache_control": {"type": "ephemeral"}},
                {"type": "text", "text": base_ctx},
            ]
            tools = TOOL_DEFINITIONS
```

Then change the `client.messages.stream` call to use `tools=tools` instead of `tools=TOOL_DEFINITIONS`.

Add a helper at the bottom of the file (above `chat_stream` or just below the existing helpers):

```python
async def _get_first_name(user_id: str) -> str | None:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT first_name FROM users WHERE id = %s", (user_id,),
        )
        row = await cur.fetchone()
        return row[0] if row else None
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py::test_chat_stream_onboarding_mode_uses_onboarding_prompt_and_tools -v`
Expected: PASS.

- [ ] **Step 6: Run full chat_stream tests to confirm no regressions**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py -v`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add api/app/services/coach.py api/tests/test_chat_stream.py
git commit -m "feat(coach): add onboarding mode with dedicated prompt and tool set"
```

---

## Task 8: Pass user_id through to handle_tool from chat_stream

**Files:**
- Modify: `api/app/services/coach.py`
- Modify: `api/tests/test_chat_stream.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_chat_stream.py`:

```python
@pytest.mark.asyncio
async def test_chat_stream_passes_user_id_to_handle_tool(monkeypatch):
    """When a tool is invoked, handle_tool must be called with user_id kwarg."""
    from app.services import coach

    captured = {}

    async def fake_handle_tool(name, inputs, user_id=None):
        captured["name"] = name
        captured["user_id"] = user_id
        return {"ok": True}

    class FakeBlock:
        type = "tool_use"
        id = "tu_1"
        name = "save_profile_field"
        input = {"field": "experience_level", "value": "beginner"}

    class FakeStreamCtx:
        async def __aenter__(self):
            return self
        async def __aexit__(self, *a):
            return False
        def __aiter__(self):
            async def gen():
                ev1 = type("E", (), {"type": "content_block_start", "content_block": FakeBlock()})()
                ev2 = type("E", (), {"type": "message_stop"})()
                yield ev1
                yield ev2
            return gen()

    # First call: returns tool_use. Second call (after results): no tool_use → ends loop.
    call_count = {"n": 0}
    def fake_stream(**kwargs):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return FakeStreamCtx()
        # Second call: empty stream so loop exits
        class Empty(FakeStreamCtx):
            def __aiter__(self):
                async def gen():
                    yield type("E", (), {"type": "message_stop"})()
                return gen()
        return Empty()

    monkeypatch.setattr(coach.client.messages, "stream", fake_stream)
    monkeypatch.setattr(coach, "_ensure_session", AsyncMock(return_value="sess-1"))
    monkeypatch.setattr(coach, "_save_message", AsyncMock())
    monkeypatch.setattr(coach, "_load_history", AsyncMock(return_value=[]))
    monkeypatch.setattr(coach, "_get_first_name", AsyncMock(return_value="Trym"))
    monkeypatch.setattr(coach, "handle_tool", fake_handle_tool)

    async for _ in coach.chat_stream(
        user_id="user-XYZ", session_id=None, user_message="hi", mode="onboarding"
    ):
        pass

    assert captured["user_id"] == "user-XYZ"
    assert captured["name"] == "save_profile_field"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py::test_chat_stream_passes_user_id_to_handle_tool -v`
Expected: assertion fails (user_id not passed to handle_tool).

- [ ] **Step 3: Update chat_stream to pass user_id**

In `api/app/services/coach.py`, find:

```python
                try:
                    result = await handle_tool(tu["name"], tu["input"])
                    ok = not (isinstance(result, dict) and "error" in result)
```

Replace with:

```python
                try:
                    result = await handle_tool(tu["name"], tu["input"], user_id=user_id)
                    ok = not (isinstance(result, dict) and "error" in result)
```

- [ ] **Step 4: Run tests**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add api/app/services/coach.py api/tests/test_chat_stream.py
git commit -m "feat(coach): pass user_id through chat_stream to handle_tool"
```

---

## Task 9: SSE quick_replies event from set_quick_replies tool

**Files:**
- Modify: `api/app/services/coach.py`
- Modify: `api/tests/test_chat_stream.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_chat_stream.py`:

```python
@pytest.mark.asyncio
async def test_chat_stream_set_quick_replies_emits_event_and_skips_handler(monkeypatch):
    """set_quick_replies must yield a quick_replies SSE event and NOT call handle_tool."""
    from app.services import coach

    handle_calls = []

    async def fake_handle_tool(name, inputs, user_id=None):
        handle_calls.append(name)
        return {"ok": True}

    class FakeBlock:
        type = "tool_use"
        id = "tu_qr"
        name = "set_quick_replies"
        input = {"options": ["Ja", "Nei"]}

    class FakeStreamCtx:
        async def __aenter__(self):
            return self
        async def __aexit__(self, *a):
            return False
        def __aiter__(self):
            async def gen():
                yield type("E", (), {"type": "content_block_start", "content_block": FakeBlock()})()
                yield type("E", (), {"type": "message_stop"})()
            return gen()

    call_count = {"n": 0}
    def fake_stream(**kwargs):
        call_count["n"] += 1
        if call_count["n"] == 1:
            return FakeStreamCtx()
        class Empty(FakeStreamCtx):
            def __aiter__(self):
                async def gen():
                    yield type("E", (), {"type": "message_stop"})()
                return gen()
        return Empty()

    monkeypatch.setattr(coach.client.messages, "stream", fake_stream)
    monkeypatch.setattr(coach, "_ensure_session", AsyncMock(return_value="sess-1"))
    monkeypatch.setattr(coach, "_save_message", AsyncMock())
    monkeypatch.setattr(coach, "_load_history", AsyncMock(return_value=[]))
    monkeypatch.setattr(coach, "_get_first_name", AsyncMock(return_value="Trym"))
    monkeypatch.setattr(coach, "handle_tool", fake_handle_tool)

    events = []
    async for ev in coach.chat_stream(
        user_id="user-1", session_id=None, user_message="hi", mode="onboarding"
    ):
        events.append(ev)

    qr_events = [e for e in events if e.get("type") == "quick_replies"]
    assert len(qr_events) == 1
    assert qr_events[0]["options"] == ["Ja", "Nei"]
    assert "set_quick_replies" not in handle_calls
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py::test_chat_stream_set_quick_replies_emits_event_and_skips_handler -v`
Expected: no quick_replies event emitted (test fails).

- [ ] **Step 3: Special-case set_quick_replies in chat_stream tool loop**

In `api/app/services/coach.py`, in the `for tu in tool_uses_in_this_turn:` loop, replace the body with:

```python
            for tu in tool_uses_in_this_turn:
                if tu["name"] == "set_quick_replies":
                    # Special: emit SSE event, return synthetic success result.
                    options = tu["input"].get("options", [])
                    yield {"type": "quick_replies", "options": options}
                    await _save_message(sid, "tool_use", {
                        "tool_use_id": tu["id"],
                        "tool_name": tu["name"],
                        "input": tu["input"],
                    })
                    tool_result_blocks.append({
                        "type": "tool_result",
                        "tool_use_id": tu["id"],
                        "content": json.dumps({"ok": True}),
                    })
                    continue

                yield {
                    "type": "tool_use",
                    "tool_use_id": tu["id"],
                    "name": tu["name"],
                    "input": tu["input"],
                }
                await _save_message(sid, "tool_use", {
                    "tool_use_id": tu["id"],
                    "tool_name": tu["name"],
                    "input": tu["input"],
                })

                try:
                    result = await handle_tool(tu["name"], tu["input"], user_id=user_id)
                    ok = not (isinstance(result, dict) and "error" in result)
                except Exception as e:
                    result = {"error": str(e)}
                    ok = False

                yield {
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "name": tu["name"],
                    "ok": ok,
                }
                await _save_message(sid, "tool_result", {
                    "tool_use_id": tu["id"],
                    "tool_name": tu["name"],
                    "result": result,
                    "ok": ok,
                })

                tool_result_blocks.append({
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "content": json.dumps(result),
                })
```

- [ ] **Step 4: Run tests**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add api/app/services/coach.py api/tests/test_chat_stream.py
git commit -m "feat(coach): emit quick_replies SSE event from set_quick_replies tool"
```

---

## Task 10: Mark onboarding sessions with is_onboarding flag

**Files:**
- Modify: `api/app/services/coach.py`
- Modify: `api/tests/test_chat_stream.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_chat_stream.py`:

```python
@pytest.mark.asyncio
async def test_ensure_session_sets_is_onboarding_when_mode_onboarding(monkeypatch):
    from app.services import coach

    captured = {}

    class FakeCursor:
        async def fetchone(self):
            return ("new-sess-id",)

    class FakeConn:
        execute = AsyncMock()
        commit = AsyncMock()

    conn = FakeConn()
    cur_existing = AsyncMock()
    cur_existing.fetchone = AsyncMock(return_value=None)
    cur_insert = AsyncMock()
    cur_insert.fetchone = AsyncMock(return_value=("new-sess-id",))

    async def fake_execute(sql, params=None):
        captured.setdefault("queries", []).append((sql, params))
        if sql.startswith("INSERT"):
            return cur_insert
        return cur_existing

    conn.execute = AsyncMock(side_effect=fake_execute)

    from contextlib import asynccontextmanager
    @asynccontextmanager
    async def fake_get_conn():
        yield conn

    monkeypatch.setattr("app.services.coach.get_conn", fake_get_conn)

    sid = await coach._ensure_session("user-1", None, is_onboarding=True)
    assert sid == "new-sess-id"
    insert_q = [q for q in captured["queries"] if q[0].startswith("INSERT")][0]
    assert "is_onboarding" in insert_q[0]
    assert insert_q[1] == ("user-1", True)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py::test_ensure_session_sets_is_onboarding_when_mode_onboarding -v`
Expected: TypeError — `_ensure_session()` got unexpected keyword argument `is_onboarding`.

- [ ] **Step 3: Update _ensure_session signature**

In `api/app/services/coach.py`, change:

```python
async def _ensure_session(user_id: str, session_id: str | None) -> str:
    """Return session id to use. Reuse if recent, else create new."""
    async with get_conn() as conn:
        if session_id:
            cur = await conn.execute(
                "SELECT id FROM coach_sessions "
                "WHERE id = %s AND user_id = %s AND ended_at IS NULL "
                "  AND last_activity_at > now() - interval '30 minutes'",
                (session_id, user_id),
            )
            row = await cur.fetchone()
            if row:
                return session_id

        cur = await conn.execute(
            "INSERT INTO coach_sessions (user_id) VALUES (%s) RETURNING id",
            (user_id,),
        )
        row = await cur.fetchone()
        await conn.commit()
        return row[0]
```

to:

```python
async def _ensure_session(user_id: str, session_id: str | None, is_onboarding: bool = False) -> str:
    """Return session id to use. Reuse if recent, else create new."""
    async with get_conn() as conn:
        if session_id:
            cur = await conn.execute(
                "SELECT id FROM coach_sessions "
                "WHERE id = %s AND user_id = %s AND ended_at IS NULL "
                "  AND last_activity_at > now() - interval '30 minutes'",
                (session_id, user_id),
            )
            row = await cur.fetchone()
            if row:
                return session_id

        cur = await conn.execute(
            "INSERT INTO coach_sessions (user_id, is_onboarding) VALUES (%s, %s) RETURNING id",
            (user_id, is_onboarding),
        )
        row = await cur.fetchone()
        await conn.commit()
        return row[0]
```

And update the call site inside `chat_stream`:

```python
        sid = await _ensure_session(user_id, session_id, is_onboarding=(mode == "onboarding"))
```

- [ ] **Step 4: Run tests**

Run: `cd api && .venv/bin/pytest tests/test_chat_stream.py -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add api/app/services/coach.py api/tests/test_chat_stream.py
git commit -m "feat(coach): mark sessions as is_onboarding when mode=onboarding"
```

---

## Task 11: Accept mode parameter in /chat/stream router

**Files:**
- Modify: `api/app/routers/chat.py`
- Modify: `api/tests/test_chat.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_chat.py`:

```python
def test_chat_stream_router_forwards_mode_parameter(monkeypatch):
    """The router must pass mode='onboarding' through to chat_stream when supplied."""
    from app.routers import chat as chat_router
    from fastapi.testclient import TestClient
    from app.main import app

    captured = {}

    async def fake_stream(user_id, session_id, message, persona="friend", mode="default"):
        captured["mode"] = mode
        captured["user_id"] = user_id
        yield {"type": "done"}

    monkeypatch.setattr(chat_router, "chat_stream", fake_stream)
    client = TestClient(app)
    resp = client.post(
        "/api/chat/stream",
        json={"message": "hei", "mode": "onboarding"},
        headers={"Authorization": "Bearer x"},
    )
    assert resp.status_code == 200
    assert captured["mode"] == "onboarding"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_chat.py::test_chat_stream_router_forwards_mode_parameter -v`
Expected: assertion fails (mode stays "default" because router doesn't forward it).

- [ ] **Step 3: Update the router**

Edit `api/app/routers/chat.py`. Replace `chat_stream_endpoint` body:

```python
@router.post("/chat/stream")
async def chat_stream_endpoint(request: Request, body: dict):
    user_id = get_current_user_id(request)
    session_id = body.get("session_id")
    message = body.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    persona = body.get("persona", "friend")
    mode = body.get("mode", "default")

    async def event_generator():
        try:
            async for event in chat_stream(
                user_id, session_id, message, persona=persona, mode=mode
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
```

- [ ] **Step 4: Run tests**

Run: `cd api && .venv/bin/pytest tests/test_chat.py -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/chat.py api/tests/test_chat.py
git commit -m "feat(api): accept mode field on /chat/stream"
```

---

## Task 12: Expose onboarding_status in /api/users/profile

**Files:**
- Modify: `api/app/routers/users.py`
- Modify: `api/tests/test_users_router.py`

- [ ] **Step 1: Write the failing test**

Append to `api/tests/test_users_router.py` (read existing patterns first to align):

```python
def test_get_profile_includes_onboarding_status(monkeypatch, mock_conn, make_mock_get_conn):
    from fastapi.testclient import TestClient
    from app.main import app

    cur = AsyncMock()
    # Add onboarding_status as the LAST column in the SELECT result tuple.
    cur.fetchone = AsyncMock(return_value=(
        TEST_USER_ID, "t@x.no", "T", "V", ["build_muscle"], "beginner", 3,
        "male", None, 180, 80, None, "no", "friend",
        None, None, None, None, "in_progress",
    ))
    cur.fetchall = AsyncMock(return_value=[])
    mock_conn.execute = AsyncMock(return_value=cur)
    monkeypatch.setattr("app.routers.users.get_conn", make_mock_get_conn(mock_conn))

    client = TestClient(app)
    resp = client.get("/api/users/profile", headers={"Authorization": "Bearer x"})
    assert resp.status_code == 200
    assert resp.json()["onboarding_status"] == "in_progress"
```

Make sure `TEST_USER_ID` is imported (it's in conftest, may need direct import) and `AsyncMock` is imported.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd api && .venv/bin/pytest tests/test_users_router.py::test_get_profile_includes_onboarding_status -v`
Expected: fail — response does not contain `onboarding_status`.

- [ ] **Step 3: Update get_user_profile**

In `api/app/routers/users.py`, change the SELECT in `get_user_profile`:

```python
            """
            SELECT id, email, first_name, last_name, goals, experience_level,
                   training_days_per_week, gender, birth_date, height_cm,
                   weight_kg, avatar_url, locale, persona_mode,
                   activity_level, years_training,
                   preferred_training_time, max_session_duration_min,
                   onboarding_status
            FROM users WHERE id = %s
            """,
```

And in the returned dict, add:

```python
        "onboarding_status": row[18],
```

(After `"max_session_duration_min": row[17],` and before `"injuries": [...]`.)

- [ ] **Step 4: Run tests**

Run: `cd api && .venv/bin/pytest tests/test_users_router.py -v`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add api/app/routers/users.py api/tests/test_users_router.py
git commit -m "feat(users): include onboarding_status in profile response"
```

---

## Task 13: Frontend coach-stream — support quick_replies and mode

**Files:**
- Modify: `web/src/lib/coach-stream.ts`
- Modify: `web/src/lib/coach-stream.test.ts`

- [ ] **Step 1: Write the failing test**

Read existing patterns in `web/src/lib/coach-stream.test.ts`. Append:

```typescript
import { describe, it, expect, vi } from "vitest"
import { chatStream } from "./coach-stream"

describe("chatStream — quick_replies event", () => {
  it("yields quick_replies event objects", async () => {
    const encoder = new TextEncoder()
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"type":"quick_replies","options":["Ja","Nei"]}\n\n' +
            'data: {"type":"done"}\n\n'
          )
        )
        controller.close()
      },
    })
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, body, status: 200 }))

    const events = []
    for await (const ev of chatStream("token", null, "hi")) {
      events.push(ev)
    }
    expect(events[0]).toEqual({ type: "quick_replies", options: ["Ja", "Nei"] })
    expect(events[1]).toEqual({ type: "done" })
  })

  it("forwards mode parameter in body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode('data: {"type":"done"}\n\n'))
          c.close()
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    for await (const _ of chatStream("token", null, "hi", "onboarding")) {
      // drain
    }
    const callArgs = fetchMock.mock.calls[0]
    const body = JSON.parse(callArgs[1].body)
    expect(body.mode).toBe("onboarding")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- coach-stream.test.ts`
Expected: TypeScript error or test fails — `quick_replies` not in `StreamEvent`, and `mode` arg not accepted.

- [ ] **Step 3: Update coach-stream.ts**

Replace contents of `web/src/lib/coach-stream.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export type StreamEvent =
  | { type: "session_id"; id: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_use"; tool_use_id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; name: string; ok: boolean }
  | { type: "quick_replies"; options: string[] }
  | { type: "done" }
  | { type: "error"; message: string }

export async function* chatStream(
  token: string,
  sessionId: string | null,
  message: string,
  mode: "default" | "onboarding" = "default"
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, message, mode }),
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

- [ ] **Step 4: Run tests**

Run: `cd web && npm run test -- coach-stream.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/coach-stream.ts web/src/lib/coach-stream.test.ts
git commit -m "feat(web): add quick_replies event and mode arg to chatStream"
```

---

## Task 14: QuickReplies component

**Files:**
- Create: `web/src/components/chat/QuickReplies.tsx`
- Create: `web/src/components/chat/QuickReplies.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/components/chat/QuickReplies.test.tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import QuickReplies from "./QuickReplies"

describe("QuickReplies", () => {
  it("renders one button per option", () => {
    render(<QuickReplies options={["Ja", "Nei", "Kanskje"]} onSelect={() => {}} />)
    expect(screen.getByRole("button", { name: "Ja" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nei" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Kanskje" })).toBeInTheDocument()
  })

  it("calls onSelect with the clicked option", () => {
    const onSelect = vi.fn()
    render(<QuickReplies options={["Ja", "Nei"]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("button", { name: "Nei" }))
    expect(onSelect).toHaveBeenCalledWith("Nei")
  })

  it("disables all buttons when disabled=true", () => {
    render(<QuickReplies options={["A", "B"]} onSelect={() => {}} disabled />)
    expect(screen.getByRole("button", { name: "A" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "B" })).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- QuickReplies.test.tsx`
Expected: file does not exist.

- [ ] **Step 3: Create the component**

```tsx
// web/src/components/chat/QuickReplies.tsx
"use client"

interface Props {
  options: string[]
  onSelect: (option: string) => void
  disabled?: boolean
}

export default function QuickReplies({ options, onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-2 ml-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `cd web && npm run test -- QuickReplies.test.tsx`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/chat/QuickReplies.tsx web/src/components/chat/QuickReplies.test.tsx
git commit -m "feat(web): add QuickReplies button-row component"
```

---

## Task 15: /signup route — account creation only

**Files:**
- Create: `web/src/app/signup/page.tsx`

- [ ] **Step 1: Create the signup page**

```tsx
// web/src/app/signup/page.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message)
      return
    }
    router.push("/onboarding")
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-6"
      style={{ background: "#0d0d0d" }}
    >
      <form onSubmit={handleSignUp} className="w-full max-w-sm flex flex-col gap-3">
        <h1 className="text-white text-2xl font-bold mb-2">Opprett konto</h1>
        <input
          type="text"
          placeholder="Fornavn"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          autoFocus
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
        <input
          type="text"
          placeholder="Etternavn"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
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
          placeholder="Passord (min 6 tegn)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="rounded-xl px-4 py-3 text-sm text-white placeholder-[#555] outline-none"
          style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
        />
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
          style={{ background: "var(--ai-accent, #ff6b35)" }}
        >
          {loading ? "Oppretter konto..." : "Opprett konto"}
        </button>
        <a href="/login" className="text-sm text-center mt-2" style={{ color: "#888" }}>
          Har du allerede konto? Logg inn
        </a>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify the page renders locally**

Run: `cd web && npm run dev` (in background or another terminal)
Open: http://localhost:3000/signup
Expected: form with first name, last name, email, password fields.

(If a route conflict appears with the middleware redirecting authenticated users away, that's expected — log out first.)

- [ ] **Step 3: Commit**

```bash
git add web/src/app/signup/page.tsx
git commit -m "feat(web): add /signup route for account creation"
```

---

## Task 16: OnboardingClient — chat-based onboarding UI

**Files:**
- Create: `web/src/app/onboarding/OnboardingClient.tsx`
- Create: `web/src/app/onboarding/OnboardingClient.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// web/src/app/onboarding/OnboardingClient.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import OnboardingClient from "./OnboardingClient"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("@/lib/coach-stream", () => ({
  chatStream: vi.fn(),
}))

const { chatStream } = await import("@/lib/coach-stream")

async function* fakeStream(events: unknown[]) {
  for (const ev of events) yield ev
}

describe("OnboardingClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("auto-sends an initial 'hei' message on mount", async () => {
    ;(chatStream as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeStream([
        { type: "text_delta", text: "Hei Trym!" },
        { type: "done" },
      ])
    )
    render(<OnboardingClient accessToken="tok" firstName="Trym" />)
    await waitFor(() => {
      expect(chatStream).toHaveBeenCalled()
    })
    const args = (chatStream as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(args[3]).toBe("onboarding") // mode parameter
  })

  it("renders quick-reply buttons when quick_replies event arrives", async () => {
    ;(chatStream as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeStream([
        { type: "text_delta", text: "Hva er målet ditt?" },
        { type: "quick_replies", options: ["Bygg muskler", "Bli sterkere"] },
        { type: "done" },
      ])
    )
    render(<OnboardingClient accessToken="tok" firstName="Trym" />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bygg muskler" })).toBeInTheDocument()
    })
  })

  it("sends quick-reply text as user message when clicked", async () => {
    let callIdx = 0
    ;(chatStream as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callIdx += 1
      if (callIdx === 1) {
        return fakeStream([
          { type: "text_delta", text: "Hva er målet?" },
          { type: "quick_replies", options: ["Bygg muskler"] },
          { type: "done" },
        ])
      }
      return fakeStream([{ type: "text_delta", text: "Bra!" }, { type: "done" }])
    })
    render(<OnboardingClient accessToken="tok" firstName="Trym" />)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Bygg muskler" })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole("button", { name: "Bygg muskler" }))
    await waitFor(() => {
      expect((chatStream as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2)
    })
    const secondCall = (chatStream as ReturnType<typeof vi.fn>).mock.calls[1]
    expect(secondCall[2]).toBe("Bygg muskler")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npm run test -- OnboardingClient.test.tsx`
Expected: file does not exist.

- [ ] **Step 3: Create the component**

```tsx
// web/src/app/onboarding/OnboardingClient.tsx
"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { chatStream, type StreamEvent } from "@/lib/coach-stream"
import MessageBubble from "@/components/chat/MessageBubble"
import ThinkingDots from "@/components/chat/ThinkingDots"
import QuickReplies from "@/components/chat/QuickReplies"

interface Msg {
  id: string
  role: "user" | "assistant"
  text: string
  quickReplies?: string[]
}

interface Props {
  accessToken: string
  firstName: string
}

export default function OnboardingClient({ accessToken, firstName }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [firstByteSeen, setFirstByteSeen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const startedRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  const send = async (text: string) => {
    if (!text.trim() || isStreaming) return
    setInput("")
    setIsStreaming(true)
    setFirstByteSeen(false)

    const userId = `local-user-${Date.now()}`
    setMessages((m) => [
      ...m,
      ...(text === "__start__" ? [] : [{ id: userId, role: "user" as const, text }]),
    ])

    let assistantId: string | null = null
    let pendingQR: string[] | null = null

    try {
      for await (const ev of chatStream(
        accessToken,
        sessionId,
        text === "__start__" ? `Hei! Jeg er klar.` : text,
        "onboarding"
      ) as AsyncGenerator<StreamEvent>) {
        setFirstByteSeen(true)
        if (ev.type === "session_id") {
          setSessionId(ev.id)
        } else if (ev.type === "text_delta") {
          if (assistantId === null) {
            assistantId = `local-asst-${Date.now()}`
            const id = assistantId
            setMessages((m) => [...m, { id, role: "assistant", text: ev.text }])
          } else {
            const id = assistantId
            setMessages((m) =>
              m.map((msg) => (msg.id === id ? { ...msg, text: msg.text + ev.text } : msg))
            )
          }
        } else if (ev.type === "quick_replies") {
          pendingQR = ev.options
        } else if (ev.type === "tool_result") {
          if (ev.name === "complete_onboarding" && ev.ok) {
            setCompleted(true)
          }
        }
      }
      if (pendingQR && assistantId !== null) {
        const id = assistantId
        const qr = pendingQR
        setMessages((m) =>
          m.map((msg) => (msg.id === id ? { ...msg, quickReplies: qr } : msg))
        )
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: `Tilkoblingsfeil: ${(e as Error).message}`,
        },
      ])
    } finally {
      setIsStreaming(false)
      setFirstByteSeen(false)
      if (completed) {
        router.push("/home")
      }
    }
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    send("__start__")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (completed && !isStreaming) {
      router.push("/home")
    }
  }, [completed, isStreaming, router])

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h1 className="text-white text-lg font-semibold">Bli kjent</h1>
        <span className="text-xs" style={{ color: "#888" }}>Hei, {firstName}</span>
      </header>

      <div className="flex flex-col gap-2 px-4 py-4 overflow-y-auto flex-1">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col">
            <MessageBubble message={{ role: m.role, content: m.text }} />
            {m.quickReplies && (
              <QuickReplies
                options={m.quickReplies}
                onSelect={(opt) => send(opt)}
                disabled={isStreaming}
              />
            )}
          </div>
        ))}
        {isStreaming && !firstByteSeen && <ThinkingDots />}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-neutral-800 p-3 flex items-end gap-2">
        <textarea
          className="flex-1 bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 resize-none min-h-[44px] max-h-[120px]"
          placeholder="Skriv et svar..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          disabled={isStreaming}
          rows={1}
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={isStreaming || input.trim().length === 0}
          className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
        >
          Send
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `cd web && npm run test -- OnboardingClient.test.tsx`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add web/src/app/onboarding/OnboardingClient.tsx web/src/app/onboarding/OnboardingClient.test.tsx
git commit -m "feat(web): add OnboardingClient chat component"
```

---

## Task 17: Rewrite /onboarding/page.tsx as server wrapper around OnboardingClient

**Files:**
- Modify: `web/src/app/onboarding/page.tsx`

- [ ] **Step 1: Replace the file**

Overwrite `web/src/app/onboarding/page.tsx`:

```tsx
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import OnboardingClient from "./OnboardingClient"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const accessToken = session.access_token

  // Fetch first_name from backend for greeting personalisation.
  let firstName = ""
  try {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (res.ok) {
      const body = await res.json()
      if (body.onboarding_status === "complete") redirect("/home")
      firstName = body.first_name ?? ""
    }
  } catch {
    // If profile fetch fails (e.g. row doesn't exist yet), fall back to user metadata.
    firstName = (user.user_metadata?.first_name as string) ?? ""
  }

  return <OnboardingClient accessToken={accessToken} firstName={firstName || "der"} />
}
```

- [ ] **Step 2: Verify locally**

Run: `cd web && npm run dev` (if not already running)
Sign up via `/signup`, get redirected to `/onboarding`.
Expected: chat UI loads, coach greets within ~2 seconds with personalised first name.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/onboarding/page.tsx
git commit -m "feat(web): replace onboarding wizard with chat-based flow"
```

---

## Task 18: Middleware — redirect users with non-complete onboarding

**Files:**
- Modify: `web/src/middleware.ts`

- [ ] **Step 1: Update middleware**

Replace `web/src/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// Authenticated users on these paths are redirected to /home.
const REDIRECT_WHEN_AUTHED = ["/login", "/register", "/signup"]

// Paths reachable without auth, OR (for /onboarding) reachable mid-flow.
const PUBLIC_PATHS = [...REDIRECT_WHEN_AUTHED, "/onboarding"]

// Don't run onboarding-status check for these (they're already public or the onboarding page itself).
const SKIP_ONBOARDING_CHECK = ["/onboarding", "/login", "/register", "/signup"]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })

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
  const isRedirectWhenAuthed = REDIRECT_WHEN_AUTHED.some((p) => pathname.startsWith(p))
  const skipOnboardingCheck = SKIP_ONBOARDING_CHECK.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (user && isRedirectWhenAuthed) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  if (user && !skipOnboardingCheck) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      try {
        const res = await fetch(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        })
        if (res.ok) {
          const body = await res.json()
          if (body.onboarding_status && body.onboarding_status !== "complete") {
            return NextResponse.redirect(new URL("/onboarding", request.url))
          }
        } else if (res.status === 404) {
          // Profile row doesn't exist yet — send them to onboarding.
          return NextResponse.redirect(new URL("/onboarding", request.url))
        }
      } catch {
        // If the API is down, don't block — let the page handle it.
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

- [ ] **Step 2: Verify locally**

Run: `cd web && npm run dev` (if not already running)
- Log in as a user with `onboarding_status='in_progress'` → should land on `/onboarding`.
- Try to navigate to `/home` directly → middleware should redirect back to `/onboarding`.
- After coach calls `complete_onboarding`, refresh `/onboarding` page → should redirect to `/home`.

- [ ] **Step 3: Commit**

```bash
git add web/src/middleware.ts
git commit -m "feat(web): middleware blocks app routes until onboarding complete"
```

---

## Task 19: End-to-end smoke test (manual)

**Files:** none — manual verification.

- [ ] **Step 1: Make sure backend and frontend are running**

```bash
cd api && .venv/bin/uvicorn app.main:app --reload --port 8000 &
cd web && npm run dev
```

- [ ] **Step 2: Run through the full onboarding flow**

1. Open `http://localhost:3000/signup`. Create a new user with a fresh email.
2. After signup, you should be redirected to `/onboarding`.
3. The coach should greet you within ~2 seconds, addressing you by first name.
4. Coach asks question 1 (goals) with quick-reply buttons.
5. Tap a quick-reply. The button's text appears as your user message.
6. Coach acknowledges and asks question 2. Continue through all 8 fields.
7. After the 8th field, coach calls `complete_onboarding`. You should be redirected to `/home`.

- [ ] **Step 3: Verify DB state**

```bash
psql "$DATABASE_URL" -c "SELECT id, first_name, goals, experience_level, training_days_per_week, weight_kg, height_cm, birth_date, gender, onboarding_status FROM users WHERE email = 'YOUR_TEST_EMAIL';"
```

Expected: all 8 fields populated, `onboarding_status = 'complete'`.

```bash
psql "$DATABASE_URL" -c "SELECT equipment FROM user_equipment WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_TEST_EMAIL');"
```

Expected: 1+ equipment rows.

```bash
psql "$DATABASE_URL" -c "SELECT id, is_onboarding FROM coach_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_TEST_EMAIL');"
```

Expected: at least one session with `is_onboarding = true`.

- [ ] **Step 4: Verify Profile-tab shows the values**

Navigate to `/profile`. All 8 fields should display the saved values.

- [ ] **Step 5: Verify Coach-tab shows the onboarding session**

Navigate to `/coach`. Open session history. The onboarding conversation should appear as the earliest session.

- [ ] **Step 6: Verify middleware blocks /home before completion**

Sign up another fresh user, but stop mid-onboarding (e.g. after 2 quick-replies). Navigate to `/home`. You should be redirected back to `/onboarding`.

- [ ] **Step 7: Run full test suites and lint**

```bash
make check
```

Expected: all checks pass.

- [ ] **Step 8: Commit anything cleanup-related from smoke test (if needed)**

If you found and fixed a bug during smoke testing, commit it now with a clear message.

---

## Task 20: Final cleanup commit

**Files:** none unless you accumulated work-in-progress.

- [ ] **Step 1: Verify nothing is left uncommitted**

```bash
git status
```

Expected: clean working tree.

- [ ] **Step 2: Push branch (if working on a feature branch)**

```bash
git push -u origin HEAD
```

- [ ] **Step 3: Open PR**

```bash
gh pr create --title "feat: conversational onboarding redesign" --body "$(cat <<'EOF'
## Summary
- Replace 11-step onboarding wizard with chat-based flow led by the coach
- 8 profile fields (4 Tier 1 required + 4 Tier 2 recommended) collected via quick-reply buttons and free text
- New SSE event `quick_replies` driven by new `set_quick_replies` tool
- Migration 009: `users.onboarding_status` + `coach_sessions.is_onboarding`
- New `/signup` route, new `OnboardingClient`, new `QuickReplies` component
- Middleware redirects users with non-complete onboarding back to `/onboarding`

## Test plan
- [ ] `make check` passes
- [ ] Manual: signup → onboarding → all 8 fields collected → redirected to /home
- [ ] Manual: middleware blocks /home before completion
- [ ] Manual: Profile tab shows all 8 saved values
- [ ] Manual: Coach tab history includes the onboarding session

Spec: docs/superpowers/specs/2026-05-28-onboarding-redesign-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
