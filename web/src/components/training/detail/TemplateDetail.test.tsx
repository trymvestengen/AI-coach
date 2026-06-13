import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TemplateDetail from "./TemplateDetail"
import * as api from "@/lib/api"
import type { TemplateDetail as TemplateDetailType } from "@/lib/api"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}))

vi.mock("@/lib/api", () => ({
  startWorkoutFromTemplate: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}))

const template: TemplateDetailType = {
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

const exerciseNames = {
  "bench-press": "Benkpress",
  "shoulder-press": "Skulderpress",
}

const folders = [{ id: "f-1", name: "Min PPL", template_count: 1 }]

function renderDetail() {
  return render(
    <TemplateDetail template={template} exerciseNames={exerciseNames} folders={folders} />
  )
}

describe("TemplateDetail", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders the template name", () => {
    renderDetail()
    expect(screen.getByRole("heading", { name: "Push A" })).toBeInTheDocument()
  })

  it("renders each exercise name resolved from the id map", () => {
    renderDetail()
    expect(screen.getByText("Benkpress")).toBeInTheDocument()
    expect(screen.getByText("Skulderpress")).toBeInTheDocument()
  })

  it("renders a set spec for an exercise", () => {
    renderDetail()
    expect(screen.getByText(/3 × 8/)).toBeInTheDocument()
    expect(screen.getByText(/60 kg/)).toBeInTheDocument()
  })

  it("starts a workout from this template and navigates", async () => {
    vi.mocked(api.startWorkoutFromTemplate).mockResolvedValue({
      workout_id: "w-1",
      template_id: "t-1",
    })
    renderDetail()
    fireEvent.click(screen.getByRole("button", { name: /Start denne økta/i }))
    await waitFor(() => expect(api.startWorkoutFromTemplate).toHaveBeenCalledWith("t-1"))
    expect(mockPush).toHaveBeenCalledWith("/program/workout/w-1")
  })

  it("opens the actions menu when ⋯ is clicked", () => {
    renderDetail()
    expect(screen.queryByRole("button", { name: /Slett mal/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Mal-valg/i }))
    expect(screen.getByRole("button", { name: /Slett mal/i })).toBeInTheDocument()
  })
})
