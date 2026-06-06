# Program-tab restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Program library into Strong-style layout (folder pills + quick-start ad-hoc workout + save-as-program flow).

**Architecture:** Frontend-first restructure (no DB migration needed — `programs.folder_id` and `workouts.program_day_id` already nullable from the previous program-tab spec). Backend gets one new endpoint (`POST /api/programs/from-workout`). All file changes scoped to `web/src/components/program/library/` and `web/src/components/program/workout/` plus one router addition and lib/api.ts updates.

**Tech Stack:** Next.js 16 App Router + TypeScript + Tailwind (frontend), Vitest + React Testing Library, FastAPI + psycopg, pytest.

**Spec:** [`docs/superpowers/specs/2026-06-06-program-tab-restructure-design.md`](../specs/2026-06-06-program-tab-restructure-design.md)

---

## Phase 1: Backend

### Task 1: `POST /api/programs/from-workout` endpoint

**Files:**
- Modify: `api/app/routers/programs.py` (append endpoint)
- Modify: `api/tests/test_programs_router.py` (append tests)

- [ ] **Step 1: Write failing tests**

Append to `api/tests/test_programs_router.py`:

```python
@pytest.mark.asyncio
async def test_from_workout_returns_201_with_program(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000001")
    new_prog_id = uuid.UUID("eeeeeeee-0000-0000-0000-000000000001")

    # First call: verify workout belongs to user (returns the workout id row)
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(wid,))

    # Second call: fetch logged sets grouped per exercise
    # Returns: [(exercise_id, set_number, reps, weight_kg)]
    cur_sets = AsyncMock()
    cur_sets.fetchall = AsyncMock(return_value=[
        ("back-squat", 1, 5, 80.0),
        ("back-squat", 2, 5, 80.0),
        ("bench-press", 1, 8, 60.0),
    ])

    # Third call: insert program → returns id, name, folder_id
    cur_prog = AsyncMock()
    cur_prog.fetchone = AsyncMock(return_value=(new_prog_id, "Min nye økt", None))

    # Fourth call: insert program_day → returns id
    cur_day = AsyncMock()
    day_id = uuid.UUID("eeeeeeee-0000-0000-0000-000000000002")
    cur_day.fetchone = AsyncMock(return_value=(day_id,))

    # Subsequent calls: insert program_exercises + program_exercise_sets (we don't read returns)
    cur_pe = AsyncMock()
    cur_pe.fetchone = AsyncMock(return_value=(uuid.uuid4(),))

    conn = AsyncMock()
    conn.execute = AsyncMock(
        side_effect=[cur_check, cur_sets, cur_prog, cur_day, cur_pe, cur_pe, cur_pe, cur_pe, cur_pe]
    )

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                "/api/programs/from-workout",
                json={"workout_id": str(wid), "name": "Min nye økt", "folder_id": None},
            )

    assert res.status_code == 201
    body = res.json()
    assert body["name"] == "Min nye økt"
    assert body["is_active"] is False
    assert body["folder_id"] is None


@pytest.mark.asyncio
async def test_from_workout_returns_404_for_unknown(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000002")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=None)
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=cur_check)

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                "/api/programs/from-workout",
                json={"workout_id": str(wid), "name": "X", "folder_id": None},
            )

    assert res.status_code == 404


@pytest.mark.asyncio
async def test_from_workout_returns_400_when_no_sets(make_mock_get_conn):
    wid = uuid.UUID("dddddddd-0000-0000-0000-000000000003")
    cur_check = AsyncMock()
    cur_check.fetchone = AsyncMock(return_value=(wid,))
    cur_sets = AsyncMock()
    cur_sets.fetchall = AsyncMock(return_value=[])
    conn = AsyncMock()
    conn.execute = AsyncMock(side_effect=[cur_check, cur_sets])

    with patch("app.routers.programs.get_conn", new=make_mock_get_conn(conn)):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            res = await client.post(
                "/api/programs/from-workout",
                json={"workout_id": str(wid), "name": "X", "folder_id": None},
            )

    assert res.status_code == 400
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_programs_router.py -v -k "from_workout"
```
Expected: all 3 fail with 404/405 (endpoint missing).

- [ ] **Step 3: Implement endpoint**

Append to `api/app/routers/programs.py` (after the existing `patch_program` endpoint):

```python
class FromWorkoutBody(BaseModel):
    workout_id: str = Field(min_length=1)
    name: str = Field(min_length=1, max_length=120)
    folder_id: str | None = None


@router.post("/programs/from-workout", status_code=201)
async def create_program_from_workout(
    request: Request, body: FromWorkoutBody
) -> dict:
    """Create a program from a logged workout snapshot.

    Builds one day named after the program containing each unique exercise
    from the workout's logged sets, with the same reps/weight_kg per set."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            # Verify workout belongs to user.
            cur = await conn.execute(
                "SELECT id FROM workouts WHERE id = %s AND user_id = %s",
                (body.workout_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Workout not found")

            # Fetch logged sets ordered by exercise then set number.
            cur = await conn.execute(
                "SELECT exercise_id, set_number, reps, weight_kg::float "
                "FROM workout_sets WHERE workout_id = %s "
                "ORDER BY exercise_id, set_number",
                (body.workout_id,),
            )
            set_rows = await cur.fetchall()
            if not set_rows:
                raise HTTPException(
                    status_code=400, detail="Workout has no logged sets"
                )

            # Group by exercise.
            from collections import defaultdict
            grouped: dict[str, list[tuple[int, int, float | None]]] = defaultdict(list)
            for ex_id, set_num, reps, weight in set_rows:
                grouped[ex_id].append((set_num, reps, weight))

            program_id = str(uuid.uuid4())
            cur = await conn.execute(
                "INSERT INTO programs (id, user_id, name, folder_id, is_active) "
                "VALUES (%s, %s, %s, %s, false) "
                "RETURNING id, name, folder_id",
                (program_id, user_id, body.name.strip(), body.folder_id),
            )
            prog_row = await cur.fetchone()

            day_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO program_days (id, program_id, day_number, name) "
                "VALUES (%s, %s, 1, %s)",
                (day_id, program_id, body.name.strip()),
            )

            for order_index, (ex_id, sets) in enumerate(grouped.items()):
                pe_id = str(uuid.uuid4())
                # Legacy schema (migration 002) requires sets/reps/weight_kg columns.
                # Use the first logged set's values as defaults.
                _, first_reps, first_weight = sets[0]
                await conn.execute(
                    "INSERT INTO program_exercises "
                    "(id, program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                    (pe_id, day_id, ex_id, len(sets), first_reps, first_weight, order_index),
                )
                for set_num, reps, weight in sets:
                    await conn.execute(
                        "INSERT INTO program_exercise_sets "
                        "(id, program_exercise_id, set_number, reps, weight_kg) "
                        "VALUES (%s, %s, %s, %s, %s)",
                        (str(uuid.uuid4()), pe_id, set_num, reps, weight),
                    )

            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[create_program_from_workout] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    return {
        "id": str(prog_row[0]),
        "name": prog_row[1],
        "is_active": False,
        "folder_id": str(prog_row[2]) if prog_row[2] else None,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest tests/test_programs_router.py -v -k "from_workout"
```
Expected: all 3 PASS.

