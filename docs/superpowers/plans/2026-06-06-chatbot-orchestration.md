# Chatbot orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor coach to use real `user_id` from request (fix `TEST_USER_ID`-hardcoding), split `handlers.py` into domain files, and add 30 new tools so coach has full CRUD over programs, folders, workouts, profile, injuries, equipment, preferences, constraints, plus share_workout.

**Architecture:** New `dispatcher.py` routes `handle_tool(user_id, name, input)` to domain-specific handler modules under `api/app/tools/handlers/`. `result_links.py` builds tappable links per tool. Confirm-flow for destructive actions handled via prompt instruction only. Frontend extends `tool_result` stream event with optional `result_link` and renders Norwegian pill labels.

**Tech Stack:** FastAPI + psycopg-async, Anthropic Claude SDK, Next.js 16 App Router + TypeScript, Vitest + React Testing Library, pytest.

**Spec:** [`docs/superpowers/specs/2026-06-06-chatbot-orchestration-design.md`](../specs/2026-06-06-chatbot-orchestration-design.md)

---

## Conventions used in this plan

**Handler signature (all 42 handlers follow this):**

```python
async def x_tool(user_id: str, **kwargs) -> dict:
    """Returns either:
      { "ok": True, ...data, "_link": {...} }  on success
      { "ok": False, "error": "..." }          on failure
    """
```

**Ownership check pattern (every write/delete handler starts with this):**

```python
cur = await conn.execute(
    "SELECT id FROM {table} WHERE id = %s AND user_id = %s",
    (entity_id, user_id),
)
if await cur.fetchone() is None:
    return {"ok": False, "error": "Not found"}
```

For nested entities (program_days, program_exercises) the ownership check joins through `programs` table.

**Test pattern (every handler test follows this):**

```python
@pytest.mark.asyncio
async def test_<tool>_<scenario>(make_mock_get_conn):
    # Build cursors for each conn.execute call the handler will make
    cur1 = AsyncMock()
    cur1.fetchone = AsyncMock(return_value=(...))  # ownership check
    cur2 = AsyncMock()
    cur2.fetchone = AsyncMock(return_value=(...))  # actual mutation result
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur1, cur2])

    with patch("app.tools.handlers.<domain>_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "<tool_name>", {...args})

    assert result["ok"] is True
    assert result[...] == expected
```

---

## Phase 1: Foundation refactor

### Task 1: Create dispatcher + result_links scaffolding, propagate user_id

**Files:**
- Create: `api/app/tools/dispatcher.py`
- Create: `api/app/tools/result_links.py`
- Modify: `api/app/services/coach.py` (replace `TEST_USER_ID`, propagate `user_id` to `handle_tool`, attach `result_link` to stream event)
- Modify: `api/app/routers/chat.py` (pass `user_id` to `chat_stream`)

The dispatcher initially just routes to the EXISTING `app.tools.handlers.handle_tool` (kept temporarily). Real handler split happens in Task 2.

- [ ] **Step 1: Create dispatcher.py**

Create `api/app/tools/dispatcher.py`:

```python
"""Routes tool calls from the coach to the correct handler.

In Task 2, this file is updated to import from the split handler modules
under `app.tools.handlers.*_handlers`. For now it delegates to the
monolithic `handlers` module to preserve behavior during refactor.
"""
from app.tools import handlers as _legacy_handlers


async def handle_tool(user_id: str, name: str, tool_input: dict) -> dict:
    """Route a tool call. Returns dict with 'ok' field plus tool-specific data.

    On unknown tool: {"ok": False, "error": "Unknown tool: ..."}.
    On handler exception: {"ok": False, "error": str(e)}.
    """
    try:
        # Legacy entry point expects (name, tool_input) and ignores user_id internally.
        # Task 2 replaces this with explicit handler lookups that pass user_id.
        result = await _legacy_handlers.handle_tool(name, tool_input)
    except Exception as e:
        return {"ok": False, "error": str(e)}

    # Normalize: legacy handlers return either a dict with data, or {"error": ...}.
    # We standardize on {"ok": bool, ...rest}.
    if isinstance(result, dict) and "error" in result:
        return {"ok": False, **result}
    if isinstance(result, dict):
        return {"ok": True, **result}
    return {"ok": True, "data": result}
```

- [ ] **Step 2: Create result_links.py**

Create `api/app/tools/result_links.py`:

```python
"""Builds tappable result-link dicts attached to tool_result stream events.

Only tools that produce a navigable entity (program, workout) get a link.
Other tools return None.
"""


def build(tool_name: str, handler_output: dict) -> dict | None:
    if not handler_output.get("ok"):
        return None

    if tool_name == "create_program":
        pid = handler_output.get("program_id")
        name = handler_output.get("name") or "program"
        if pid:
            return {"label": f"Se {name}", "href": f"/program/{pid}"}

    if tool_name == "start_workout_from_day":
        wid = handler_output.get("workout_id")
        if wid:
            return {"label": "Åpne", "href": f"/program/workout/{wid}"}

    if tool_name == "log_workout":
        wid = handler_output.get("workout_id")
        if wid:
            return {"label": "Se økt", "href": f"/program/workout/{wid}"}

    if tool_name == "share_workout":
        return {"label": "Se feed", "href": "/social"}

    return None
```

- [ ] **Step 3: Update coach.py to use user_id and dispatcher**

In `api/app/services/coach.py`:

Find and remove line 7: `from app.constants import TEST_USER_ID`.
Find and remove line 4: `from app.tools.handlers import handle_tool`.

Add:

```python
from app.tools.dispatcher import handle_tool
from app.tools import result_links
```

Find this function signature (around line 50):

```python
async def chat(messages: list[dict], persona: str = "friend") -> str:
    base_ctx = await build_base_context(TEST_USER_ID)
```

Replace with:

```python
async def chat(user_id: str, messages: list[dict], persona: str = "friend") -> str:
    base_ctx = await build_base_context(user_id)
```

Find this call (around line 87):

```python
result = await handle_tool(block.name, block.input)
```

Replace with:

```python
result = await handle_tool(user_id, block.name, block.input)
```

Find this call inside `chat_stream` (around line 242):

```python
try:
    result = await handle_tool(tu["name"], tu["input"])
    ok = not (isinstance(result, dict) and "error" in result)
except Exception as e:
    result = {"error": str(e)}
    ok = False
```

Replace with:

```python
result = await handle_tool(user_id, tu["name"], tu["input"])
ok = bool(result.get("ok"))
link = result_links.build(tu["name"], result)
```

And find the subsequent yield:

```python
yield {
    "type": "tool_result",
    "tool_use_id": tu["id"],
    "name": tu["name"],
    "ok": ok,
}
```

Replace with:

```python
event = {
    "type": "tool_result",
    "tool_use_id": tu["id"],
    "name": tu["name"],
    "ok": ok,
}
if link is not None:
    event["result_link"] = link
yield event
```

- [ ] **Step 4: Update chat.py router to pass user_id**

Find any call to `chat_stream(` in `api/app/routers/chat.py`. The current call probably looks like:

```python
chat_stream(session_id, user_message, persona)
```

Replace with:

```python
chat_stream(user_id, session_id, user_message, persona)
```

(`user_id` is obtained via `get_current_user_id(request)` earlier in the endpoint.)

Same for any `chat(` call: prefix with `user_id`.

- [ ] **Step 5: Run backend test suite**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest -v
```

Expected: most tests pass. Tests that fail are typically:
- Tests that mock `app.tools.handlers.handle_tool` directly — these need to switch to mocking `app.tools.dispatcher.handle_tool`.
- Tests that call `chat_stream(session_id, message, persona)` without user_id — these need to add user_id.

For each failing test, update the mock/call to use the new dispatcher path and user_id parameter. Re-run.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/dispatcher.py api/app/tools/result_links.py api/app/services/coach.py api/app/routers/chat.py api/tests/
git commit -m "refactor(api): introduce tool dispatcher and propagate user_id through coach"
```

## Context for Task 1

