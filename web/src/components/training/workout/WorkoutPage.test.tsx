import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
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

  /* ── Atferd 3: Planleggings-redigering ───────────────────── */

  it("onBlur på reps-felt kaller updateTemplateExercise med reps", async () => {
    renderPlanning()
    const repsInput = screen.getAllByLabelText(/Reps for Benkpress/i)[0]
    fireEvent.blur(repsInput, { target: { value: "12" } })
    await waitFor(() =>
      expect(api.updateTemplateExercise).toHaveBeenCalledWith("t-1", "bench-press", { reps: 12 })
    )
  })

  it("onBlur på kg-felt kaller updateTemplateExercise med weight_kg", async () => {
    renderPlanning()
    const kgInput = screen.getAllByLabelText(/Vekt for Benkpress/i)[0]
    fireEvent.blur(kgInput, { target: { value: "80" } })
    await waitFor(() =>
      expect(api.updateTemplateExercise).toHaveBeenCalledWith("t-1", "bench-press", {
        weight_kg: 80,
      })
    )
  })

  it("+ sett kaller updateTemplateExercise med sets+1", async () => {
    renderPlanning()
    const addSetBtns = screen.getAllByRole("button", { name: "Flere sett" })
    fireEvent.click(addSetBtns[0])
    await waitFor(() =>
      expect(api.updateTemplateExercise).toHaveBeenCalledWith("t-1", "bench-press", { sets: 4 })
    )
  })

  it("- sett kaller updateTemplateExercise med sets-1", async () => {
    renderPlanning()
    const removeSetBtns = screen.getAllByRole("button", { name: "Færre sett" })
    fireEvent.click(removeSetBtns[0])
    await waitFor(() =>
      expect(api.updateTemplateExercise).toHaveBeenCalledWith("t-1", "bench-press", { sets: 2 })
    )
  })

  it("Fjern-knapp kaller removeExerciseFromTemplate og router.refresh", async () => {
    renderPlanning()
    fireEvent.click(screen.getByRole("button", { name: /Fjern Benkpress/i }))
    await waitFor(() =>
      expect(api.removeExerciseFromTemplate).toHaveBeenCalledWith("t-1", "bench-press")
    )
    expect(mockRefresh).toHaveBeenCalled()
  })

  /* ── Atferd 4: Planleggings-picker ───────────────────────── */

  it("+ Legg til øvelse åpner ExercisePicker", () => {
    renderPlanning()
    fireEvent.click(screen.getByRole("button", { name: /Legg til øvelse/i }))
    expect(screen.getByTestId("exercise-picker")).toBeInTheDocument()
  })

  it("onConfirm fra ExercisePicker kaller addExerciseToTemplate", async () => {
    renderPlanning()
    fireEvent.click(screen.getByRole("button", { name: /Legg til øvelse/i }))
    fireEvent.click(screen.getByRole("button", { name: "Bekreft" }))
    await waitFor(() =>
      expect(api.addExerciseToTemplate).toHaveBeenCalledWith("t-1", { exercise_id: "new-ex" })
    )
  })

  /* ── Atferd 10: Start økt ────────────────────────────────── */

  it("Start økt kaller startWorkoutFromTemplate og navigerer", async () => {
    renderPlanning()
    fireEvent.click(screen.getByRole("button", { name: "Start økt" }))
    await waitFor(() => expect(api.startWorkoutFromTemplate).toHaveBeenCalledWith("t-1"))
    expect(mockPush).toHaveBeenCalledWith("/program/workout/w-new")
  })

  /* ── Atferd 5: Aktiv logging ─────────────────────────────── */

  it("✓ klikk kaller logSet med riktig data", async () => {
    renderActive()
    const doneBtn = screen.getAllByRole("button", { name: /Marker som fullført/i })[0]
    fireEvent.click(doneBtn)
    await waitFor(() =>
      expect(api.logSet).toHaveBeenCalledWith("w-1", {
        exercise_id: "bench-press",
        set_number: 1,
        reps: 8,
        weight_kg: 60,
      })
    )
  })

  /* ── Atferd 6: Forrige autofyll ──────────────────────────── */

  it("viser forrige sett fra getPreviousSets i Forrige-kolonnen", async () => {
    vi.mocked(api.getPreviousSets).mockResolvedValue({
      "bench-press": [{ set_number: 1, reps: 6, weight_kg: 55 }],
    })
    renderActive()
    await waitFor(() => expect(screen.getByText("55 kg × 6")).toBeInTheDocument())
  })

  it("kaller getPreviousSets ved mount i aktiv-modus", async () => {
    renderActive()
    await waitFor(() => expect(api.getPreviousSets).toHaveBeenCalledWith("w-1"))
  })

  /* ── Atferd 7: Hviletimer ────────────────────────────────── */

  it("✓ starter hviletimer som viser nedtelling", async () => {
    renderActive()
    const doneBtn = screen.getAllByRole("button", { name: /Marker som fullført/i })[0]
    fireEvent.click(doneBtn)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Avbryt hviletimer/i })).toBeInTheDocument()
    )
  })

  it("skip/avbryt skjuler hviletimeren", async () => {
    renderActive()
    const doneBtn = screen.getAllByRole("button", { name: /Marker som fullført/i })[0]
    fireEvent.click(doneBtn)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Avbryt hviletimer/i })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole("button", { name: /Avbryt hviletimer/i }))
    expect(screen.queryByRole("button", { name: /Avbryt hviletimer/i })).not.toBeInTheDocument()
  })

  /* ── Atferd 8: Sanntids-PR ───────────────────────────────── */

  it('viser "Ny PR!" toast når sett slår historisk beste', async () => {
    const { epley1rm, bestE1rm } = await import("@/lib/oneRepMax")
    vi.mocked(bestE1rm).mockReturnValue(80)
    vi.mocked(epley1rm).mockReturnValue(120)

    renderActive()
    const doneBtn = screen.getAllByRole("button", { name: /Marker som fullført/i })[0]
    fireEvent.click(doneBtn)
    await waitFor(() => expect(screen.getByText(/Ny PR!/)).toBeInTheDocument())
  })

  /* ── Atferd 9: Aktiv legg til sett ──────────────────────── */

  it("+ Legg til sett legger til ny rad lokalt", () => {
    renderActive()
    const before = screen.getAllByRole("button", { name: /Marker som fullført/i }).length
    fireEvent.click(screen.getByRole("button", { name: /Legg til sett/i }))
    const after = screen.getAllByRole("button", { name: /Marker som fullført/i }).length
    expect(after).toBe(before + 1)
  })
})