- [ ] **Step 5: Run full backend suite to check for regression**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api && .venv/bin/pytest -v
```
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/routers/programs.py api/tests/test_programs_router.py
git commit -m "feat(api): add POST /api/programs/from-workout for ad-hoc save-as-program"
```

---

## Phase 2: Frontend lib

### Task 2: Add client functions to `web/src/lib/api.ts`

**Files:**
- Modify: `web/src/lib/api.ts` (append)

- [ ] **Step 1: Append new types and functions**

Append at the bottom of `web/src/lib/api.ts`:

```ts
/* ── Program from workout ───────────────────────────────── */

export async function createProgramFromWorkout(body: {
  workout_id: string
  name: string
  folder_id: string | null
}): Promise<Program> {
  const res = await fetch(`${API_BASE}/api/programs/from-workout`, {
    method: "POST",
    headers: { ...(await getAuthHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<Program>
}

/* ── Start empty (ad-hoc) workout ───────────────────────── */

export async function startEmptyWorkout(): Promise<{ workout_id: string; started_at: string }> {
  // Reuse existing /api/workouts with no program_day_id.
  return startWorkout(undefined)
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
git commit -m "feat(web): add createProgramFromWorkout + startEmptyWorkout client functions"
```

---

## Phase 3: Library restructure

### Task 3: QuickStartCTA component

**Files:**
- Create: `web/src/components/program/library/QuickStartCTA.tsx`
- Test: `web/src/components/program/library/QuickStartCTA.test.tsx`

- [ ] **Step 1: Write failing test**

Create `web/src/components/program/library/QuickStartCTA.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import QuickStartCTA from "./QuickStartCTA"

describe("QuickStartCTA", () => {
  it("renders the start-empty-workout button", () => {
    render(<QuickStartCTA onStart={() => {}} />)
    expect(screen.getByText(/Hurtigstart/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start tom økt/i })).toBeInTheDocument()
  })

  it("calls onStart when clicked", () => {
    const onStart = vi.fn()
    render(<QuickStartCTA onStart={onStart} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it("disables button when busy", () => {
    render(<QuickStartCTA onStart={() => {}} busy />)
    expect(screen.getByRole("button")).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- QuickStartCTA.test --run
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement QuickStartCTA**

Create `web/src/components/program/library/QuickStartCTA.tsx`:

```tsx
"use client"

interface Props {
  onStart: () => void
  busy?: boolean
}

export default function QuickStartCTA({ onStart, busy }: Props) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--brand-muted)",
          fontWeight: 600,
          margin: "0 4px 6px",
        }}
      >
        Hurtigstart
      </div>
      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        style={{
          width: "100%",
          background: "var(--brand-surface)",
          border: "1.5px dashed var(--brand-border)",
          borderRadius: 12,
          padding: 12,
          fontSize: 13,
          fontWeight: 700,
          color: "var(--brand-muted)",
          cursor: busy ? "default" : "pointer",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Starter…" : "+ Start tom økt"}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- QuickStartCTA.test --run
```
Expected: all 3 PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/program/library/QuickStartCTA.tsx web/src/components/program/library/QuickStartCTA.test.tsx
git commit -m "feat(web): add QuickStartCTA for ad-hoc workout"
```

---

### Task 4: FolderPillBar component

**Files:**
- Create: `web/src/components/program/library/FolderPillBar.tsx`
- Test: `web/src/components/program/library/FolderPillBar.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/src/components/program/library/FolderPillBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import FolderPillBar from "./FolderPillBar"

describe("FolderPillBar", () => {
  const folders = [
    { id: "f-1", name: "Min split", program_count: 2 },
    { id: "f-2", name: "Bulk 26", program_count: 1 },
  ]

  it("renders 'Alle' pill with total count", () => {
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    expect(screen.getByText(/Alle \(3\)/)).toBeInTheDocument()
  })

  it("renders a pill for each folder", () => {
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    expect(screen.getByText("Min split")).toBeInTheDocument()
    expect(screen.getByText("Bulk 26")).toBeInTheDocument()
  })

  it("renders + Mappe pill at the end", () => {
    render(
      <FolderPillBar
        folders={[]}
        totalProgramCount={0}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /\+ Mappe/i })).toBeInTheDocument()
  })

  it("calls onSelect(null) when 'Alle' is clicked", () => {
    const onSelect = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={"f-1"}
        onSelect={onSelect}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByText(/Alle \(3\)/))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it("calls onSelect(folderId) when a folder pill is clicked", () => {
    const onSelect = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={null}
        onSelect={onSelect}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByText("Min split"))
    expect(onSelect).toHaveBeenCalledWith("f-1")
  })

  it("calls onAddFolder when '+ Mappe' is clicked", () => {
    const onAddFolder = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={onAddFolder}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /\+ Mappe/i }))
    expect(onAddFolder).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- FolderPillBar.test --run
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement FolderPillBar**

Create `web/src/components/program/library/FolderPillBar.tsx`:

```tsx
"use client"
import { useRef } from "react"
import type { ProgramFolder } from "@/lib/api"

const LONG_PRESS_MS = 500

interface Props {
  folders: ProgramFolder[]
  totalProgramCount: number
  selectedFolderId: string | null
  onSelect: (folderId: string | null) => void
  onAddFolder: () => void
  onFolderLongPress: (folder: ProgramFolder) => void
}

export default function FolderPillBar({
  folders,
  totalProgramCount,
  selectedFolderId,
  onSelect,
  onAddFolder,
  onFolderLongPress,
}: Props) {
  // Track active long-press timer per folder, plus whether the timer fired so
  // that we suppress the subsequent click event.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFiredRef = useRef(false)

  const startLongPress = (folder: ProgramFolder) => {
    longPressFiredRef.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFiredRef.current = true
      onFolderLongPress(folder)
    }, LONG_PRESS_MS)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }
  const handleClickFolder = (folder: ProgramFolder) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    onSelect(folder.id)
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 14,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      <PillButton
        active={selectedFolderId === null}
        onClick={() => onSelect(null)}
      >
        Alle ({totalProgramCount})
      </PillButton>

      {folders.map((f) => (
        <PillButton
          key={f.id}
          active={selectedFolderId === f.id}
          onClick={() => handleClickFolder(f)}
          onMouseDown={() => startLongPress(f)}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={() => startLongPress(f)}
          onTouchEnd={cancelLongPress}
          onContextMenu={(e) => {
            e.preventDefault()
            onFolderLongPress(f)
          }}
        >
          {f.name}
        </PillButton>
      ))}

      <PillButton variant="add" onClick={onAddFolder}>
        + Mappe
      </PillButton>
    </div>
  )
}

