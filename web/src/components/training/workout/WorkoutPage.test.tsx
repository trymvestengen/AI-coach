import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import WorkoutPage from "./WorkoutPage"
import * as api from "@/lib/api"
import type { TemplateDetail, WorkoutDetail, TemplateFolder } from "@/lib/api"

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

vi.mock("@/lib/api", () => ({
  getPreviousSets: vi.fn(),
  logSet: vi.fn(),
  completeWorkout: vi.fn(),
  discardWorkout: vi.fn(),
  startWorkoutFromTemplate: vi.fn(),
  updateTemplateExercise: vi.fn(),
  addExerciseToTemplate: vi.fn(),
  removeExerciseFromTemplate: vi.fn(),
  removeWorkoutExercise: vi.fn(),
  swapWorkoutExercise: vi.fn(),
}))

vi.mock("@/lib/oneRepMax", () => ({
  epley1rm: vi.fn().mockReturnValue(100),
  bestE1rm: vi.fn().mockReturnValue(0),
}))

vi.mock("@/components/exercises/ExercisePicker", () => ({
  default: ({
    open,
    onConfirm,
    onClose,
  }: {
    open: boolean
    onConfirm: (ids: string[]) => void
    onClose: () => void
  }) =>
    open ? (
      <div data-testid="exercise-picker">
        <button onClick={() => onConfirm(["new-ex"])}>Bekreft</button>
        <button onClick={onClose}>Lukk</button>
      </div>
    ) : null,
}))

vi.mock("@/components/training/detail/TemplateMenuSheet", () => ({
  default: ({
    template,
    onClose,
    onChanged,
    onDeleted,
  }: {
    template: { id: string; name: string } | null
    onClose: () => void
    onChanged: () => void
    onDeleted: () => void
  }) =>
    template ? (
      <div data-testid="template-menu">
        <span data-testid="menu-template-id">{template.id}</span>
        <button onClick={onClose}>Lukk meny</button>
        <button onClick={onChanged}>Endret</button>
        <button onClick={onDeleted}>Slettet</button>
      </div>
    ) : null,
}))

/* ── Fixtures ─────────────────────────────────────────────── */

const template: TemplateDetail = {
  id: "t-1",
  name: "Push A",
  folder_id: null,
  exercises: [
    {
      id: "te-1",
      exercise_id: "bench-press",
      position: 0,
      sets: [
        { id: "s-1", set_number: 1, reps: 8, weight_kg: 60 },
        { id: "s-2", set_number: 2, reps: 8, weight_kg: 60 },
        { id: "s-3", set_number: 3, reps: 8, weight_kg: 60 },
      ],
    },
    {
      id: "te-2",
      exercise_id: "shoulder-press",
      position: 1,
      sets: [{ id: "s-4", set_number: 1, reps: 10, weight_kg: null }],
    },
  ],
}

const workout: WorkoutDetail = {
  workout_id: "w-1",
  template_id: "t-1",
  started_at: "2026-06-14T10:00:00Z",
  completed_at: null,
  day_name: "Push A",
  exercises: [
    {
      id: "we-1",
      exercise_id: "bench-press",
      name: "Bench Press",
      muscle_groups: ["chest"],
      order_index: 0,
      notes: null,
      image_url: null,
      sets: [
        { id: "s-1", set_number: 1, reps: 8, weight_kg: 60, notes: null },
        { id: "s-2", set_number: 2, reps: 8, weight_kg: 60, notes: null },
      ],
    },
  ],
  logged_sets: [],
}

const exerciseNames: Record<string, string> = {
  "bench-press": "Benkpress",
  "shoulder-press": "Skulderpress",
}

const folders: TemplateFolder[] = [{ id: "f-1", name: "PPL", template_count: 1 }]

function renderPlanning(overrides?: Partial<TemplateDetail>) {
  return render(
    <WorkoutPage
      mode="planning"
      template={overrides ? { ...template, ...overrides } : template}
      exerciseNames={exerciseNames}
      folders={folders}
    />
  )
}

function renderActive(overrides?: Partial<WorkoutDetail>) {
  return render(
    <WorkoutPage
      mode="active"
      workout={overrides ? { ...workout, ...overrides } : workout}
      exerciseNames={exerciseNames}
      folders={folders}
    />
  )
}

/* ── Tests ────────────────────────────────────────────────── */

describe("WorkoutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getPreviousSets).mockResolvedValue({})
    vi.mocked(api.logSet).mockResolvedValue(undefined)
    vi.mocked(api.completeWorkout).mockResolvedValue(undefined)
    vi.mocked(api.discardWorkout).mockResolvedValue(undefined)
    vi.mocked(api.startWorkoutFromTemplate).mockResolvedValue({
      workout_id: "w-new",
      template_id: "t-1",
    })
    vi.mocked(api.updateTemplateExercise).mockResolvedValue({ id: "te-1", status: "ok" })
    vi.mocked(api.addExerciseToTemplate).mockResolvedValue({
      template_exercise_id: "te-new",
      exercise_id: "new-ex",
    })
    vi.mocked(api.removeExerciseFromTemplate).mockResolvedValue(undefined)
  })

  /* ── Atferd 1: Grid + norske labels ──────────────────────── */

  it("viser norsk kolonne-header SETT / FORRIGE / KG / REPS i planleggings-modus", () => {
    renderPlanning()
    expect(screen.getAllByText("SETT").length).toBeGreaterThan(0)
    expect(screen.getAllByText("FORRIGE").length).toBeGreaterThan(0)
    expect(screen.getAllByText("KG").length).toBeGreaterThan(0)
    expect(screen.getAllByText("REPS").length).toBeGreaterThan(0)
  })

  it("planleggings-modus mangler ✓-knapp", () => {
    renderPlanning()
    expect(screen.queryByRole("button", { name: /Marker som fullført/i })).not.toBeInTheDocument()
  })

  it("aktiv-modus viser ✓-knapp for hvert sett", () => {
    renderActive()
    const doneButtons = screen.getAllByRole("button", { name: /Marker som fullført/i })
    expect(doneButtons.length).toBeGreaterThan(0)
  })

  it("viser SETT / FORRIGE / KG / REPS i aktiv-modus", () => {
    renderActive()
    expect(screen.getAllByText("SETT").length).toBeGreaterThan(0)
    expect(screen.getAllByText("FORRIGE").length).toBeGreaterThan(0)
    expect(screen.getAllByText("KG").length).toBeGreaterThan(0)
    expect(screen.getAllByText("REPS").length).toBeGreaterThan(0)
  })

  /* ── Atferd 2: Primærknapp ───────────────────────────────── */

  it('planleggings-modus har knapp "Start økt"', () => {
    renderPlanning()
    expect(screen.getByRole("button", { name: "Start økt" })).toBeInTheDocument()
  })

  it('aktiv-modus har knapp "Fullfør"', () => {
    renderActive()
    expect(screen.getByRole("button", { name: "Fullfør" })).toBeInTheDocument()
  })
})