- Project root: `/Users/trymvestengen/Desktop/ai-coach`
- The dispatcher is intentionally a thin pass-through to the existing `handlers.handle_tool`. The split happens in Task 2 so we can verify behavior is unchanged at each step.
- `result_links.py` is consulted ONLY by the streaming chat path. The non-streaming `chat()` function returns text and doesn't emit links.
- Branch: `feat/onboarding-redesign`.

---

### Task 2: Split handlers.py into domain modules

**Files:**
- Create: `api/app/tools/handlers/__init__.py`
- Create: `api/app/tools/handlers/program_handlers.py`
- Create: `api/app/tools/handlers/workout_handlers.py`
- Create: `api/app/tools/handlers/read_handlers.py`
- Create: `api/app/tools/handlers/memory_handlers.py` (move from `api/app/tools/memory_handlers.py`)
- Modify: `api/app/tools/dispatcher.py` (replace legacy delegation with explicit HANDLERS dict)
- Delete: `api/app/tools/handlers.py`
- Delete: `api/app/tools/memory_handlers.py`

This task ONLY moves existing handlers into domain files and updates the dispatcher to call them with `user_id` explicit. NO new tools yet.

- [ ] **Step 1: Create `api/app/tools/handlers/` package**

Create `api/app/tools/handlers/__init__.py` (empty — modules are imported directly by dispatcher).

- [ ] **Step 2: Create program_handlers.py with existing program tools**

Create `api/app/tools/handlers/program_handlers.py` and copy these handlers from the old `handlers.py`:
- `create_program(user_id, name, days)` — refactored: removes the line `UPDATE programs SET is_active = false` and the line `is_active=true` in INSERT. Programs no longer auto-activate. Returns `{"ok": True, "program_id": ..., "name": ..., "days_count": ...}`.

Full implementation:

```python
"""Tools that read/write user's programs, days, and exercises."""
import uuid
from app.db import get_conn


async def create_program(user_id: str, name: str, days: list) -> dict:
    """Create a new program with days and exercises. Does NOT auto-activate.
    Use update_program with is_active=True to activate."""
    program_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO programs (id, user_id, name, is_active) "
                "VALUES (%s, %s, %s, false)",
                (program_id, user_id, name),
            )
            for i, day in enumerate(days, start=1):
                day_id = str(uuid.uuid4())
                await conn.execute(
                    "INSERT INTO program_days (id, program_id, day_number, name) "
                    "VALUES (%s, %s, %s, %s)",
                    (day_id, program_id, i, day["name"]),
                )
                for j, ex in enumerate(day.get("exercises", [])):
                    await conn.execute(
                        "INSERT INTO program_exercises "
                        "(program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                        "VALUES (%s, %s, %s, %s, %s, %s)",
                        (day_id, ex["exercise_id"], ex["sets"], ex["reps"], ex.get("weight_kg"), j),
                    )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": f"Failed to create program: {e}"}
    return {"ok": True, "program_id": program_id, "name": name, "days_count": len(days)}
```

- [ ] **Step 3: Create workout_handlers.py with existing workout tools**

Create `api/app/tools/handlers/workout_handlers.py` and copy these handlers from old `handlers.py`:
- `log_workout(user_id, exercises, notes=None, rpe=None, coach_summary=None)`
- `log_set_with_note(user_id, workout_id, exercise_id, set_number, reps=None, weight_kg=None, rpe=None, coach_note=None)`

Use the existing code from `handlers.py:75-130` and the existing `log_set_with_note` code. Replace `TEST_USER_ID` with `user_id` parameter. Wrap return values with `{"ok": True, ...}` on success.

- [ ] **Step 4: Create read_handlers.py with existing read-only tools**

Create `api/app/tools/handlers/read_handlers.py` and copy these handlers:
- `get_exercise_info(user_id, exercise_id)` — unchanged logic, doesn't need user_id but accepts it for uniform signature
- `search_exercises(user_id, muscle_group=None, equipment=None, difficulty=None)` — same
- `get_user_history(user_id, limit=5)` — replaces `TEST_USER_ID` with `user_id`
- `suggest_progression(user_id, exercise_id)` — replaces `TEST_USER_ID`
- `get_progression(user_id, exercise_id, weeks=12)` — replaces `TEST_USER_ID`
- `get_workout_history(user_id, exercise_id=None, limit=10)` — replaces `TEST_USER_ID`

Note: `get_exercise_info` and `search_exercises` work on a JSON file and don't query the DB. They accept `user_id` but ignore it.

All handlers wrap success return in `{"ok": True, "data": ...}` or merge with `{"ok": True}`.

- [ ] **Step 5: Move memory_handlers.py into the new package**

```bash
mv api/app/tools/memory_handlers.py api/app/tools/handlers/memory_handlers.py
```

Edit the moved file: replace all `TEST_USER_ID` references with the `user_id` parameter that should be added to each function signature. Verify:
- `get_user_profile(user_id)`
- `write_observation(user_id, category, observation, confidence="medium", related_workout_id=None)`
- `search_observations(user_id, category=None, days=90, limit=20)`
- `get_recent_sessions(user_id, days=30, limit=10)`

Update import paths if necessary.

- [ ] **Step 6: Replace dispatcher.py with explicit HANDLERS dict**

Replace `api/app/tools/dispatcher.py` with:

```python
"""Routes tool calls from the coach to the correct handler."""
from app.tools.handlers import (
    program_handlers,
    workout_handlers,
    read_handlers,
    memory_handlers,
)


HANDLERS = {
    # Programs (write)
    "create_program": program_handlers.create_program,
    # Workouts (write)
    "log_workout": workout_handlers.log_workout,
    "log_set_with_note": workout_handlers.log_set_with_note,
    # Read-only
    "get_exercise_info": read_handlers.get_exercise_info,
    "search_exercises": read_handlers.search_exercises,
    "get_user_history": read_handlers.get_user_history,
    "suggest_progression": read_handlers.suggest_progression,
    "get_progression": read_handlers.get_progression,
    "get_workout_history": read_handlers.get_workout_history,
    # Memory (read + write)
    "get_user_profile": memory_handlers.get_user_profile,
    "write_observation": memory_handlers.write_observation,
    "search_observations": memory_handlers.search_observations,
    "get_recent_sessions": memory_handlers.get_recent_sessions,
}


async def handle_tool(user_id: str, name: str, tool_input: dict) -> dict:
    handler = HANDLERS.get(name)
    if handler is None:
        return {"ok": False, "error": f"Unknown tool: {name}"}
    try:
        return await handler(user_id, **tool_input)
    except TypeError as e:
        return {"ok": False, "error": f"Invalid arguments: {e}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
```

- [ ] **Step 7: Delete old handlers.py**

```bash
rm api/app/tools/handlers.py
```

- [ ] **Step 8: Update tests to import from new modules**

Find all references in `api/tests/` to `app.tools.handlers` (the module, not the package). Replace:

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
grep -rn "app.tools.handlers\b\|app.tools.memory_handlers" tests/
```

For each match in `tests/test_tools.py`, `tests/test_create_program_tool.py`, etc., update imports/patches to either:
- `app.tools.dispatcher.handle_tool` for routing tests
- `app.tools.handlers.<domain>_handlers.<func>` for direct calls (rare — most tests go through dispatcher)
- `app.tools.handlers.memory_handlers` instead of `app.tools.memory_handlers`

If a test mocks `app.tools.handlers.get_conn` to control DB behavior, change to `app.tools.handlers.program_handlers.get_conn` (or whichever domain module owns the tool under test).

- [ ] **Step 9: Run full backend test suite**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest -v
```

Expected: all PASS. If any fail with `AttributeError: module 'app.tools.handlers' has no attribute 'X'`, fix the import.