interface PillButtonProps {
  children: React.ReactNode
  active?: boolean
  variant?: "default" | "add"
  onClick: () => void
  onMouseDown?: () => void
  onMouseUp?: () => void
  onMouseLeave?: () => void
  onTouchStart?: () => void
  onTouchEnd?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

function PillButton({
  children,
  active,
  variant,
  onClick,
  ...handlers
}: PillButtonProps) {
  const isAdd = variant === "add"
  const baseBg = active
    ? "var(--brand-orange)"
    : isAdd
      ? "var(--brand-subtle)"
      : "var(--brand-surface)"
  const baseColor = active
    ? "#fff"
    : isAdd
      ? "var(--brand-orange)"
      : "var(--brand-ink)"
  const baseBorder = active
    ? "var(--brand-orange)"
    : isAdd
      ? "var(--brand-orange)"
      : "var(--brand-border)"
  return (
    <button
      type="button"
      onClick={onClick}
      {...handlers}
      style={{
        flexShrink: 0,
        padding: "6px 12px",
        borderRadius: 999,
        background: baseBg,
        border: isAdd ? `1px dashed ${baseBorder}` : `1px solid ${baseBorder}`,
        fontSize: 12,
        fontWeight: 600,
        color: baseColor,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- FolderPillBar.test --run
```
Expected: all 6 PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/program/library/FolderPillBar.tsx web/src/components/program/library/FolderPillBar.test.tsx
git commit -m "feat(web): add FolderPillBar with long-press support"
```

---

### Task 5: FolderActionsSheet + SaveFolderSheet

**Files:**
- Create: `web/src/components/program/library/FolderActionsSheet.tsx`
- Create: `web/src/components/program/library/SaveFolderSheet.tsx`

- [ ] **Step 1: Implement FolderActionsSheet**

Create `web/src/components/program/library/FolderActionsSheet.tsx`:

```tsx
"use client"
import { useState } from "react"
import { renameFolder, deleteFolder, type ProgramFolder } from "@/lib/api"

interface Props {
  folder: ProgramFolder | null
  onClose: () => void
  onChanged: () => void
}

export default function FolderActionsSheet({ folder, onClose, onChanged }: Props) {
  const [mode, setMode] = useState<"menu" | "rename">("menu")
  const [newName, setNewName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!folder) return null

  const startRename = () => {
    setNewName(folder.name)
    setError(null)
    setMode("rename")
  }

  const handleRename = async () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setBusy(true)
    setError(null)
    try {
      await renameFolder(folder.id, trimmed)
      onChanged()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke endre navn")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Slett "${folder.name}"? Programmene flyttes til "Alle" (uten mappe).`)) {
      return
    }
    setBusy(true)
    try {
      await deleteFolder(folder.id)
      onChanged()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
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
            fontSize: 14,
            fontWeight: 700,
            color: "var(--brand-muted)",
            textAlign: "center",
            marginBottom: 16,
            letterSpacing: "-0.01em",
          }}
        >
          📁 {folder.name}
        </div>

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
            {error}
          </div>
        )}

        {mode === "menu" ? (
          <>
            <ActionRow label="Endre navn" onClick={startRename} disabled={busy} />
            <ActionRow label="Slett mappe" onClick={handleDelete} disabled={busy} danger />
          </>
        ) : (
          <>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleRename() }}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "var(--brand-surface)",
                border: "1.5px solid var(--brand-border)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 13,
                color: "var(--brand-ink)",
                marginBottom: 10,
              }}
            />
            <button
              type="button"
              onClick={handleRename}
              disabled={!newName.trim() || busy}
              style={{
                width: "100%",
                background: "var(--brand-orange)",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: busy || !newName.trim() ? "default" : "pointer",
                opacity: busy || !newName.trim() ? 0.6 : 1,
              }}
            >
              {busy ? "Lagrer…" : "Lagre"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ActionRow({
  label,
  onClick,
  disabled,
  danger,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        textAlign: "center",
        cursor: disabled ? "default" : "pointer",
        fontSize: 14,
        fontWeight: 600,
        color: danger ? "var(--danger)" : "var(--brand-ink)",
      }}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 2: Implement SaveFolderSheet**

Create `web/src/components/program/library/SaveFolderSheet.tsx`:

```tsx
"use client"
import { useState } from "react"
import {
  patchProgram,
  createFolder,
  type ProgramFolder,
} from "@/lib/api"

interface Props {
  open: boolean
  programId: string
  folders: ProgramFolder[]
  defaultFolderId: string | null
  onClose: () => void
  onSaved: () => void
}

export default function SaveFolderSheet({
  open,
  programId,
  folders,
  defaultFolderId,
  onClose,
  onSaved,
}: Props) {
  // First-time mode: no folders exist yet.
  const isFirstTime = folders.length === 0

  // Folder selection state. -1 means "create new", null means "no folder".
  const [selected, setSelected] = useState<string | "new" | null>(
    isFirstTime ? "new" : defaultFolderId
  )
  const [newFolderName, setNewFolderName] = useState(isFirstTime ? "Første split" : "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSave = async () => {
    setBusy(true)
    setError(null)
    try {
      let folderId: string | null = null
      if (selected === "new") {
        const trimmed = newFolderName.trim()
        if (!trimmed) {
          setError("Mappenavn kan ikke være tomt")
          setBusy(false)
          return
        }
        const created = await createFolder(trimmed)
        folderId = created.id
      } else {
        folderId = selected
      }
      await patchProgram(programId, { folder_id: folderId })
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lagre")
    } finally {
      setBusy(false)
    }
  }

  const handleSkip = async () => {
    setBusy(true)
    try {
      await patchProgram(programId, { folder_id: null })
      onSaved()
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
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
          maxHeight: "70vh",
          overflowY: "auto",
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
            marginBottom: 6,
          }}
        >
          {isFirstTime ? "Lag din første mappe" : "Lagre i mappe"}
        </div>
        {isFirstTime && (
          <div
            style={{
              fontSize: 12,
              color: "var(--brand-muted)",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            Hva vil du kalle den?
          </div>
        )}

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
            {error}
          </div>
        )}

        {!isFirstTime && (
          <>
            <SelectRow
              label="Ingen mappe"
              selected={selected === null}
              onClick={() => setSelected(null)}
            />
            {folders.map((f) => (
              <SelectRow
                key={f.id}
                label={`📁 ${f.name}`}
                selected={selected === f.id}
                onClick={() => setSelected(f.id)}
              />
            ))}
            <SelectRow
              label="+ Lag ny mappe…"
              selected={selected === "new"}
              onClick={() => setSelected("new")}
            />
          </>
        )}

        {(isFirstTime || selected === "new") && (
          <input
            autoFocus={isFirstTime}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Mappenavn"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--brand-surface)",
              border: "1.5px solid var(--brand-border)",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              color: "var(--brand-ink)",
              marginBottom: 12,
              marginTop: isFirstTime ? 0 : 6,
            }}
          />
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={busy || (selected === "new" && !newFolderName.trim())}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            fontWeight: 700,
            cursor: busy ? "default" : "pointer",
            opacity: busy ? 0.6 : 1,
            marginBottom: 8,
          }}
        >
          {busy ? "Lagrer…" : isFirstTime ? "Lagre i mappen" : "Lagre"}
        </button>

        {isFirstTime && (
          <button
            type="button"
            onClick={handleSkip}
            disabled={busy}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid var(--brand-border)",
              color: "var(--brand-muted)",
              borderRadius: 12,
              padding: 14,
              fontSize: 13,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
            }}
          >
            Hopp over (ingen mappe)
          </button>
        )}
      </div>
    </div>
  )
}

function SelectRow({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: selected ? "var(--brand-subtle)" : "var(--brand-surface)",
        border: `1px solid ${selected ? "var(--brand-orange)" : "var(--brand-border)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 6,
        textAlign: "left",
        cursor: "pointer",
        fontSize: 13,
        color: "var(--brand-ink)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{label}</span>
      {selected && <span style={{ color: "var(--brand-orange)", fontWeight: 700 }}>✓</span>}
    </button>
  )
}
```

- [ ] **Step 3: Run typecheck**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck
```
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/program/library/FolderActionsSheet.tsx web/src/components/program/library/SaveFolderSheet.tsx
git commit -m "feat(web): add FolderActionsSheet + SaveFolderSheet"
```

---

### Task 6: ProgramCard preview text extension

**Files:**
- Modify: `web/src/components/program/library/ProgramCard.tsx`
- Modify: `web/src/components/program/library/ProgramCard.test.tsx` (extend existing tests)

- [ ] **Step 1: Update Props type and add preview rendering**

REPLACE the contents of `web/src/components/program/library/ProgramCard.tsx` with:

```tsx
"use client"
import type { Program } from "@/lib/api"

