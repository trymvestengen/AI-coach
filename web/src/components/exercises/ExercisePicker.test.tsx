import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ExercisePicker from "./ExercisePicker"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  getExercises: vi.fn(),
  setExerciseFavorite: vi.fn(),
}))

const exercises = [
  {
    id: "bench-press",
    name: "Benkpress",
    muscle_groups: ["chest"],
    equipment: ["barbell"],
    difficulty: "",
    primary_muscles: ["chest"],
    secondary_muscles: [],
    image_urls: [],
    is_favorite: true,
    is_custom: false,
    last_used: null,
  },
  {
    id: "squat",
    name: "Knebøy",
    muscle_groups: ["legs"],
    equipment: ["barbell"],
    difficulty: "",
    primary_muscles: ["legs"],
    secondary_muscles: [],
    image_urls: [],
    is_favorite: false,
    is_custom: false,
    last_used: null,
  },
]

function renderPicker(props = {}) {
  return render(<ExercisePicker open onClose={vi.fn()} onConfirm={vi.fn()} {...props} />)
}

describe("ExercisePicker", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getExercises).mockResolvedValue(exercises as never)
  })

  it("renders nothing when closed", () => {
    const { container } = render(
      <ExercisePicker open={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("lists exercises from the API", async () => {
    renderPicker()
    expect(await screen.findByText("Benkpress")).toBeInTheDocument()
    expect(screen.getByText("Knebøy")).toBeInTheDocument()
  })

  it("filters by search query", async () => {
    renderPicker()
    await screen.findByText("Benkpress")
    fireEvent.change(screen.getByLabelText(/søk/i), { target: { value: "kne" } })
    expect(screen.queryByText("Benkpress")).not.toBeInTheDocument()
    expect(screen.getByText("Knebøy")).toBeInTheDocument()
  })

  it("multi-selects and confirms", async () => {
    const onConfirm = vi.fn()
    renderPicker({ onConfirm })
    await screen.findByText("Benkpress")
    fireEvent.click(screen.getByRole("button", { name: /velg benkpress/i }))
    fireEvent.click(screen.getByRole("button", { name: /velg knebøy/i }))
    fireEvent.click(screen.getByRole("button", { name: /legg til 2/i }))
    expect(onConfirm).toHaveBeenCalledWith(["bench-press", "squat"])
  })

  it("toggles a favorite", async () => {
    vi.mocked(api.setExerciseFavorite).mockResolvedValue(undefined)
    renderPicker()
    await screen.findByText("Knebøy")
    fireEvent.click(screen.getByRole("button", { name: /favoritt knebøy/i }))
    await waitFor(() => expect(api.setExerciseFavorite).toHaveBeenCalledWith("squat", true))
  })

  it("does not select an exercise that is already in the template", async () => {
    const onConfirm = vi.fn()
    render(
      <ExercisePicker open excludeIds={["bench-press"]} onClose={vi.fn()} onConfirm={onConfirm} />
    )
    await screen.findByText("Benkpress")
    const btn = screen.getByRole("button", { name: /velg benkpress/i })
    expect(btn).toBeDisabled()
  })
})
