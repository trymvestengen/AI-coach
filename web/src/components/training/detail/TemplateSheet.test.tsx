import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TemplateSheet from "./TemplateSheet"
import * as api from "@/lib/api"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("@/lib/api", () => ({
  getTemplate: vi.fn(),
  getExercises: vi.fn(),
  addExerciseToTemplate: vi.fn(),
  removeExerciseFromTemplate: vi.fn(),
  updateTemplateExercise: vi.fn(),
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  setExerciseFavorite: vi.fn(),
  createCustomExercise: vi.fn(),
}))

const template = {
  id: "t-1",
  name: "Push A",
  folder_id: null,
  exercises: [
    {
      id: "te-1",
      exercise_id: "bench-press",
      position: 0,
      sets: [
        { id: "s1", set_number: 1, reps: 5, weight_kg: 60 },
        { id: "s2", set_number: 2, reps: 5, weight_kg: 60 },
      ],
    },
  ],
}

const exercises = [
  {
    id: "bench-press",
    name: "Benkpress",
    muscle_groups: [],
    equipment: [],
    difficulty: "",
    primary_muscles: [],
    secondary_muscles: [],
    image_urls: [],
  },
  {
    id: "squat",
    name: "Knebøy",
    muscle_groups: [],
    equipment: [],
    difficulty: "",
    primary_muscles: [],
    secondary_muscles: [],
    image_urls: [],
  },
]

function renderSheet(props: Partial<Parameters<typeof TemplateSheet>[0]> = {}) {
  return render(
    <TemplateSheet
      templateId="t-1"
      folders={[]}
      onClose={vi.fn()}
      onChanged={vi.fn()}
      onStart={vi.fn()}
      {...props}
    />
  )
}

describe("TemplateSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getTemplate).mockResolvedValue(template as never)
    vi.mocked(api.getExercises).mockResolvedValue(exercises as never)
    vi.mocked(api.addExerciseToTemplate).mockResolvedValue({
      template_exercise_id: "te-2",
      exercise_id: "squat",
    })
    vi.mocked(api.removeExerciseFromTemplate).mockResolvedValue(undefined)
    vi.mocked(api.updateTemplateExercise).mockResolvedValue({
      id: "bench-press",
      status: "updated",
    })
  })

  it("renders nothing when templateId is null", () => {
    const { container } = renderSheet({ templateId: null })
    expect(container).toBeEmptyDOMElement()
  })

  it("fetches and shows the template name and exercise names", async () => {
    renderSheet()
    expect(await screen.findByText("Push A")).toBeInTheDocument()
    expect(screen.getByText("Benkpress")).toBeInTheDocument()
    expect(api.getTemplate).toHaveBeenCalledWith("t-1")
  })

  it("increments sets when '+' is clicked", async () => {
    renderSheet()
    await screen.findByText("Benkpress")
    fireEvent.click(screen.getByRole("button", { name: /flere sett/i }))
    await waitFor(() =>
      expect(api.updateTemplateExercise).toHaveBeenCalledWith("t-1", "bench-press", { sets: 3 })
    )
  })

  it("removes an exercise", async () => {
    renderSheet()
    await screen.findByText("Benkpress")
    fireEvent.click(screen.getByRole("button", { name: /fjern benkpress/i }))
    await waitFor(() =>
      expect(api.removeExerciseFromTemplate).toHaveBeenCalledWith("t-1", "bench-press")
    )
  })

  it("opens the picker and adds selected exercises", async () => {
    vi.mocked(api.getExercises).mockResolvedValue([
      {
        id: "squat",
        name: "Knebøy",
        muscle_groups: ["legs"],
        equipment: [],
        difficulty: "",
        primary_muscles: ["legs"],
        secondary_muscles: [],
        image_urls: [],
        is_favorite: false,
        is_custom: false,
        last_used: null,
      },
    ] as never)
    vi.mocked(api.addExerciseToTemplate).mockResolvedValue({
      template_exercise_id: "te-9",
      exercise_id: "squat",
    })
    renderSheet()
    await screen.findByText("Push A")
    fireEvent.click(screen.getByRole("button", { name: /legg til øvelse/i }))
    fireEvent.click(await screen.findByRole("button", { name: /velg knebøy/i }))
    fireEvent.click(screen.getByRole("button", { name: /legg til 1/i }))
    await waitFor(() =>
      expect(api.addExerciseToTemplate).toHaveBeenCalledWith("t-1", { exercise_id: "squat" })
    )
  })

  it("calls onStart when 'Start økta' is clicked", async () => {
    const onStart = vi.fn()
    renderSheet({ onStart })
    await screen.findByText("Benkpress")
    fireEvent.click(screen.getByRole("button", { name: /start økta/i }))
    expect(onStart).toHaveBeenCalledWith("t-1")
  })

  it("closes when the overlay is clicked", async () => {
    const onClose = vi.fn()
    renderSheet({ onClose })
    await screen.findByText("Push A")
    fireEvent.click(screen.getByTestId("sheet-overlay"))
    expect(onClose).toHaveBeenCalled()
  })
})