interface Props {
  program: Pick<Program, "id" | "name" | "is_active" | "days_count">
  previewExercises?: string[] // first ~3 exercise names from day 1
  onOpen: (id: string) => void
}

export default function ProgramCard({ program, previewExercises, onOpen }: Props) {
  const daysLabel = program.days_count != null ? `${program.days_count} dager` : "Program"
  const previewText =
    previewExercises && previewExercises.length > 0 ? previewExercises.join(", ") : ""
  return (
    <button
      type="button"
      onClick={() => onOpen(program.id)}
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 14,
        padding: "14px 12px",
        minHeight: 120,
        textAlign: "left",
        cursor: "pointer",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {program.is_active && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "var(--brand-orange)",
            color: "#fff",
            fontSize: 8,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 999,
            letterSpacing: 0.4,
          }}
        >
          AKTIV
        </span>
      )}
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-ink)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
        {program.name}
      </div>
      <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 4, marginBottom: 8 }}>
        {daysLabel}
      </div>
      {previewText && (
        <div
          style={{
            fontSize: 10,
            color: "var(--brand-muted)",
            lineHeight: 1.4,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {previewText}
        </div>
      )}
    </button>
  )
}
```

(The orange muscle-icon block from the previous version is removed to match Strong's text-forward preview style.)

- [ ] **Step 2: Append preview test to existing ProgramCard.test.tsx**

Append to `web/src/components/program/library/ProgramCard.test.tsx`:

```tsx
it("renders preview text when previewExercises is provided", () => {
  render(
    <ProgramCard
      program={{ id: "p-5", name: "PPL", is_active: false, days_count: 6 }}
      previewExercises={["Back squat", "Bench press", "Deadlift"]}
      onOpen={() => {}}
    />
  )
  expect(screen.getByText(/Back squat, Bench press, Deadlift/)).toBeInTheDocument()
})

it("omits preview when previewExercises is empty", () => {
  render(
    <ProgramCard
      program={{ id: "p-6", name: "PPL", is_active: false, days_count: 6 }}
      previewExercises={[]}
      onOpen={() => {}}
    />
  )
  // Should not render any preview text
  expect(screen.queryByText(/,/)).not.toBeInTheDocument()
})
```

- [ ] **Step 3: Run all ProgramCard tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- ProgramCard.test --run
```
Expected: 6 PASS (4 existing + 2 new).

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/program/library/ProgramCard.tsx web/src/components/program/library/ProgramCard.test.tsx
git commit -m "feat(web): add preview text to ProgramCard"
```

---

### Task 7: ProgramLibrary restructure + page.tsx + delete FolderCard

**Files:**
- Modify: `web/src/components/program/library/ProgramLibrary.tsx` (full rewrite)
- Modify: `web/src/app/(tabs)/program/page.tsx` (extend server-side preview computation)
- Delete: `web/src/components/program/library/FolderCard.tsx`
- Delete: `web/src/components/program/library/FolderCard.test.tsx`

- [ ] **Step 1: Rewrite ProgramLibrary.tsx**

REPLACE the contents of `web/src/components/program/library/ProgramLibrary.tsx` with:

```tsx
"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  startWorkout,
  startEmptyWorkout,
  type Program,
  type ProgramFolder,
  type InProgressWorkout,
} from "@/lib/api"
import TodaysWorkoutBanner, { type BannerState } from "./TodaysWorkoutBanner"
import ProgramCard from "./ProgramCard"
import QuickStartCTA from "./QuickStartCTA"
import FolderPillBar from "./FolderPillBar"
import FolderActionsSheet from "./FolderActionsSheet"
import NewProgramSheet from "./NewProgramSheet"
import NewFolderSheet from "./NewFolderSheet"
import ProgramPickerSheet from "./ProgramPickerSheet"
import SaveFolderSheet from "./SaveFolderSheet"

export interface TodaysWorkoutInfo {
  programId: string
  dayId: string
  dayName: string
  exerciseCount: number
  nextDayName: string | null
}

interface Props {
  programs: Program[]
  folders: ProgramFolder[]
  todaysWorkout: TodaysWorkoutInfo | null
  hasActiveProgram: boolean
  inProgress: InProgressWorkout | null
  programPreviews: Record<string, string[]> // programId → first 3 exercise names
}

function deriveBannerState(props: Props): BannerState {
  if (props.inProgress) {
    return {
      kind: "in-progress",
      workoutId: props.inProgress.workout_id,
      dayName: "Pågående økt",
      setsLogged: props.inProgress.sets_logged,
    }
  }
  if (props.todaysWorkout) {
    return {
      kind: "today-ready",
      dayId: props.todaysWorkout.dayId,
      dayName: props.todaysWorkout.dayName,
      exerciseCount: props.todaysWorkout.exerciseCount,
    }
  }
  if (props.hasActiveProgram) {
    return { kind: "rest-day", nextDayName: null }
  }
  if (props.programs.length === 0) {
    return { kind: "empty" }
  }
  return { kind: "no-active", programCount: props.programs.length }
}