- [ ] **Step 10: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/ api/tests/
git commit -m "refactor(api): split handlers.py into domain modules (program/workout/read/memory)"
```

## Context for Task 2

- Project root: `/Users/trymvestengen/Desktop/ai-coach`
- This is pure reorganization. No new behavior — the 14 existing tools must work identically afterward.
- The `create_program` tool gets one behavior change: it no longer auto-sets `is_active=true`. The spec explicitly notes this change.
- Branch: `feat/onboarding-redesign`.

---

## Phase 2: Program CRUD (9 new tools)

Each task follows the same pattern: add tool to `definitions.py`, add handler in `program_handlers.py`, register in dispatcher, write tests. Show all SQL explicitly so the engineer doesn't need to guess.

### Task 3: update_program + delete_program

**Files:**
- Modify: `api/app/tools/definitions.py` (append definitions)
- Modify: `api/app/tools/handlers/program_handlers.py` (append handlers)
- Modify: `api/app/tools/dispatcher.py` (register handlers)
- Create: `api/tests/test_tools_program.py`

- [ ] **Step 1: Append tool definitions**

Append to `api/app/tools/definitions.py` inside `TOOL_DEFINITIONS` list:

```python
    {
        "name": "update_program",
        "description": "Update an existing program. Can change name, set active, or move to a folder. Use is_active=true to activate a program (this deactivates any other active program).",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Program ID to update."},
                "name": {"type": "string", "description": "Optional new name."},
                "is_active": {"type": "boolean", "description": "Optional. Set true to make this the active program."},
                "folder_id": {"type": ["string", "null"], "description": "Optional. Folder UUID to move into, or null to move to root."},
            },
            "required": ["program_id"],
        },
    },
    {
        "name": "delete_program",
        "description": "Permanently delete a program. CONFIRM-PLIKTIG — see CONFIRM-REGEL in your system prompt before calling.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string", "description": "Program ID to delete."},
            },
            "required": ["program_id"],
        },
    },
```

- [ ] **Step 2: Append handlers**

Append to `api/app/tools/handlers/program_handlers.py`:

```python
async def update_program(
    user_id: str,
    program_id: str,
    name: str | None = None,
    is_active: bool | None = None,
    folder_id: str | None = ...,  # sentinel
) -> dict:
    """Update program fields. If is_active=True, deactivates other programs first."""
    # folder_id sentinel handling: caller passes None to move to root; absent → leave unchanged.
    # Python kwargs can't distinguish absent vs None, so we use ... as the "absent" sentinel.
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Program not found"}

            if is_active is True:
                await conn.execute(
                    "UPDATE programs SET is_active = false WHERE user_id = %s AND id <> %s",
                    (user_id, program_id),
                )

            updates: list[str] = []
            params: list = []
            if name is not None:
                updates.append("name = %s")
                params.append(name)
            if is_active is not None:
                updates.append("is_active = %s")
                params.append(is_active)
            if folder_id is not ...:
                updates.append("folder_id = %s")
                params.append(folder_id)

            if not updates:
                return {"ok": False, "error": "No fields to update"}

            params.extend([program_id, user_id])
            await conn.execute(
                f"UPDATE programs SET {', '.join(updates)} "
                "WHERE id = %s AND user_id = %s",
                params,
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "program_id": program_id}


async def delete_program(user_id: str, program_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM programs WHERE id = %s AND user_id = %s RETURNING id",
                (program_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                return {"ok": False, "error": "Program not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "program_id": program_id}
```

- [ ] **Step 3: Register in dispatcher**

In `api/app/tools/dispatcher.py`, add to `HANDLERS` dict:

```python
    "update_program": program_handlers.update_program,
    "delete_program": program_handlers.delete_program,
```

- [ ] **Step 4: Write tests**

Create `api/tests/test_tools_program.py`:

```python
import os
import uuid
import pytest
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://fake")
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.mark.asyncio
async def test_update_program_sets_name(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000010")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(prog_id,))
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_update])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_program", {
            "program_id": str(prog_id),
            "name": "Nytt navn",
        })

    assert result["ok"] is True


@pytest.mark.asyncio
async def test_update_program_activates_and_deactivates_others(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000011")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(prog_id,))
    cur_deact = AsyncMock()
    cur_update = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_deact, cur_update])

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_program", {
            "program_id": str(prog_id),
            "is_active": True,
        })

    assert result["ok"] is True
    # Verify deactivate-others SQL was called
    assert conn.execute.call_count == 3


@pytest.mark.asyncio
async def test_update_program_returns_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000012")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "update_program", {
            "program_id": str(prog_id), "name": "X",
        })

    assert result["ok"] is False
    assert "not found" in result["error"].lower()


@pytest.mark.asyncio
async def test_delete_program_succeeds(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000013")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=(prog_id,))
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "delete_program", {
            "program_id": str(prog_id),
        })

    assert result["ok"] is True


@pytest.mark.asyncio
async def test_delete_program_not_found(make_mock_get_conn):
    prog_id = uuid.UUID("aaaaaaaa-0000-0000-0000-000000000014")
    cur = AsyncMock()
    cur.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur)

    with patch("app.tools.handlers.program_handlers.get_conn", new=make_mock_get_conn(conn)):
        from app.tools.dispatcher import handle_tool
        result = await handle_tool(TEST_USER_ID, "delete_program", {
            "program_id": str(prog_id),
        })

    assert result["ok"] is False
```

- [ ] **Step 5: Run tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_tools_program.py -v
```
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/definitions.py api/app/tools/handlers/program_handlers.py api/app/tools/dispatcher.py api/tests/test_tools_program.py
git commit -m "feat(api): add update_program and delete_program tools"
```

---

### Task 4: add/remove/rename program day

**Files:**
- Modify: `api/app/tools/definitions.py`
- Modify: `api/app/tools/handlers/program_handlers.py`
- Modify: `api/app/tools/dispatcher.py`
- Modify: `api/tests/test_tools_program.py`

- [ ] **Step 1: Append tool definitions**

Append to `TOOL_DEFINITIONS`:

```python
    {
        "name": "add_program_day",
        "description": "Add a new training day to an existing program.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string"},
                "day_number": {"type": "integer", "description": "1=Monday, 2=Tuesday, ..., 7=Sunday."},
                "name": {"type": "string", "description": "Day name, e.g. 'Ben', 'Push'."},
            },
            "required": ["program_id", "day_number", "name"],
        },
    },
    {
        "name": "remove_program_day",
        "description": "Remove a training day from a program. CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string"},
                "day_id": {"type": "string"},
            },
            "required": ["program_id", "day_id"],
        },
    },
    {
        "name": "rename_program_day",
        "description": "Rename an existing training day.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string"},
                "day_id": {"type": "string"},
                "name": {"type": "string"},
            },
            "required": ["program_id", "day_id", "name"],
        },
    },
```

- [ ] **Step 2: Append handlers**

Append to `program_handlers.py`:

```python
async def add_program_day(user_id: str, program_id: str, day_number: int, name: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM programs WHERE id = %s AND user_id = %s",
                (program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Program not found"}

            day_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_days (id, program_id, day_number, name) "
                "VALUES (%s, %s, %s, %s)",
                (day_id, program_id, day_number, name),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "day_id": day_id, "day_number": day_number, "name": name}


async def remove_program_day(user_id: str, program_id: str, day_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            await conn.execute(
                "DELETE FROM program_days WHERE id = %s",
                (day_id,),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "day_id": day_id}


async def rename_program_day(user_id: str, program_id: str, day_id: str, name: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            await conn.execute(
                "UPDATE program_days SET name = %s WHERE id = %s",
                (name, day_id),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "day_id": day_id, "name": name}
```

- [ ] **Step 3: Register in dispatcher**

Add to `HANDLERS`:

```python
    "add_program_day": program_handlers.add_program_day,
    "remove_program_day": program_handlers.remove_program_day,
    "rename_program_day": program_handlers.rename_program_day,
```

- [ ] **Step 4: Append tests**

Append 6 tests to `test_tools_program.py` (one happy + one not-found per tool). Pattern matches Task 3 — copy the `test_update_program_sets_name` and `test_update_program_returns_not_found` structure, adjust SQL mock cursors to match the handler's queries.

Quick reference for cursor counts:
- `add_program_day`: 2 execute calls (ownership check + insert)
- `remove_program_day`: 2 execute calls (ownership check + delete)
- `rename_program_day`: 2 execute calls (ownership check + update)

- [ ] **Step 5: Run tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_tools_program.py -v
```
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/definitions.py api/app/tools/handlers/program_handlers.py api/app/tools/dispatcher.py api/tests/test_tools_program.py
git commit -m "feat(api): add add/remove/rename program day tools"
```

---

### Task 5: add/remove exercise in day

**Files:** same as Task 4.

- [ ] **Step 1: Append tool definitions**

```python
    {
        "name": "add_exercise_to_day",
        "description": "Add an exercise to a program day.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string"},
                "day_id": {"type": "string"},
                "exercise_id": {"type": "string", "description": "Exercise ID from the library."},
                "sets": {"type": "integer"},
                "reps": {"type": "integer"},
                "weight_kg": {"type": "number"},
            },
            "required": ["program_id", "day_id", "exercise_id", "sets", "reps"],
        },
    },
    {
        "name": "remove_exercise_from_day",
        "description": "Remove an exercise from a program day. CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string"},
                "day_id": {"type": "string"},
                "exercise_id": {"type": "string", "description": "Exercise ID (text) to remove."},
            },
            "required": ["program_id", "day_id", "exercise_id"],
        },
    },
