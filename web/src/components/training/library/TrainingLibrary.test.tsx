import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TrainingLibrary from "./TrainingLibrary"
import * as api from "@/lib/api"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}))

vi.mock("@/lib/api", () => ({
  startWorkoutFromTemplate: vi.fn(),
}))

const templates = [
  { id: "t-1", name: "Push A", folder_id: null, exercise_count: 4 },
  { id: "t-2", name: "Pull A", folder_id: "f-1", exercise_count: 5 },
]
const folders = [{ id: "f-1", name: "Min PPL", template_count: 1 }]

function renderLib(overrides: Partial<Parameters<typeof TrainingLibrary>[0]> = {}) {
  return render(
    <TrainingLibrary
      templates={templates}
      folders={folders}
      nextWorkout={null}
      inProgress={null}
      {...overrides}
    />
  )
}

describe("TrainingLibrary", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders all templates by default", () => {
    renderLib()
    expect(screen.getByText("Push A")).toBeInTheDocument()
    expect(screen.getByText("Pull A")).toBeInTheDocument()
  })

  it("renders a theme toggle so dark mode is reachable", () => {
    renderLib()
    expect(screen.getByRole("button", { name: /tema/i })).toBeInTheDocument()
  })

  it("starts an empty workout and navigates when 'Start tom økt' is clicked", async () => {
    vi.mocked(api.startWorkoutFromTemplate).mockResolvedValue({
      workout_id: "w-1",
      template_id: null,
    })
    renderLib()
    fireEvent.click(screen.getByRole("button", { name: /Start tom økt/i }))
    await waitFor(() => expect(api.startWorkoutFromTemplate).toHaveBeenCalledWith(undefined))
    expect(mockPush).toHaveBeenCalledWith("/program/workout/w-1")
  })

  it("shows the coach suggestion when next-workout has a template", () => {
    renderLib({
      nextWorkout: { template_id: "t-2", name: "Pull A", reason: "basert på i går" },
    })
    expect(screen.getByText(/Coachen foreslår/i)).toBeInTheDocument()
  })

  it("hides the coach suggestion when next-workout has no template", () => {
    renderLib({ nextWorkout: { template_id: null, name: null, reason: null } })
    expect(screen.queryByText(/Coachen foreslår/i)).not.toBeInTheDocument()
  })

  it("filters templates to the selected folder", () => {
    renderLib()
    fireEvent.click(screen.getByText("Min PPL"))
    expect(screen.queryByText("Push A")).not.toBeInTheDocument()
    expect(screen.getByText("Pull A")).toBeInTheDocument()
  })

  it("navigates to template detail when a card is opened", () => {
    renderLib()
    fireEvent.click(screen.getByRole("button", { name: /Push A/ }))
    expect(mockPush).toHaveBeenCalledWith("/program/template/t-1")
  })

  it("shows the active workout bar when a workout is in progress", () => {
    renderLib({
      inProgress: {
        workout_id: "w-9",
        started_at: null,
        program_day_id: null,
        day_name: null,
        program_id: null,
        logged_sets: [],
        sets_logged: 2,
      },
    })
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeInTheDocument()
  })
})