export default function ProgramLibrary(props: Props) {
  const router = useRouter()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [newProgramOpen, setNewProgramOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [folderActions, setFolderActions] = useState<ProgramFolder | null>(null)
  const [starting, setStarting] = useState(false)
  const [emptyStarting, setEmptyStarting] = useState(false)

  const bannerState = deriveBannerState(props)

  const visiblePrograms = useMemo(
    () =>
      selectedFolderId === null
        ? props.programs
        : props.programs.filter((p) => p.folder_id === selectedFolderId),
    [props.programs, selectedFolderId]
  )

  const handleStart = async () => {
    if (!props.todaysWorkout || starting) return
    setStarting(true)
    try {
      const { workout_id } = await startWorkout(props.todaysWorkout.dayId)
      router.push(`/program/workout/${workout_id}`)
    } catch {
      setStarting(false)
    }
  }

  const handleContinue = () => {
    if (props.inProgress) router.push(`/program/workout/${props.inProgress.workout_id}`)
  }

  const handleSeeProgram = () => {
    const active = props.programs.find((p) => p.is_active)
    if (active) router.push(`/program/${active.id}`)
  }

  const handleEmptyStart = async () => {
    if (emptyStarting) return
    setEmptyStarting(true)
    try {
      const { workout_id } = await startEmptyWorkout()
      router.push(`/program/workout/${workout_id}`)
    } catch {
      setEmptyStarting(false)
    }
  }

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "var(--brand-ink)",
          letterSpacing: "-0.03em",
          marginBottom: 14,
        }}
      >
        Trening
      </div>

      <TodaysWorkoutBanner
        state={bannerState}
        onStart={handleStart}
        onContinue={handleContinue}
        onSeeProgram={handleSeeProgram}
        onPickActive={() => setPickerOpen(true)}
        onCreateProgram={() => setNewProgramOpen(true)}
      />

      <QuickStartCTA onStart={handleEmptyStart} busy={emptyStarting} />

      <FolderPillBar
        folders={props.folders}
        totalProgramCount={props.programs.length}
        selectedFolderId={selectedFolderId}
        onSelect={setSelectedFolderId}
        onAddFolder={() => setNewFolderOpen(true)}
        onFolderLongPress={setFolderActions}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "4px 4px 10px",
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "var(--brand-ink)",
            letterSpacing: "-0.02em",
          }}
        >
          Programmer
        </span>
        <button
          type="button"
          onClick={() => setNewProgramOpen(true)}
          style={{
            background: "var(--brand-subtle)",
            border: "none",
            color: "var(--brand-orange)",
            borderRadius: 10,
            padding: "5px 10px",
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Nytt
        </button>
      </div>

      {visiblePrograms.length === 0 ? (
        <div
          style={{
            background: "var(--brand-surface)",
            border: "1px dashed var(--brand-border)",
            borderRadius: 12,
            padding: "16px 12px",
            textAlign: "center",
            color: "var(--brand-muted)",
            fontSize: 12,
            marginBottom: 18,
          }}
        >
          {selectedFolderId === null
            ? "Ingen programmer enda"
            : "Ingen programmer i denne mappen. Flytt et hit fra ⋯-menyen."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {visiblePrograms.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              previewExercises={props.programPreviews[p.id] ?? []}
              onOpen={(id) => router.push(`/program/${id}`)}
            />
          ))}
        </div>
      )}

      <NewProgramSheet open={newProgramOpen} onClose={() => setNewProgramOpen(false)} />
      <NewFolderSheet
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreated={() => router.refresh()}
      />
      <ProgramPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        programs={props.programs}
        onActivated={() => router.refresh()}
      />
      <FolderActionsSheet
        folder={folderActions}
        onClose={() => setFolderActions(null)}
        onChanged={() => {
          // If the user just deleted the currently-selected folder, reset to "Alle"
          if (folderActions && selectedFolderId === folderActions.id) {
            setSelectedFolderId(null)
          }
          router.refresh()
        }}
      />
      {/* SaveFolderSheet not wired here in this task — wired in a follow-up when
          NewProgramSheet completion callback is implemented. For now first-time
          first-program flow falls back to root (folder_id = null). */}
      {/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */}
      {false && (
        <SaveFolderSheet
          open={false}
          programId=""
          folders={props.folders}
          defaultFolderId={selectedFolderId}
          onClose={() => {}}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update server-side page.tsx to compute previews**

REPLACE the contents of `web/src/app/(tabs)/program/page.tsx` with:

```tsx
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import ProgramLibrary, {
  type TodaysWorkoutInfo,
} from "@/components/program/library/ProgramLibrary"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

async function safeFetch(path: string, token: string): Promise<unknown> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

interface ActiveProgramShape {
  id: string
  days: { id: string; day_number: number; name: string; exercises: { name: string }[] }[]
}

function computeTodaysWorkout(active: ActiveProgramShape | null): TodaysWorkoutInfo | null {
  if (!active) return null
  const jsDay = new Date().getDay()
  const todayDayNumber = jsDay === 0 ? 7 : jsDay
  const day = active.days.find((d) => d.day_number === todayDayNumber)
  if (!day || day.exercises.length === 0) return null
  return {
    programId: active.id,
    dayId: day.id,
    dayName: day.name,
    exerciseCount: day.exercises.length,
    nextDayName: null,
  }
}

async function fetchProgramPreviews(
  programIds: string[],
  token: string
): Promise<Record<string, string[]>> {
  // Fetch each program in parallel and grab the first 3 exercise names from day 1.
  // For programs with many days, day 1's exercise list is a good summary.
  const previews = await Promise.all(
    programIds.map(async (id) => {
      const data = (await safeFetch(`/api/programs/${id}`, token)) as {
        days?: { exercises?: { name?: string }[] }[]
      } | null
      const firstDayExercises = data?.days?.[0]?.exercises ?? []
      const names = firstDayExercises
        .map((e) => e.name)
        .filter((n): n is string => typeof n === "string")
        .slice(0, 3)
      return [id, names] as const
    })
  )
  return Object.fromEntries(previews)
}

export default async function ProgramPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const token = session.access_token

  const [programs, folders, active, inProgress] = await Promise.all([
    safeFetch("/api/programs", token),
    safeFetch("/api/folders", token),
    safeFetch("/api/programs/active", token),
    safeFetch("/api/workouts/in-progress", token),
  ])

  const programList =
    (programs as Parameters<typeof ProgramLibrary>[0]["programs"]) ?? []
  const folderList =
    (folders as Parameters<typeof ProgramLibrary>[0]["folders"]) ?? []
  const todays = computeTodaysWorkout(active as ActiveProgramShape | null)
  const hasActive = active !== null

  const previews = await fetchProgramPreviews(
    programList.map((p) => p.id),
    token
  )

  return (
    <ProgramLibrary
      programs={programList}
      folders={folderList}
      todaysWorkout={todays}
      hasActiveProgram={hasActive}
      inProgress={
        (inProgress as Parameters<typeof ProgramLibrary>[0]["inProgress"]) ?? null
      }
      programPreviews={previews}
    />
  )
}
```

- [ ] **Step 3: Delete FolderCard files**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
rm web/src/components/program/library/FolderCard.tsx
rm web/src/components/program/library/FolderCard.test.tsx
```

- [ ] **Step 4: Run typecheck + program tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck && npm run test -- program --run
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/program/library/ProgramLibrary.tsx "web/src/app/(tabs)/program/page.tsx"
git add -u web/src/components/program/library/FolderCard.tsx web/src/components/program/library/FolderCard.test.tsx
git commit -m "feat(web): restructure ProgramLibrary with folder pills + quick start + previews"
```

---

## Phase 4: Workout ad-hoc mode

### Task 8: ExercisePickerSheet

**Files:**
- Create: `web/src/components/program/workout/ExercisePickerSheet.tsx`

- [ ] **Step 1: Implement ExercisePickerSheet**

Create `web/src/components/program/workout/ExercisePickerSheet.tsx`:

```tsx
"use client"
import { useEffect, useMemo, useState } from "react"
import { getExercises, type Exercise } from "@/lib/api"

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
      .filter((e) =>
        e.name.toLowerCase().includes(q) ||
        e.muscle_groups.some((mg) => mg.toLowerCase().includes(q))
      )
      .slice(0, 100)
  }, [exercises, query])

  if (!open) return null

  return (
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
                onClick={() => {
                  onPick(ex)
                  onClose()
                }}
                style={{
                  width: "100%",
                  background: "var(--brand-surface)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 6,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>{ex.name}</div>
                {ex.muscle_groups.length > 0 && (
                  <div style={{ fontSize: 10, color: "var(--brand-muted)", marginTop: 2 }}>
                    {ex.muscle_groups.join(", ")}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
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
git add web/src/components/program/workout/ExercisePickerSheet.tsx
git commit -m "feat(web): add ExercisePickerSheet for ad-hoc workout"
```

---

### Task 9: SaveAsProgramSheet

**Files:**
- Create: `web/src/components/program/workout/SaveAsProgramSheet.tsx`

- [ ] **Step 1: Implement SaveAsProgramSheet**

Create `web/src/components/program/workout/SaveAsProgramSheet.tsx`:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createProgramFromWorkout, createFolder, type ProgramFolder } from "@/lib/api"

interface Props {
  open: boolean
  workoutId: string
  folders: ProgramFolder[]
  hasLoggedSets: boolean
  onClose: () => void
}

export default function SaveAsProgramSheet({
  open,
  workoutId,
  folders,
  hasLoggedSets,
  onClose,
}: Props) {
  const router = useRouter()
  const today = new Date().toLocaleDateString("no-NO", { day: "numeric", month: "long" })
  const [name, setName] = useState(`Tom økt ${today}`)
  const [selected, setSelected] = useState<string | "new" | null>(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSaveAsProgram = async () => {
    setBusy(true)
    setError(null)
    try {
      let folderId: string | null = null
      if (selected === "new") {
        const trimmed = newFolderName.trim()
        if (!trimmed) {
          setError("Mappenavn kan ikke være tomt")
          setBusy(false)
          return
        }
        const created = await createFolder(trimmed)
        folderId = created.id
      } else {
        folderId = selected
      }
      await createProgramFromWorkout({
        workout_id: workoutId,
        name: name.trim() || `Tom økt ${today}`,
        folder_id: folderId,
      })
      router.push("/program")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kunne ikke lagre program")
      setBusy(false)
    }
  }

  const handleSkip = () => router.push("/program")

  return (
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
          padding: "20px 20px 28px",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: "var(--brand-muted)",
            marginBottom: 6,
          }}
        >
          Økt fullført 🎉
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "var(--brand-ink)",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Lagre som program?
        </div>
        <div style={{ fontSize: 12, color: "var(--brand-muted)", marginBottom: 16 }}>
          Lar deg gjenta denne økten senere.
        </div>

        {!hasLoggedSets && (
          <div
            style={{
              background: "var(--brand-subtle)",
              border: "1px solid var(--brand-orange-soft)",
              borderRadius: 10,
              padding: 10,
              fontSize: 12,
              color: "var(--brand-muted)",
              marginBottom: 12,
            }}
          >
            Ingen sett logget — kan ikke lagres som program.
          </div>
        )}

        {hasLoggedSets && (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--brand-muted)", marginBottom: 4 }}>
              Navn
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "var(--brand-surface)",
                border: "1.5px solid var(--brand-border)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                color: "var(--brand-ink)",
                marginBottom: 14,
              }}
            />

            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--brand-muted)", marginBottom: 4 }}>
              Mappe
            </div>
            <SelectRow
              label="Ingen mappe"
              selected={selected === null}
              onClick={() => setSelected(null)}
            />
            {folders.map((f) => (
              <SelectRow
                key={f.id}
                label={`📁 ${f.name}`}
                selected={selected === f.id}
                onClick={() => setSelected(f.id)}
              />
            ))}
            <SelectRow
              label="+ Lag ny mappe…"
              selected={selected === "new"}
              onClick={() => setSelected("new")}
            />

            {selected === "new" && (
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Mappenavn"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  background: "var(--brand-surface)",
                  border: "1.5px solid var(--brand-border)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--brand-ink)",
                  margin: "6px 0 10px",
                }}
              />
            )}
          </>
        )}

        {error && (
          <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10, textAlign: "center" }}>
            {error}
          </div>
        )}

        {hasLoggedSets && (
          <button
            type="button"
            onClick={handleSaveAsProgram}
            disabled={busy}
            style={{
              width: "100%",
              background: "var(--brand-orange)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.7 : 1,
              marginBottom: 8,
              marginTop: 10,
            }}
          >
            {busy ? "Lagrer…" : "Lagre som program"}
          </button>
        )}

        <button
          type="button"
          onClick={handleSkip}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--brand-border)",
            color: "var(--brand-muted)",
            borderRadius: 12,
            padding: 14,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {hasLoggedSets ? "Bare lagre økten" : "Tilbake til Trening"}
        </button>
      </div>
    </div>
  )
}

