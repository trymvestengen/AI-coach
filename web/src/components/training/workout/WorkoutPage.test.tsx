import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import WorkoutPage from "./WorkoutPage"
import * as api from "@/lib/api"
import type { WorkoutDetail } from "@/lib/api"

const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

vi.mock("@/lib/api", () => ({
  getPreviousSets: vi.fn(),
  logSet: vi.fn(),
  unlogSet: vi.fn(),
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

function renderActive(overrides?: Partial<WorkoutDetail>) {
  return render(
    <WorkoutPage
      workout={overrides ? { ...workout, ...overrides } : workout}
      exerciseNames={exerciseNames}
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
    vi.mocked(api.unlogSet).mockResolvedValue(undefined)
    vi.mocked(api.removeWorkoutExercise).mockResolvedValue(undefined)
    vi.mocked(api.swapWorkoutExercise).mockResolvedValue(undefined)
  })

  /* ── Atferd 1: Grid + norske labels ──────────────────────── */

  it("viser norsk kolonne-header SETT / FORRIGE / KG / REPS", () => {
    renderActive()
    expect(screen.getAllByText("SETT").length).toBeGreaterThan(0)
    expect(screen.getAllByText("FORRIGE").length).toBeGreaterThan(0)
    expect(screen.getAllByText("KG").length).toBeGreaterThan(0)
    expect(screen.getAllByText("REPS").length).toBeGreaterThan(0)
  })

  it("viser ✓-knapp for hvert sett", () => {
    renderActive()
    const doneButtons = screen.getAllByRole("button", { name: /Marker som fullført/i })
    expect(doneButtons.length).toBeGreaterThan(0)
  })

  /* ── Atferd 2: Primærknapp er alltid "Fullfør" ──────────── */

  it('har alltid knapp "Fullfør" — ingen "Start økt"', () => {
    renderActive()
    expect(screen.getByRole("button", { name: "Fullfør" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Start økt" })).not.toBeInTheDocument()
  })

  /* ── Atferd 3: Logging ───────────────────────────────────── */

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

  /* ── Atferd 4: Forrige autofyll ──────────────────────────── */

  it("viser forrige sett fra getPreviousSets i Forrige-kolonnen", async () => {
    vi.mocked(api.getPreviousSets).mockResolvedValue({
      "bench-press": [{ set_number: 1, reps: 6, weight_kg: 55 }],
    })
    renderActive()
    await waitFor(() => expect(screen.getByText("55 kg × 6")).toBeInTheDocument())
  })

  it("kaller getPreviousSets ved mount", async () => {
    renderActive()
    await waitFor(() => expect(api.getPreviousSets).toHaveBeenCalledWith("w-1"))
  })

  /* ── Atferd 5: Hviletimer ────────────────────────────────── */

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

  /* ── Atferd 6: Sanntids-PR ───────────────────────────────── */

  it('viser "Ny PR!" toast når sett slår historisk beste', async () => {
    const { epley1rm, bestE1rm } = await import("@/lib/oneRepMax")
    vi.mocked(bestE1rm).mockReturnValue(80)
    vi.mocked(epley1rm).mockReturnValue(120)

    renderActive()
    const doneBtn = screen.getAllByRole("button", { name: /Marker som fullført/i })[0]
    fireEvent.click(doneBtn)
    await waitFor(() => expect(screen.getByText(/Ny PR!/)).toBeInTheDocument())
  })

  /* ── Atferd 7: Legg til sett ─────────────────────────────── */

  it("+ Legg til sett legger til ny rad lokalt", () => {
    renderActive()
    const before = screen.getAllByRole("button", { name: /Marker som fullført/i }).length
    fireEvent.click(screen.getByRole("button", { name: /Legg til sett/i }))
    const after = screen.getAllByRole("button", { name: /Marker som fullført/i }).length
    expect(after).toBe(before + 1)
  })

  /* ── Atferd 8: Fullfør ───────────────────────────────────── */

  it("Fullfør åpner finish-ark, RPE-valg → Fullfør økt → completeWorkout og navigate", async () => {
    renderActive()

    fireEvent.click(screen.getByRole("button", { name: "Fullfør" }))
    expect(screen.getByRole("heading", { name: "Fullfør økt" })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "8" }))

    fireEvent.click(screen.getByRole("button", { name: "Fullfør økt" }))
    await waitFor(() =>
      expect(api.completeWorkout).toHaveBeenCalledWith("w-1", {
        rpe: 8,
        notes: undefined,
      })
    )
    expect(mockPush).toHaveBeenCalledWith("/historikk/w-1")
  })

  /* ── Atferd 9: Discard — tom økt (ingen loggede sett) ────── */

  it("✕ uten loggede sett: discardWorkout kalles umiddelbart (ingen confirm)", async () => {
    renderActive() // workout.logged_sets = []
    fireEvent.click(screen.getByRole("button", { name: "Forkast økt" }))
    await waitFor(() => expect(api.discardWorkout).toHaveBeenCalledWith("w-1"))
    expect(mockPush).toHaveBeenCalledWith("/program")
    // Ingen bekreft-knapp skal ha blitt vist
    expect(screen.queryByRole("button", { name: "Bekreft forkast" })).not.toBeInTheDocument()
  })

  /* ── Atferd 10: Discard — to-steg når sett er logget ─────── */

  it("✕ med loggede sett: første klikk viser bekreft/avbryt, ikke discardWorkout ennå", () => {
    const doneWorkout: WorkoutDetail = {
      ...workout,
      logged_sets: [
        { exercise_id: "bench-press", set_number: 1, reps: 8, weight_kg: 60, rpe: null },
      ],
    }
    render(<WorkoutPage workout={doneWorkout} exerciseNames={exerciseNames} />)
    fireEvent.click(screen.getByRole("button", { name: "Forkast økt" }))
    expect(screen.getByRole("button", { name: "Bekreft forkast" })).toBeInTheDocument()
    expect(api.discardWorkout).not.toHaveBeenCalled()
  })

  it("Bekreft forkast → discardWorkout → navigate /program", async () => {
    const doneWorkout: WorkoutDetail = {
      ...workout,
      logged_sets: [
        { exercise_id: "bench-press", set_number: 1, reps: 8, weight_kg: 60, rpe: null },
      ],
    }
    render(<WorkoutPage workout={doneWorkout} exerciseNames={exerciseNames} />)
    fireEvent.click(screen.getByRole("button", { name: "Forkast økt" }))
    fireEvent.click(screen.getByRole("button", { name: "Bekreft forkast" }))
    await waitFor(() => expect(api.discardWorkout).toHaveBeenCalledWith("w-1"))
    expect(mockPush).toHaveBeenCalledWith("/program")
  })

  it("Avbryt forkast tilbakestiller til ✕-knapp uten å kalle discardWorkout", () => {
    const doneWorkout: WorkoutDetail = {
      ...workout,
      logged_sets: [
        { exercise_id: "bench-press", set_number: 1, reps: 8, weight_kg: 60, rpe: null },
      ],
    }
    render(<WorkoutPage workout={doneWorkout} exerciseNames={exerciseNames} />)
    fireEvent.click(screen.getByRole("button", { name: "Forkast økt" }))
    expect(screen.getByRole("button", { name: "Bekreft forkast" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Avbryt forkast" }))
    expect(screen.getByRole("button", { name: "Forkast økt" })).toBeInTheDocument()
    expect(api.discardWorkout).not.toHaveBeenCalled()
  })

  /* Discard-empty avgjøres av loggede sett — ikke workout.logged_sets alene,
     men om noen sett er markert done i UI-tilstand (init fra logged_sets) */
  it("✕ etter at et sett logges i session: to-steg", async () => {
    renderActive() // starter uten loggede sett
    // Logg et sett i UI
    fireEvent.click(screen.getAllByRole("button", { name: /Marker som fullført/i })[0])
    await waitFor(() => expect(api.logSet).toHaveBeenCalled())
    // Nå skal ✕ vise bekreft-knapp
    fireEvent.click(screen.getByRole("button", { name: "Forkast økt" }))
    expect(screen.getByRole("button", { name: "Bekreft forkast" })).toBeInTheDocument()
  })

  /* ── Atferd 11: ⋯-meny ───────────────────────────────────── */

  it("⋯-knapp viser TemplateMenuSheet med workout.template_id", () => {
    renderActive()
    fireEvent.click(screen.getByRole("button", { name: "Mal-valg" }))
    expect(screen.getByTestId("template-menu")).toBeInTheDocument()
    expect(screen.getByTestId("menu-template-id").textContent).toBe("t-1")
  })

  it("aktiv økt uten template_id viser ikke ⋯-knappen", () => {
    renderActive({ template_id: null })
    expect(screen.queryByRole("button", { name: "Mal-valg" })).not.toBeInTheDocument()
  })

  /* ── Fix 1: unlogSet ved av-kryssing ────────────────────── */

  it("av-kryssing (done → false) kaller unlogSet med riktig args", async () => {
    const doneWorkout: WorkoutDetail = {
      ...workout,
      logged_sets: [
        { exercise_id: "bench-press", set_number: 1, reps: 8, weight_kg: 60, rpe: null },
      ],
    }
    render(<WorkoutPage workout={doneWorkout} exerciseNames={exerciseNames} />)
    const doneBtn = screen.getAllByRole("button", { name: /Fjern fullført/i })[0]
    fireEvent.click(doneBtn)
    await waitFor(() => expect(api.unlogSet).toHaveBeenCalledWith("w-1", "bench-press", 1))
  })

  /* ── Fix 2: intra-session PR-sjekk ──────────────────────── */

  it("andre sett som ikke slår intra-session-best viser ikke PR toast", async () => {
    const { epley1rm, bestE1rm } = await import("@/lib/oneRepMax")
    vi.mocked(bestE1rm).mockReturnValue(0)
    vi.mocked(epley1rm).mockReturnValue(100)

    const twoSetWorkout: WorkoutDetail = {
      ...workout,
      exercises: [
        {
          ...workout.exercises[0],
          sets: [
            { id: "s-1", set_number: 1, reps: 8, weight_kg: 60, notes: null },
            { id: "s-2", set_number: 2, reps: 8, weight_kg: 60, notes: null },
          ],
        },
      ],
    }
    render(<WorkoutPage workout={twoSetWorkout} exerciseNames={exerciseNames} />)

    const doneBtns = screen.getAllByRole("button", { name: /Marker som fullført/i })

    fireEvent.click(doneBtns[0])
    await waitFor(() => expect(screen.getByText(/Ny PR!/)).toBeInTheDocument())

    vi.mocked(bestE1rm).mockReturnValue(100)

    fireEvent.click(doneBtns[1])
    await waitFor(() => {}, { timeout: 100 })
    const toasts = screen.queryAllByText(/Ny PR!/)
    expect(toasts.length).toBeLessThanOrEqual(1)
  })

  /* ── Fix 3: aktiv legg-til / fjern / bytt øvelse ───────── */

  it("+ Legg til øvelse legger til øvelse i grid", async () => {
    renderActive()
    const addExBtn = screen.getByRole("button", { name: /Legg til øvelse/i })
    fireEvent.click(addExBtn)
    expect(screen.getByTestId("exercise-picker")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Bekreft" }))
    await waitFor(() => {
      expect(screen.getByText("new-ex")).toBeInTheDocument()
    })
  })

  it("Fjern kaller removeWorkoutExercise", async () => {
    renderActive()
    const fjernBtn = screen.getByRole("button", { name: /Fjern Benkpress/i })
    fireEvent.click(fjernBtn)
    await waitFor(() =>
      expect(api.removeWorkoutExercise).toHaveBeenCalledWith("w-1", "bench-press")
    )
  })

  /* ── Atferd 12: Fjern enkelt-sett ───────────────────────── */

  it("fjern-sett-knapp finnes for hvert sett", () => {
    renderActive()
    const removeBtns = screen.getAllByRole("button", { name: /Fjern sett/i })
    expect(removeBtns.length).toBe(2) // workout fixture har 2 sett
  })

  it("fjern et logget sett: kaller unlogSet og fjerner raden", async () => {
    const doneWorkout: WorkoutDetail = {
      ...workout,
      logged_sets: [
        { exercise_id: "bench-press", set_number: 1, reps: 8, weight_kg: 60, rpe: null },
      ],
    }
    render(<WorkoutPage workout={doneWorkout} exerciseNames={exerciseNames} />)
    const removeBtn = screen.getByRole("button", { name: "Fjern sett 1" })
    fireEvent.click(removeBtn)

    await waitFor(() => expect(api.unlogSet).toHaveBeenCalledWith("w-1", "bench-press", 1))

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Fjern sett 1" })).not.toBeInTheDocument()
    )
    expect(screen.getByRole("button", { name: "Fjern sett 2" })).toBeInTheDocument()
  })

  it("fjern et ulogget sett: ingen unlogSet-kall, men raden forsvinner", async () => {
    renderActive()
    const removeBtn = screen.getByRole("button", { name: "Fjern sett 1" })
    fireEvent.click(removeBtn)

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Fjern sett 1" })).not.toBeInTheDocument()
    )
    expect(api.unlogSet).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Fjern sett 2" })).toBeInTheDocument()
  })

  /* ── H5: Tom tilstand ────────────────────────────────────── */

  it("uten øvelser viser tom-tilstand-melding", () => {
    render(<WorkoutPage workout={{ ...workout, exercises: [] }} exerciseNames={exerciseNames} />)
    expect(screen.getByText("Ingen øvelser enda")).toBeInTheDocument()
  })

  /* ── M6: Toast er fixed-posisjonert ─────────────────────── */

  it("PR toast er fixed (viewport-forankret), ikke absolutt", async () => {
    const { epley1rm, bestE1rm } = await import("@/lib/oneRepMax")
    vi.mocked(bestE1rm).mockReturnValue(0)
    vi.mocked(epley1rm).mockReturnValue(120)

    renderActive()
    fireEvent.click(screen.getAllByRole("button", { name: /Marker som fullført/i })[0])
    const toast = await screen.findByRole("status")
    expect(toast).toHaveStyle({ position: "fixed" })
  })
})