```

- [ ] **Step 2: Append handlers**

```python
async def add_exercise_to_day(
    user_id: str, program_id: str, day_id: str, exercise_id: str,
    sets: int, reps: int, weight_kg: float | None = None,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            cur = await conn.execute(
                "SELECT COALESCE(MAX(order_index) + 1, 0) "
                "FROM program_exercises WHERE program_day_id = %s",
                (day_id,),
            )
            order_index = (await cur.fetchone())[0]

            pe_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_exercises "
                "(id, program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (pe_id, day_id, exercise_id, sets, reps, weight_kg, order_index),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "program_exercise_id": pe_id, "exercise_id": exercise_id}


async def remove_exercise_from_day(
    user_id: str, program_id: str, day_id: str, exercise_id: str,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            cur = await conn.execute(
                "DELETE FROM program_exercises "
                "WHERE program_day_id = %s AND exercise_id = %s RETURNING id",
                (day_id, exercise_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Exercise not found in day"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "exercise_id": exercise_id}
```

- [ ] **Step 3: Register + tests + commit**

Register in dispatcher (`add_exercise_to_day`, `remove_exercise_from_day`). Append 4 tests following same pattern. Run + commit:

```bash
git add api/app/tools/definitions.py api/app/tools/handlers/program_handlers.py api/app/tools/dispatcher.py api/tests/test_tools_program.py
git commit -m "feat(api): add add_exercise_to_day and remove_exercise_from_day tools"
```

---

### Task 6: swap_exercise_in_day + update_exercise_sets

- [ ] **Step 1: Append tool definitions**

```python
    {
        "name": "swap_exercise_in_day",
        "description": "Replace one exercise in a program day with another. CONFIRM-PLIKTIG — historical set data is lost. Keeps sets/reps/weight from the old exercise on the new one.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string"},
                "day_id": {"type": "string"},
                "old_exercise_id": {"type": "string"},
                "new_exercise_id": {"type": "string"},
            },
            "required": ["program_id", "day_id", "old_exercise_id", "new_exercise_id"],
        },
    },
    {
        "name": "update_exercise_sets",
        "description": "Update sets, reps, or weight for an exercise in a program day.",
        "input_schema": {
            "type": "object",
            "properties": {
                "program_id": {"type": "string"},
                "day_id": {"type": "string"},
                "exercise_id": {"type": "string"},
                "sets": {"type": "integer"},
                "reps": {"type": "integer"},
                "weight_kg": {"type": "number"},
            },
            "required": ["program_id", "day_id", "exercise_id"],
        },
    },
```

- [ ] **Step 2: Append handlers**

```python
async def swap_exercise_in_day(
    user_id: str, program_id: str, day_id: str,
    old_exercise_id: str, new_exercise_id: str,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            cur = await conn.execute(
                "UPDATE program_exercises SET exercise_id = %s "
                "WHERE program_day_id = %s AND exercise_id = %s RETURNING id",
                (new_exercise_id, day_id, old_exercise_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Old exercise not found in day"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "old_exercise_id": old_exercise_id, "new_exercise_id": new_exercise_id}


async def update_exercise_sets(
    user_id: str, program_id: str, day_id: str, exercise_id: str,
    sets: int | None = None, reps: int | None = None, weight_kg: float | None = ...,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.id = %s AND p.user_id = %s",
                (day_id, program_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            updates: list[str] = []
            params: list = []
            if sets is not None:
                updates.append("sets = %s")
                params.append(sets)
            if reps is not None:
                updates.append("reps = %s")
                params.append(reps)
            if weight_kg is not ...:
                updates.append("weight_kg = %s")
                params.append(weight_kg)

            if not updates:
                return {"ok": False, "error": "No fields to update"}

            params.extend([day_id, exercise_id])
            cur = await conn.execute(
                f"UPDATE program_exercises SET {', '.join(updates)} "
                "WHERE program_day_id = %s AND exercise_id = %s RETURNING id",
                params,
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Exercise not found in day"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "exercise_id": exercise_id}
```

- [ ] **Step 3: Register + tests + commit**

Register in dispatcher (`swap_exercise_in_day`, `update_exercise_sets`). Append 4 tests. Run + commit:

```bash
git add api/app/tools/definitions.py api/app/tools/handlers/program_handlers.py api/app/tools/dispatcher.py api/tests/test_tools_program.py
git commit -m "feat(api): add swap_exercise_in_day and update_exercise_sets tools"
```

---

## Phase 3: Other CRUD domains

### Task 7: Folder tools (4 tools)

**Files:**
- Modify: `api/app/tools/definitions.py`
- Create: `api/app/tools/handlers/folder_handlers.py`
- Modify: `api/app/tools/dispatcher.py`
- Create: `api/tests/test_tools_folder.py`

- [ ] **Step 1: Append definitions**

```python
    {
        "name": "create_folder",
        "description": "Create a new folder for organizing programs.",
        "input_schema": {
            "type": "object",
            "properties": {"name": {"type": "string"}},
            "required": ["name"],
        },
    },
    {
        "name": "rename_folder",
        "description": "Rename an existing folder.",
        "input_schema": {
            "type": "object",
            "properties": {
                "folder_id": {"type": "string"},
                "name": {"type": "string"},
            },
            "required": ["folder_id", "name"],
        },
    },
    {
        "name": "delete_folder",
        "description": "Delete a folder. Programs in the folder are moved to root (not deleted). CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {"folder_id": {"type": "string"}},
            "required": ["folder_id"],
        },
    },
    {
        "name": "list_folders",
        "description": "List all folders the user has, with program counts.",
        "input_schema": {"type": "object", "properties": {}},
    },
```

- [ ] **Step 2: Create folder_handlers.py**

```python
"""Tools for managing program folders."""
import uuid
from app.db import get_conn


async def create_folder(user_id: str, name: str) -> dict:
    folder_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO program_folders (id, user_id, name) VALUES (%s, %s, %s)",
                (folder_id, user_id, name.strip()),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "folder_id": folder_id, "name": name}


async def rename_folder(user_id: str, folder_id: str, name: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE program_folders SET name = %s "
                "WHERE id = %s AND user_id = %s RETURNING id",
                (name.strip(), folder_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Folder not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "folder_id": folder_id, "name": name}


async def delete_folder(user_id: str, folder_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM program_folders WHERE id = %s AND user_id = %s RETURNING id",
                (folder_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Folder not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "folder_id": folder_id}


async def list_folders(user_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT f.id, f.name, "
                "       (SELECT COUNT(*) FROM programs p WHERE p.folder_id = f.id)::int "
                "FROM program_folders f WHERE f.user_id = %s "
                "ORDER BY f.created_at DESC",
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {
        "ok": True,
        "folders": [
            {"id": str(r[0]), "name": r[1], "program_count": r[2]} for r in rows
        ],
    }
```

- [ ] **Step 3: Register in dispatcher**

Add 4 entries to HANDLERS. Add `from app.tools.handlers import folder_handlers` at the top.

- [ ] **Step 4: Create tests**

Create `api/tests/test_tools_folder.py` with 6 tests (happy + not-found for create/rename/delete, plus 1 for list). Follow the pattern from Task 3.

- [ ] **Step 5: Run + commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_tools_folder.py -v
```

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/definitions.py api/app/tools/handlers/folder_handlers.py api/app/tools/dispatcher.py api/tests/test_tools_folder.py
git commit -m "feat(api): add folder management tools (create/rename/delete/list)"
```

---

### Task 8: Workout lifecycle tools (5 tools)

**Files:**
- Modify: `api/app/tools/definitions.py`
- Modify: `api/app/tools/handlers/workout_handlers.py` (append)
- Modify: `api/app/tools/dispatcher.py`
- Create: `api/tests/test_tools_workout.py`

- [ ] **Step 1: Append definitions**

```python
    {
        "name": "start_workout_from_day",
        "description": "Start a workout based on a program day. Returns the workout_id so subsequent log_set calls can attach.",
        "input_schema": {
            "type": "object",
            "properties": {"program_day_id": {"type": "string"}},
            "required": ["program_day_id"],
        },
    },
    {
        "name": "complete_workout",
        "description": "Mark a workout as complete.",
        "input_schema": {
            "type": "object",
            "properties": {
                "workout_id": {"type": "string"},
                "rpe": {"type": "integer", "minimum": 1, "maximum": 10},
                "notes": {"type": "string"},
            },
            "required": ["workout_id"],
        },
    },
    {
        "name": "discard_workout",
        "description": "Permanently delete a workout (in-progress or completed). CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {"workout_id": {"type": "string"}},
            "required": ["workout_id"],
        },
    },
    {
        "name": "swap_active_workout_exercise",
        "description": "During an active workout, swap one exercise for another. Logs go forward under the new exercise.",
        "input_schema": {
            "type": "object",
            "properties": {
                "workout_id": {"type": "string"},
                "old_exercise_id": {"type": "string"},
                "new_exercise_id": {"type": "string"},
            },
            "required": ["workout_id", "old_exercise_id", "new_exercise_id"],
        },
    },
    {
        "name": "add_active_workout_exercise",
        "description": "Add a bonus exercise to an in-progress workout (not part of the program day).",
        "input_schema": {
            "type": "object",
            "properties": {
                "workout_id": {"type": "string"},
                "exercise_id": {"type": "string"},
            },
            "required": ["workout_id", "exercise_id"],
        },
    },
```

- [ ] **Step 2: Append handlers**

Append to `workout_handlers.py`:

```python
import uuid
from datetime import datetime, timezone


async def start_workout_from_day(user_id: str, program_day_id: str) -> dict:
    try:
        async with get_conn() as conn:
            # Verify day belongs to user
            cur = await conn.execute(
                "SELECT pd.id FROM program_days pd "
                "JOIN programs p ON p.id = pd.program_id "
                "WHERE pd.id = %s AND p.user_id = %s",
                (program_day_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Day not found"}

            workout_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO workouts (id, user_id, program_day_id) VALUES (%s, %s, %s)",
                (workout_id, user_id, program_day_id),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "workout_id": workout_id}


async def complete_workout(
    user_id: str, workout_id: str, rpe: int | None = None, notes: str | None = None,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE workouts SET completed_at = NOW(), rpe = %s, notes = %s "
                "WHERE id = %s AND user_id = %s AND completed_at IS NULL "
                "RETURNING id",
                (rpe, notes, workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Workout not found or already completed"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "workout_id": workout_id}


async def discard_workout(user_id: str, workout_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM workouts WHERE id = %s AND user_id = %s RETURNING id",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Workout not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "workout_id": workout_id}


async def swap_active_workout_exercise(
    user_id: str, workout_id: str, old_exercise_id: str, new_exercise_id: str,
) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Active workout not found"}

            # Update existing sets to point at the new exercise_id (best effort — keeps log)
            await conn.execute(
                "UPDATE workout_sets SET exercise_id = %s "
                "WHERE workout_id = %s AND exercise_id = %s",
                (new_exercise_id, workout_id, old_exercise_id),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "workout_id": workout_id, "swapped_to": new_exercise_id}


async def add_active_workout_exercise(
    user_id: str, workout_id: str, exercise_id: str,
) -> dict:
    # No-op at DB level — workout_sets are inserted on first log_set_with_note for this exercise_id.
    # This handler just verifies ownership so the coach gets a confirm.
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s AND completed_at IS NULL",
                (workout_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Active workout not found"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "workout_id": workout_id, "ready_to_log": exercise_id}
```

- [ ] **Step 3: Register in dispatcher**

Add 5 entries to HANDLERS.

- [ ] **Step 4: Create tests**

Create `api/tests/test_tools_workout.py` with 10 tests (happy + not-found per tool). Follow Task 3 pattern.

- [ ] **Step 5: Run + commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/definitions.py api/app/tools/handlers/workout_handlers.py api/app/tools/dispatcher.py api/tests/test_tools_workout.py
git commit -m "feat(api): add workout lifecycle tools (start/complete/discard/swap/add-active)"
```

---

### Task 9: Profile + persona (2 tools)

**Files:**
- Modify: `api/app/tools/definitions.py`
- Create: `api/app/tools/handlers/profile_handlers.py`
- Modify: `api/app/tools/dispatcher.py`
- Create: `api/tests/test_tools_profile.py`

- [ ] **Step 1: Append definitions**

```python
    {
        "name": "update_user_profile",
        "description": "Update the user's profile fields. Only include fields that should change.",
        "input_schema": {
            "type": "object",
            "properties": {
                "first_name": {"type": "string"},
                "last_name": {"type": "string"},
                "goals": {"type": "array", "items": {"type": "string"}},
                "experience_level": {"type": "string", "enum": ["beginner", "intermediate", "advanced"]},
                "training_days_per_week": {"type": "integer"},
                "height_cm": {"type": "integer"},
                "weight_kg": {"type": "number"},
                "activity_level": {"type": "string"},
                "years_training": {"type": "integer"},
                "preferred_training_time": {"type": "string"},
                "max_session_duration_min": {"type": "integer"},
            },
        },
    },
    {
        "name": "set_persona_mode",
        "description": "Change the coach's personality mode.",
        "input_schema": {
            "type": "object",
            "properties": {
                "mode": {"type": "string", "enum": ["friend", "sergeant", "analyst"]},
            },
            "required": ["mode"],
        },
    },
```

- [ ] **Step 2: Create handlers**

Create `api/app/tools/handlers/profile_handlers.py`:

```python
from app.db import get_conn

_ALLOWED = {
    "first_name", "last_name", "goals", "experience_level",
    "training_days_per_week", "height_cm", "weight_kg",
    "activity_level", "years_training", "preferred_training_time",
    "max_session_duration_min",
}


async def update_user_profile(user_id: str, **fields) -> dict:
    bad = [k for k in fields if k not in _ALLOWED]
    if bad:
        return {"ok": False, "error": f"Unknown fields: {bad}"}
    if not fields:
        return {"ok": False, "error": "No fields to update"}

    set_clauses = ", ".join(f"{k} = %s" for k in fields)
    params = list(fields.values()) + [user_id]
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                f"UPDATE users SET {set_clauses} WHERE id = %s RETURNING id",
                params,
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "User not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "updated_fields": list(fields.keys())}


async def set_persona_mode(user_id: str, mode: str) -> dict:
    if mode not in ("friend", "sergeant", "analyst"):
        return {"ok": False, "error": "Invalid mode"}
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE users SET persona_mode = %s WHERE id = %s RETURNING id",
                (mode, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "User not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "mode": mode}
```

- [ ] **Step 3: Register + tests + commit**

Register 2 entries. Create `api/tests/test_tools_profile.py` with 4 tests. Run + commit:

```bash
git add api/app/tools/definitions.py api/app/tools/handlers/profile_handlers.py api/app/tools/dispatcher.py api/tests/test_tools_profile.py
git commit -m "feat(api): add update_user_profile and set_persona_mode tools"
```

---

### Task 10: Injury tools (3 tools)

**Files:**
- Modify: `api/app/tools/definitions.py`
- Create: `api/app/tools/handlers/injury_handlers.py`
- Modify: `api/app/tools/dispatcher.py`
- Create: `api/tests/test_tools_injury.py`

- [ ] **Step 1: Append definitions**

```python
    {
        "name": "add_injury",
        "description": "Record a new injury the user has mentioned.",
        "input_schema": {
            "type": "object",
            "properties": {
                "body_part": {"type": "string"},
                "description": {"type": "string"},
                "severity": {"type": "string", "enum": ["low", "moderate", "high"]},
                "started_at": {"type": "string", "description": "ISO date YYYY-MM-DD."},
            },
            "required": ["body_part"],
        },
    },
    {
        "name": "update_injury",
        "description": "Update an existing injury — change severity, description, or active status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "injury_id": {"type": "string"},
                "severity": {"type": "string", "enum": ["low", "moderate", "high"]},
                "description": {"type": "string"},
                "is_active": {"type": "boolean"},
            },
            "required": ["injury_id"],
        },
    },
    {
        "name": "remove_injury",
        "description": "Mark an injury as healed (sets is_active=false). CONFIRM-PLIKTIG.",
        "input_schema": {
            "type": "object",
            "properties": {"injury_id": {"type": "string"}},
            "required": ["injury_id"],
        },
    },
```

- [ ] **Step 2: Create handlers**

Create `api/app/tools/handlers/injury_handlers.py`:

```python
import uuid
from app.db import get_conn


async def add_injury(
    user_id: str, body_part: str,
    description: str | None = None,
    severity: str | None = None,
    started_at: str | None = None,
) -> dict:
    injury_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO user_injuries (id, user_id, body_part, description, severity, started_at, is_active) "
                "VALUES (%s, %s, %s, %s, %s, %s, true)",
                (injury_id, user_id, body_part, description, severity, started_at),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "injury_id": injury_id, "body_part": body_part}


async def update_injury(
    user_id: str, injury_id: str,
    severity: str | None = None, description: str | None = None,
    is_active: bool | None = None,
) -> dict:
    updates: list[str] = []
    params: list = []
    if severity is not None:
        updates.append("severity = %s")
        params.append(severity)
    if description is not None:
        updates.append("description = %s")
        params.append(description)
    if is_active is not None:
        updates.append("is_active = %s")
        params.append(is_active)
    if not updates:
        return {"ok": False, "error": "No fields to update"}

    params.extend([injury_id, user_id])
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                f"UPDATE user_injuries SET {', '.join(updates)} "
                "WHERE id = %s AND user_id = %s RETURNING id",
                params,
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Injury not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "injury_id": injury_id}


async def remove_injury(user_id: str, injury_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE user_injuries SET is_active = false "
                "WHERE id = %s AND user_id = %s RETURNING id",
                (injury_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Injury not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "injury_id": injury_id}
```

- [ ] **Step 3: Register + tests + commit**

Register 3 entries. Create `api/tests/test_tools_injury.py` with 6 tests. Run + commit:

```bash
git add api/app/tools/definitions.py api/app/tools/handlers/injury_handlers.py api/app/tools/dispatcher.py api/tests/test_tools_injury.py
git commit -m "feat(api): add injury management tools"
```

---

### Task 11: Equipment + Preference + Constraint + Social (7 tools)

**Files:**
- Modify: `api/app/tools/definitions.py`
- Create: `api/app/tools/handlers/equipment_handlers.py`
- Create: `api/app/tools/handlers/preference_handlers.py`
- Create: `api/app/tools/handlers/constraint_handlers.py`
- Create: `api/app/tools/handlers/social_handlers.py`
- Modify: `api/app/tools/dispatcher.py`
- Create: `api/tests/test_tools_equipment.py`
- Create: `api/tests/test_tools_preference.py`
- Create: `api/tests/test_tools_constraint.py`
- Create: `api/tests/test_tools_social.py`

- [ ] **Step 1: Append definitions**

```python
    {
        "name": "add_equipment",
        "description": "Record equipment the user has available.",
        "input_schema": {
            "type": "object",
            "properties": {"equipment": {"type": "string"}},
            "required": ["equipment"],
        },
    },
    {
        "name": "remove_equipment",
        "description": "Remove a piece of equipment from the user's available list.",
        "input_schema": {
            "type": "object",
            "properties": {"equipment": {"type": "string"}},
            "required": ["equipment"],
        },
    },
    {
        "name": "add_preference",
        "description": "Record a user preference (e.g. 'kort økt', 'liker compound').",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string"},
                "preference": {"type": "string"},
            },
            "required": ["category", "preference"],
        },
    },
    {
        "name": "remove_preference",
        "description": "Remove a preference by ID.",
        "input_schema": {
            "type": "object",
            "properties": {"preference_id": {"type": "string"}},
            "required": ["preference_id"],
        },
    },
    {
        "name": "add_constraint",
        "description": "Record a constraint (e.g. 'time': '30 min/dag').",
        "input_schema": {
            "type": "object",
            "properties": {
                "type": {"type": "string"},
                "description": {"type": "string"},
            },
            "required": ["type", "description"],
        },
    },
    {
        "name": "remove_constraint",
        "description": "Remove a constraint by ID.",
        "input_schema": {
            "type": "object",
            "properties": {"constraint_id": {"type": "string"}},
            "required": ["constraint_id"],
        },
    },
    {
        "name": "share_workout",
        "description": "Share a completed workout to the social feed.",
        "input_schema": {
            "type": "object",
            "properties": {"workout_id": {"type": "string"}},
            "required": ["workout_id"],
        },
    },
```

- [ ] **Step 2: Create equipment_handlers.py**

```python
from app.db import get_conn


async def add_equipment(user_id: str, equipment: str) -> dict:
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO user_equipment (user_id, equipment) VALUES (%s, %s) "
                "ON CONFLICT DO NOTHING",
                (user_id, equipment),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "equipment": equipment}


async def remove_equipment(user_id: str, equipment: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM user_equipment WHERE user_id = %s AND equipment = %s RETURNING equipment",
                (user_id, equipment),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Equipment not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "equipment": equipment}
```

- [ ] **Step 3: Create preference_handlers.py**

```python
import uuid
from app.db import get_conn


async def add_preference(user_id: str, category: str, preference: str) -> dict:
    pid = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO user_preferences (id, user_id, category, preference) "
                "VALUES (%s, %s, %s, %s)",
                (pid, user_id, category, preference),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "preference_id": pid}


async def remove_preference(user_id: str, preference_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM user_preferences WHERE id = %s AND user_id = %s RETURNING id",
                (preference_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Preference not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "preference_id": preference_id}
```

- [ ] **Step 4: Create constraint_handlers.py**

```python
import uuid
from app.db import get_conn


async def add_constraint(user_id: str, type: str, description: str) -> dict:
    cid = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO user_constraints (id, user_id, type, description) "
                "VALUES (%s, %s, %s, %s)",
                (cid, user_id, type, description),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "constraint_id": cid}


async def remove_constraint(user_id: str, constraint_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM user_constraints WHERE id = %s AND user_id = %s RETURNING id",
                (constraint_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Constraint not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "constraint_id": constraint_id}
```

- [ ] **Step 5: Create social_handlers.py**

```python
from app.db import get_conn


async def share_workout(user_id: str, workout_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT shared_at FROM workouts "
                "WHERE id = %s AND user_id = %s AND completed_at IS NOT NULL",
                (workout_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                return {"ok": False, "error": "Workout not found or not completed"}
            if row[0] is not None:
                return {"ok": False, "error": "Already shared"}

            cur = await conn.execute(
                "UPDATE workouts SET shared_at = NOW() WHERE id = %s RETURNING shared_at",
                (workout_id,),
            )
            await cur.fetchone()
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "workout_id": workout_id}
```

- [ ] **Step 6: Register in dispatcher**

Add 7 entries to HANDLERS. Add imports for the new modules.

- [ ] **Step 7: Create 4 test files**

Each file with 2-4 tests following Task 3 pattern. Run all:

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_tools_equipment.py tests/test_tools_preference.py tests/test_tools_constraint.py tests/test_tools_social.py -v
```

- [ ] **Step 8: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/tools/definitions.py api/app/tools/handlers/ api/app/tools/dispatcher.py api/tests/test_tools_equipment.py api/tests/test_tools_preference.py api/tests/test_tools_constraint.py api/tests/test_tools_social.py
git commit -m "feat(api): add equipment/preference/constraint/social tools"
```

---

## Phase 4: Prompt + Frontend

### Task 12: Update BASE_PROMPT with confirm-rule + full tool inventory

**Files:**
- Modify: `api/app/services/coach.py` (replace BASE_PROMPT string)

- [ ] **Step 1: Replace BASE_PROMPT**

In `api/app/services/coach.py`, find the existing `BASE_PROMPT = """..."""` block (line ~9-39) and replace with:

```python
BASE_PROMPT = """You are an AI fitness coach for a mobile/web app.
The user chats with you in text (voice optional). Your replies should feel like a smart friend.

CORE PRINCIPLES
- Adapt to the user's level. Never assume they know jargon — define it the first time you use it.
- Safety first. If the user mentions pain (not soreness), dizziness, or injury, stop workout direction and ask one clarifying question.
- Ground yourself in data. Before giving advice about weight or reps, call the appropriate tool.
- Be concise. Keep sentences short. Avoid lists, markdown, or headers in most replies. Max 3 sentences per turn unless the user explicitly asks for detail.
- Match the user's language. If they speak Norwegian, reply in Norwegian. If English, English.

TOOLS YOU CAN CALL
Read:    get_user_profile, get_workout_history, get_recent_sessions, search_observations,
         get_progression, get_exercise_info, search_exercises, get_user_history,
         suggest_progression, list_folders
Write:   write_observation, log_set_with_note, log_workout
Program: create_program, update_program, delete_program, add_program_day, remove_program_day,
         rename_program_day, add_exercise_to_day, remove_exercise_from_day,
         swap_exercise_in_day, update_exercise_sets
Folder:  create_folder, rename_folder, delete_folder
Workout: start_workout_from_day, complete_workout, discard_workout,
         swap_active_workout_exercise, add_active_workout_exercise
Profile: update_user_profile, set_persona_mode
Health:  add_injury, update_injury, remove_injury
Setup:   add_equipment, remove_equipment, add_preference, remove_preference,
         add_constraint, remove_constraint
Social:  share_workout

CONFIRM-REGEL FOR DESTRUKTIVE HANDLINGER
Før du kaller noen av disse:
- delete_program, delete_folder
- remove_program_day, remove_exercise_from_day
- swap_exercise_in_day
- discard_workout
- remove_injury

Du MÅ:
1. I første tur, IKKE kalle tool-en. Svar i stedet med en kort bekreftelses-spørsmål:
   "Er du sikker på at jeg skal slette {X}? Det er ikke reversibelt."
2. Vent på brukerens svar.
3. Hvis svaret bekrefter (ja/yes/ok/gjør det/slett), kall tool-en.
4. Hvis svaret avviser eller er uklart, ikke kall tool-en. Bekreft "OK, lar det stå."

Aldri kall confirm-pliktige tools i samme tur som brukerens første forespørsel.

WHEN TO USE WRITE TOOLS
- write_observation: when you notice something worth remembering for the future.
- log_set_with_note: during an active workout when the user describes a set verbally.
- update_user_profile / add_injury / add_equipment / add_preference / add_constraint:
  ALWAYS confirm with the user first by repeating what you understood. Never auto-update.
- create_program: when the user clearly asks for a new program.

WHEN TO USE READ TOOLS
- Call get_workout_history or get_progression BEFORE giving any advice about weight or reps.
- Call search_observations when the user asks about past patterns or themselves.
- Don't call tools unnecessarily — for casual chat or motivation, the base context is enough.

WHAT YOU DO NOT DO
- Do not prescribe medical treatment or diagnose conditions.
- Do not shame the user for missed workouts or eating habits.
- Do not make up exercises, numbers, or research claims."""
```

- [ ] **Step 2: Run coach tests to verify nothing breaks**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_chat.py tests/test_chat_stream.py -v
```
Expected: all PASS (the prompt change is text-only, tests stub Claude).

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/services/coach.py
git commit -m "feat(api): expand BASE_PROMPT with full tool inventory and confirm-regel"
```

---

### Task 13: Frontend stream-event + TOOL_LABELS + ChatBody pill rendering

**Files:**
- Modify: `web/src/lib/coach-stream.ts` (extend tool_result event type)
- Create: `web/src/lib/tool-labels.ts`
- Create: `web/src/lib/tool-labels.test.ts`
- Modify: `web/src/app/coach/ChatBody.tsx` (use labels + render result_link)

- [ ] **Step 1: Extend stream-event type**

Find this union in `web/src/lib/coach-stream.ts`:

```ts
| { type: "tool_result"; tool_use_id: string; name: string; ok: boolean }
```

Replace with:

```ts
| {
    type: "tool_result"
    tool_use_id: string
    name: string
    ok: boolean
    result_link?: { label: string; href: string }
  }
```

- [ ] **Step 2: Create tool-labels.ts**

Create `web/src/lib/tool-labels.ts`:

```ts
export interface ToolLabel {
  in_progress: string
  done: string
  emoji: string
}

export const TOOL_LABELS: Record<string, ToolLabel> = {
  create_program:           { in_progress: "Lager program",      done: "Laget program",     emoji: "💪" },
  update_program:           { in_progress: "Oppdaterer program", done: "Oppdatert",          emoji: "✏️" },
  delete_program:           { in_progress: "Sletter program",    done: "Slettet",            emoji: "🗑" },
  add_program_day:          { in_progress: "Legger til dag",     done: "Lagt til dag",       emoji: "➕" },
  remove_program_day:       { in_progress: "Fjerner dag",        done: "Fjernet dag",        emoji: "➖" },
  rename_program_day:       { in_progress: "Endrer navn",        done: "Endret navn",        emoji: "✏️" },
  add_exercise_to_day:      { in_progress: "Legger til øvelse",  done: "Lagt til øvelse",    emoji: "➕" },
  remove_exercise_from_day: { in_progress: "Fjerner øvelse",     done: "Fjernet øvelse",     emoji: "➖" },
  swap_exercise_in_day:     { in_progress: "Bytter øvelse",      done: "Byttet øvelse",      emoji: "🔄" },
  update_exercise_sets:     { in_progress: "Oppdaterer sett",    done: "Oppdatert",          emoji: "✏️" },
  create_folder:            { in_progress: "Lager mappe",        done: "Laget mappe",        emoji: "📁" },
  rename_folder:            { in_progress: "Endrer mappenavn",   done: "Endret",             emoji: "📁" },
  delete_folder:            { in_progress: "Sletter mappe",      done: "Slettet mappe",      emoji: "🗑" },
  list_folders:             { in_progress: "Henter mapper",      done: "Mapper hentet",      emoji: "📁" },
  log_workout:              { in_progress: "Logger økt",         done: "Logget økt",         emoji: "📝" },
  log_set_with_note:        { in_progress: "Logger sett",        done: "Logget sett",        emoji: "📝" },
  start_workout_from_day:   { in_progress: "Starter økt",        done: "Startet økt",        emoji: "▶️" },
  complete_workout:         { in_progress: "Fullfører økt",      done: "Fullført",           emoji: "✓" },
  discard_workout:          { in_progress: "Forkaster økt",      done: "Forkastet",          emoji: "🗑" },
  swap_active_workout_exercise: { in_progress: "Bytter øvelse",  done: "Byttet",             emoji: "🔄" },
  add_active_workout_exercise:  { in_progress: "Legger til",     done: "Lagt til",           emoji: "➕" },
  update_user_profile:      { in_progress: "Lagrer profil",      done: "Lagret profil",      emoji: "👤" },
  set_persona_mode:         { in_progress: "Bytter personlighet", done: "Byttet personlighet", emoji: "🎭" },
  add_injury:               { in_progress: "Lagrer skade",       done: "Lagret skade",       emoji: "🩹" },
  update_injury:            { in_progress: "Oppdaterer skade",   done: "Oppdatert",          emoji: "🩹" },
  remove_injury:            { in_progress: "Fjerner skade",      done: "Markert som leget",  emoji: "✓" },
  add_equipment:            { in_progress: "Lagrer utstyr",      done: "Lagt til utstyr",    emoji: "🏋️" },
  remove_equipment:         { in_progress: "Fjerner utstyr",     done: "Fjernet",            emoji: "🏋️" },
  add_preference:           { in_progress: "Lagrer preferanse",  done: "Lagret",             emoji: "⭐" },
  remove_preference:        { in_progress: "Fjerner",            done: "Fjernet",            emoji: "⭐" },
  add_constraint:           { in_progress: "Lagrer begrensning", done: "Lagret",             emoji: "🚧" },
  remove_constraint:        { in_progress: "Fjerner",            done: "Fjernet",            emoji: "🚧" },
  share_workout:            { in_progress: "Deler økt",          done: "Delt",               emoji: "📣" },
}

const SILENT_TOOLS = new Set([
  "get_user_profile",
  "get_workout_history",
  "get_progression",
  "get_recent_sessions",
  "get_exercise_info",
  "search_exercises",
  "search_observations",
  "get_user_history",
  "suggest_progression",
  "write_observation", // memory tool — quiet
])

export function shouldShowPill(name: string): boolean {
  return !SILENT_TOOLS.has(name) && name in TOOL_LABELS
}
```

- [ ] **Step 3: Create label sanity-test**

Create `web/src/lib/tool-labels.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { TOOL_LABELS, shouldShowPill } from "./tool-labels"

describe("tool-labels", () => {
  it("has labels for all destructive tools", () => {
    const destructive = [
      "delete_program", "delete_folder", "remove_program_day",
      "remove_exercise_from_day", "swap_exercise_in_day",
      "discard_workout", "remove_injury",
    ]
    for (const tool of destructive) {
      expect(TOOL_LABELS[tool]).toBeDefined()
    }
  })

  it("returns false for silent read tools", () => {
    expect(shouldShowPill("get_user_profile")).toBe(false)
    expect(shouldShowPill("get_workout_history")).toBe(false)
  })

  it("returns true for write tools with labels", () => {
    expect(shouldShowPill("create_program")).toBe(true)
    expect(shouldShowPill("delete_program")).toBe(true)
  })

  it("returns false for unknown tools", () => {
    expect(shouldShowPill("nonexistent_tool")).toBe(false)
  })
})
```

- [ ] **Step 4: Update ChatBody.tsx**

Open `web/src/app/coach/ChatBody.tsx`. Find the tool-rendering code (look for `tool_use` and `tool_result` rendering). Replace the label that's rendered with `TOOL_LABELS[name].in_progress + " " + emoji` (in-progress) or `TOOL_LABELS[name].done + " " + emoji + " ✓"` (done).

Replace the existing label rendering with:

```tsx
import { TOOL_LABELS, shouldShowPill } from "@/lib/tool-labels"

// Within the rendering loop for tool_use blocks:
if (!shouldShowPill(toolUse.name)) return null
const label = TOOL_LABELS[toolUse.name]
const isDone = !!matchingResult
const isOk = matchingResult?.ok ?? true

return (
  <div className={pillClassName(isDone, isOk)}>
    <span>{label.emoji}</span>
    <span>{isDone ? `${label.done} ${isOk ? "✓" : "✗"}` : `${label.in_progress}…`}</span>
    {isDone && matchingResult?.result_link && (
      <Link href={matchingResult.result_link.href} className="ml-2 underline">
        {matchingResult.result_link.label} →
      </Link>
    )}
  </div>
)
```

(The exact JSX integration depends on the existing ChatBody structure. The engineer should preserve the existing pill styling and just swap the label-text source from whatever it currently is to the `TOOL_LABELS` lookup, and add the optional `result_link` rendering.)

- [ ] **Step 5: Run tests + typecheck**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck && npm run test -- tool-labels --run
```
Expected: typecheck PASS, 4/4 tests PASS.

- [ ] **Step 6: Smoke-test**

Open `localhost:3000/coach`. Send «Lag et 3-dagers styrkeprogram». Verify pill shows «Lager program… 💪» then «Laget program 💪 ✓ [Se ... →]» with a clickable link.

- [ ] **Step 7: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/lib/coach-stream.ts web/src/lib/tool-labels.ts web/src/lib/tool-labels.test.ts web/src/app/coach/ChatBody.tsx
git commit -m "feat(web): add tool labels + result_link rendering in chat pills"
```

---

## Phase 5: Verification

### Task 14: Manual verification of 5 user scenarios

After all backend + frontend tasks are complete, manually verify these scenarios in the browser at `localhost:3000/coach`:

- [ ] **Scenario 1: Create program**
  
  Send: «Lag et 3-dagers styrkeprogram med squat, benkpress og markløft»
  
  Expected:
  - Pill «Lager program… 💪» appears
  - Pill updates to «Laget program 💪 ✓ [Se ... →]»
  - Tap the link → opens `/program/{id}` with the new program

- [ ] **Scenario 2: Edit exercise**
  
  Send: «Endre squat til hack squat i programmet mitt»
  
  Expected: Pill «Bytter øvelse 🔄» → «Byttet øvelse 🔄 ✓»

- [ ] **Scenario 3: Delete with confirm**
  
  Send: «Slett programmet [name]»
  
  Expected:
  - Coach asks «Er du sikker?» (no pill yet)
  - Send «Ja»
  - Pill «Sletter program 🗑» → «Slettet 🗑 ✓»

- [ ] **Scenario 4: Add injury**
  
  Send: «Jeg har vondt i kneet»
  
  Expected:
  - Coach asks for confirmation/details
  - Eventually pill «Lagrer skade 🩹» → «Lagret skade 🩹 ✓»
  - Verify in Profile → Skader-tab that injury exists

- [ ] **Scenario 5: Start workout**
  
  Send: «Start dagens økt»
  
  Expected: Pill «Starter økt ▶️» → «Startet økt ▶️ ✓ [Åpne →]» → tap → opens workout-screen

If any scenario fails, debug at the relevant layer (tool definition, handler SQL, dispatcher routing, prompt instruction, or frontend rendering) before declaring done.

- [ ] **Final commit (verification doc)**

If any small fixes were made during verification, commit them with descriptive messages.

---

## Self-Review

**1. Spec coverage:**
- ✅ user_id propagation — Task 1
- ✅ Split handlers.py into domain files — Task 2
- ✅ 9 new program CRUD tools — Tasks 3-6
- ✅ 4 folder tools — Task 7
- ✅ 5 workout lifecycle tools — Task 8
- ✅ 2 profile/persona tools — Task 9
- ✅ 3 injury tools — Task 10
- ✅ 6 equipment/preference/constraint + 1 social tools — Task 11
- ✅ Confirm-regel + tool inventory in BASE_PROMPT — Task 12
- ✅ Stream-event extension + TOOL_LABELS + ChatBody pill rendering — Task 13
- ✅ Manual verification — Task 14

**Tool count check:** 12 existing + 30 new = 42 total. ✓
- Existing (12): create_program, log_workout, log_set_with_note, write_observation, get_user_profile, get_workout_history, get_progression, search_observations, get_recent_sessions, get_exercise_info, search_exercises, get_user_history (suggest_progression also exists — that's 13. Bonus.)
- New (30): update_program, delete_program, add_program_day, remove_program_day, rename_program_day, add_exercise_to_day, remove_exercise_from_day, swap_exercise_in_day, update_exercise_sets (9), create_folder, rename_folder, delete_folder, list_folders (4), start_workout_from_day, complete_workout, discard_workout, swap_active_workout_exercise, add_active_workout_exercise (5), update_user_profile, set_persona_mode (2), add_injury, update_injury, remove_injury (3), add_equipment, remove_equipment, add_preference, remove_preference, add_constraint, remove_constraint (6), share_workout (1).

**2. Placeholder scan:** No "TBD"/"TODO". A few "follow the Task 3 pattern" notes for test files — these come with explicit cursor-count guidance and a reference test that's fully shown. Acceptable since the pattern is concrete.

**3. Type consistency:** Handler signature `(user_id: str, **kwargs) -> dict` consistent across all 42 tools. Return shape `{"ok": bool, ...}` consistent. Dispatcher signature `handle_tool(user_id, name, tool_input) -> dict` matches caller signature in `coach.py`. Stream-event `tool_result.result_link?: { label, href }` matches `result_links.build()` return type and ChatBody rendering.

Plan is ready for execution.