function SelectRow({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        background: selected ? "var(--brand-subtle)" : "var(--brand-surface)",
        border: `1px solid ${selected ? "var(--brand-orange)" : "var(--brand-border)"}`,
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 6,
        textAlign: "left",
        cursor: "pointer",
        fontSize: 13,
        color: "var(--brand-ink)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>{label}</span>
      {selected && <span style={{ color: "var(--brand-orange)", fontWeight: 700 }}>✓</span>}
    </button>
  )
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
git add web/src/components/program/workout/SaveAsProgramSheet.tsx
git commit -m "feat(web): add SaveAsProgramSheet for ad-hoc workout completion"
```

---

### Task 10: WorkoutRun ad-hoc mode + WorkoutExerciseRow "+ Add set"

**Files:**
- Modify: `web/src/components/program/workout/WorkoutExerciseRow.tsx` (extend with "+ Legg til sett" in ad-hoc)
- Modify: `web/src/components/program/workout/WorkoutRun.tsx` (full rewrite for ad-hoc support)
- Modify: `api/app/routers/workouts.py` — `GET /api/workouts/{id}` already supports null `day_name`/empty exercises; no change.

- [ ] **Step 1: Extend WorkoutExerciseRow with an optional add-set button**

REPLACE the contents of `web/src/components/program/workout/WorkoutExerciseRow.tsx` with:

```tsx
"use client"
import { useState, useEffect } from "react"
import type { ProgramExercise } from "@/lib/api"

export interface SetLog {
  reps: number
  weightKg: number | null
  done: boolean
}

interface Props {
  ex: ProgramExercise
  log: SetLog[]
  onCheck: (setIndex: number, reps: number, weightKg: number | null) => void
  onAddSet?: () => void // only present in ad-hoc mode
}

export default function WorkoutExerciseRow({ ex, log, onCheck, onAddSet }: Props) {
  const [local, setLocal] = useState(log)

  // Keep local state synced when parent re-renders with new log
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setLocal(log)
  }, [log])

  const target = ex.sets[0]
  const targetReps = target?.reps ?? "–"
  const targetWeight = target?.weight_kg != null ? `${target.weight_kg} kg` : "BW"

  return (
    <div
      style={{
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 10,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-ink)" }}>{ex.name}</div>
      {ex.sets.length > 0 ? (
        <div style={{ fontSize: 11, color: "var(--brand-muted)", marginBottom: 8 }}>
          {ex.sets.length} × {targetReps} · {targetWeight}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--brand-muted)", marginBottom: 8 }}>
          Ingen sett ennå
        </div>
      )}

      {local.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr 1fr 32px",
            gap: 6,
            marginBottom: 4,
            fontSize: 9,
            color: "var(--brand-faint)",
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          <span>#</span>
          <span>Reps</span>
          <span>Kg</span>
          <span />
        </div>
      )}

      {local.map((s, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "20px 1fr 1fr 32px",
            gap: 6,
            padding: "5px 0",
            background: s.done ? "var(--brand-subtle)" : "transparent",
            borderRadius: 6,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--brand-faint)", fontWeight: 600 }}>{i + 1}</span>
          <input
            type="number"
            inputMode="numeric"
            aria-label={`Reps sett ${i + 1}`}
            value={s.reps}
            disabled={s.done}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10)
              if (isNaN(n)) return
              setLocal((prev) => prev.map((p, idx) => (idx === i ? { ...p, reps: n } : p)))
            }}
            style={inputStyle(s.done)}
          />
          <input
            type="number"
            inputMode="decimal"
            aria-label={`Kg sett ${i + 1}`}
            value={s.weightKg ?? ""}
            placeholder="BW"
            disabled={s.done}
            onChange={(e) => {
              const n = parseFloat(e.target.value)
              const kg = isNaN(n) ? null : n
              setLocal((prev) => prev.map((p, idx) => (idx === i ? { ...p, weightKg: kg } : p)))
            }}
            style={inputStyle(s.done)}
          />
          <button
            type="button"
            aria-label={`Fullfør sett ${i + 1}`}
            disabled={s.done}
            onClick={() => onCheck(i, local[i].reps, local[i].weightKg)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: s.done ? "none" : "1px solid var(--brand-border)",
              background: s.done ? "var(--brand-orange)" : "var(--brand-surface)",
              color: s.done ? "#fff" : "var(--brand-muted)",
              cursor: s.done ? "default" : "pointer",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
            }}
          >
            ✓
          </button>
        </div>
      ))}

      {onAddSet && (
        <button
          type="button"
          onClick={onAddSet}
          style={{
            marginTop: 8,
            width: "100%",
            background: "transparent",
            border: "1px dashed var(--brand-border)",
            color: "var(--brand-orange)",
            borderRadius: 8,
            padding: "8px 0",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          + Legg til sett
        </button>
      )}
    </div>
  )
}

function inputStyle(done: boolean): React.CSSProperties {
  return {
    background: done ? "transparent" : "var(--brand-canvas)",
    border: done ? "none" : "1px solid var(--brand-border)",
    borderRadius: 8,
    padding: "5px 8px",
    color: done ? "var(--brand-muted)" : "var(--brand-ink)",
    fontSize: 13,
    fontWeight: 600,
    width: "100%",
    boxSizing: "border-box",
  }
}
```

- [ ] **Step 2: Run existing WorkoutExerciseRow tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run test -- WorkoutExerciseRow.test --run
```
Expected: 3/3 PASS (existing tests don't pass `onAddSet`, so no add-set button rendered — no regression).

- [ ] **Step 3: Rewrite WorkoutRun.tsx for ad-hoc support**

REPLACE the contents of `web/src/components/program/workout/WorkoutRun.tsx` with:

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  logSet,
  completeWorkout,
  type ProgramExercise,
  type ProgramFolder,
  type WorkoutDetail,
  type Exercise,
} from "@/lib/api"
import WorkoutHeader from "./WorkoutHeader"
import CloseConfirmSheet from "./CloseConfirmSheet"
import WorkoutExerciseRow, { type SetLog } from "./WorkoutExerciseRow"
import RestTimer from "./RestTimer"
import ShareSheet from "./ShareSheet"
import ExercisePickerSheet from "./ExercisePickerSheet"
import SaveAsProgramSheet from "./SaveAsProgramSheet"

interface Props {
  workout: WorkoutDetail
  folders: ProgramFolder[]
}

function buildInitialLog(
  exercises: ProgramExercise[],
  logged: WorkoutDetail["logged_sets"]
): Record<string, SetLog[]> {
  const out: Record<string, SetLog[]> = {}
  for (const ex of exercises) {
    out[ex.id] = ex.sets.map((s) => {
      const matched = logged.find(
        (l) => l.exercise_id === ex.exercise_id && l.set_number === s.set_number
      )
      return matched
        ? { reps: matched.reps, weightKg: matched.weight_kg, done: true }
        : { reps: s.reps, weightKg: s.weight_kg, done: false }
    })
  }
  return out
}

export default function WorkoutRun({ workout, folders }: Props) {
  const router = useRouter()
  const isAdHoc = workout.day_name === null

  // For ad-hoc, exercises mutate as the user adds them. For program mode, exercises stay fixed.
  const [exercises, setExercises] = useState<ProgramExercise[]>(workout.exercises)
  const [setLog, setSetLog] = useState<Record<string, SetLog[]>>(
    buildInitialLog(workout.exercises, workout.logged_sets)
  )
  const [closeOpen, setCloseOpen] = useState(false)
  const [restOpen, setRestOpen] = useState(false)
  const [restSeconds] = useState(() => {
    if (typeof window === "undefined") return 90
    return parseInt(localStorage.getItem("restTimerSeconds") ?? "90", 10)
  })
  const [completing, setCompleting] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [saveAsProgramOpen, setSaveAsProgramOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // For program-mode: all sets done. For ad-hoc: any sets logged.
  const allProgramSetsDone = !isAdHoc &&
    exercises.length > 0 &&
    exercises.every((ex) => (setLog[ex.id] ?? []).every((s) => s.done))

  const hasAnyLoggedSet = Object.values(setLog).some((log) => log.some((s) => s.done))

  const handleCheck = async (
    ex: ProgramExercise,
    setIndex: number,
    reps: number,
    weightKg: number | null
  ) => {
    // optimistic
    setSetLog((prev) => ({
      ...prev,
      [ex.id]: prev[ex.id].map((s, i) =>
        i === setIndex ? { ...s, reps, weightKg, done: true } : s
      ),
    }))
    setRestOpen(true)
    try {
      await logSet(workout.workout_id, {
        exercise_id: ex.exercise_id,
        set_number: setIndex + 1,
        reps,
        weight_kg: weightKg,
      })
    } catch {
      try {
        await logSet(workout.workout_id, {
          exercise_id: ex.exercise_id,
          set_number: setIndex + 1,
          reps,
          weight_kg: weightKg,
        })
      } catch {
        /* silent — set stays optimistically logged */
      }
    }
  }

  const handleAddSet = (exerciseId: string) => {
    setSetLog((prev) => {
      const existing = prev[exerciseId] ?? []
      const lastSet = existing[existing.length - 1]
      const defaultReps = lastSet?.reps ?? 8
      const defaultKg = lastSet?.weightKg ?? null
      return {
        ...prev,
        [exerciseId]: [...existing, { reps: defaultReps, weightKg: defaultKg, done: false }],
      }
    })
  }

  const handlePickExercise = (ex: Exercise) => {
    // Convert to ProgramExercise shape (no real program_exercise row — purely client-side).
    const newProgEx: ProgramExercise = {
      id: `ad-hoc-${ex.id}-${Date.now()}`,
      exercise_id: ex.id,
      name: ex.name,
      muscle_groups: ex.muscle_groups,
      order_index: exercises.length,
      sets: [],
    }
    setExercises((prev) => [...prev, newProgEx])
    setSetLog((prev) => ({ ...prev, [newProgEx.id]: [] }))
  }

  const handleComplete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      await completeWorkout(workout.workout_id)
      if (isAdHoc) {
        setSaveAsProgramOpen(true)
      } else {
        setShareOpen(true)
      }
    } catch {
      setCompleting(false)
    }
  }

  return (
    <div
      style={{
        background: "var(--brand-canvas)",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <WorkoutHeader
        startedAt={workout.started_at}
        dayName={workout.day_name ?? "Tom økt"}
        onClose={() => setCloseOpen(true)}
      />

      <div style={{ flex: 1, padding: "0 20px 120px", overflowY: "auto" }}>
        {exercises.length === 0 ? (
          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px dashed var(--brand-border)",
              borderRadius: 12,
              padding: "20px 12px",
              textAlign: "center",
              color: "var(--brand-muted)",
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            Ingen øvelser ennå.
          </div>
        ) : (
          exercises.map((ex) => (
            <WorkoutExerciseRow
              key={ex.id}
              ex={ex}
              log={setLog[ex.id] ?? []}
              onCheck={(i, reps, kg) => handleCheck(ex, i, reps, kg)}
              onAddSet={isAdHoc ? () => handleAddSet(ex.id) : undefined}
            />
          ))
        )}

        {isAdHoc && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            style={{
              width: "100%",
              background: "var(--brand-subtle)",
              border: "1px dashed var(--brand-orange)",
              color: "var(--brand-orange)",
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 8,
            }}
          >
            + Legg til øvelse
          </button>
        )}
      </div>

      {(allProgramSetsDone || (isAdHoc && hasAnyLoggedSet)) && !shareOpen && !saveAsProgramOpen && (
        <div
          style={{
            padding: "12px 20px 20px",
            borderTop: "1px solid var(--brand-border)",
            background: "var(--brand-canvas)",
          }}
        >
          <button
            type="button"
            onClick={handleComplete}
            disabled={completing}
            style={{
              width: "100%",
              background: "var(--brand-orange)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: completing ? "default" : "pointer",
              opacity: completing ? 0.7 : 1,
            }}
          >
            {completing ? "Fullfører…" : "Fullfør økt ✓"}
          </button>
        </div>
      )}

      {restOpen && (
        <RestTimer
          seconds={restSeconds}
          onDone={() => setRestOpen(false)}
          onChangeDefault={(s) => localStorage.setItem("restTimerSeconds", String(s))}
        />
      )}

      <CloseConfirmSheet
        open={closeOpen}
        workoutId={workout.workout_id}
        onCancel={() => setCloseOpen(false)}
      />

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={handlePickExercise}
      />

      {shareOpen && (
        <ShareSheet
          workoutId={workout.workout_id}
          exercises={exercises}
          setLog={setLog}
          onClose={() => router.push("/program")}
        />
      )}

      <SaveAsProgramSheet
        open={saveAsProgramOpen}
        workoutId={workout.workout_id}
        folders={folders}
        hasLoggedSets={hasAnyLoggedSet}
        onClose={() => setSaveAsProgramOpen(false)}
      />
    </div>
  )
}
```

- [ ] **Step 4: Update `workout/[workoutId]/page.tsx` to pass folders**

REPLACE the contents of `web/src/app/(tabs)/program/workout/[workoutId]/page.tsx` with:

```tsx
import { redirect, notFound } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import WorkoutRun from "@/components/program/workout/WorkoutRun"
import type { WorkoutDetail, ProgramFolder } from "@/lib/api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

interface PageProps {
  params: Promise<{ workoutId: string }>
}

export default async function WorkoutRunPage({ params }: PageProps) {
  const { workoutId } = await params

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect("/login")
  const headers = { Authorization: `Bearer ${session.access_token}` }

  const [workoutRes, foldersRes] = await Promise.all([
    fetch(`${API_BASE}/api/workouts/${workoutId}`, { headers, cache: "no-store" }),
    fetch(`${API_BASE}/api/folders`, { headers, cache: "no-store" }),
  ])

  if (workoutRes.status === 404) notFound()
  if (!workoutRes.ok) throw new Error(`Failed to load workout: ${workoutRes.status}`)

  const workout = (await workoutRes.json()) as WorkoutDetail
  const folders = (foldersRes.ok ? await foldersRes.json() : []) as ProgramFolder[]

  return <WorkoutRun workout={workout} folders={folders} />
}
```

- [ ] **Step 5: Run typecheck + all program tests**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web && npm run typecheck && npm run test -- program --run
```
Expected: all PASS.

- [ ] **Step 6: Run full check**

```bash
cd /Users/trymvestengen/Desktop/ai-coach && make check
```
Expected: lint + typecheck + tests + build all PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/components/program/workout/WorkoutExerciseRow.tsx web/src/components/program/workout/WorkoutRun.tsx "web/src/app/(tabs)/program/workout/[workoutId]/page.tsx"
git commit -m "feat(web): WorkoutRun ad-hoc mode with add-exercise + add-set + save-as-program"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ New layout (Trening-tittel + banner + quick-start + pill-bar + grid) — Task 3, 7
- ✅ FolderPillBar + Alle-default + long-press → FolderActionsSheet — Tasks 4, 5, 7
- ✅ QuickStartCTA — Task 3, 7
- ✅ ProgramCard preview text — Task 6
- ✅ First-time + ongoing program-creation flow with SaveFolderSheet — Task 5 (component exists; note: spec calls for `NewProgramSheet`-completion-callback wiring which is flagged as out-of-scope in Task 7 since `NewProgramSheet` is a placeholder for coach/template/scratch — the SaveFolderSheet component is built and ready but only wires up once those completion paths are implemented)
- ✅ Ad-hoc workout: start, add exercises, add sets, fullfør, save-as-program — Tasks 2, 8, 9, 10
- ✅ `POST /api/programs/from-workout` backend — Task 1
- ✅ Delete FolderCard — Task 7

**2. Placeholder scan:** No "TBD"/"TODO"/"add error handling" patterns. Task 7 has an explicit annotated note about SaveFolderSheet wiring being conditional on NewProgramSheet completion paths — that's a conscious deferral, not a placeholder.

**3. Type consistency:** `ProgramFolder` (program_count field), `BannerState` (5 kinds), `SetLog` (reps/weightKg/done), `WorkoutDetail` (day_name nullable) — all consistent across tasks. `createProgramFromWorkout` body matches the Pydantic `FromWorkoutBody`.

Plan is ready for execution.
