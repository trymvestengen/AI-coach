import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ExerciseDetailModal from "./ExerciseDetailModal"

vi.mock("@/lib/api", () => ({
  getExerciseDetail: vi.fn(),
  getExerciseProgression: vi.fn().mockResolvedValue({
    exercise_id: "x",
    exercise_name: "x",
    data_points: [],
  }),
}))

const MOCK_DETAIL = {
  id: "Barbell_Squat",
  name: "Barbell Squat",
  muscle_groups: ["quadriceps"],
  equipment: ["barbell"],
  difficulty: "intermediate",
  primary_muscles: ["quadriceps"],
  secondary_muscles: ["glutes", "hamstrings"],
  image_urls: [
    "https://raw.githubusercontent.com/.../0.jpg",
    "https://raw.githubusercontent.com/.../1.jpg",
  ],
  force: "push",
  mechanic: "compound",
  category: "strength",
  instructions: "Step 1\n\nStep 2",
}

describe("ExerciseDetailModal", () => {
  it("renders nothing when closed", () => {
    render(<ExerciseDetailModal exerciseId={null} onClose={() => {}} />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("fetches and renders detail when opened", async () => {
    const { getExerciseDetail } = await import("@/lib/api")
    vi.mocked(getExerciseDetail).mockResolvedValueOnce(MOCK_DETAIL)

    render(<ExerciseDetailModal exerciseId="Barbell_Squat" onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText("Barbell Squat")).toBeInTheDocument()
    })
    expect(screen.getByText(/quadriceps/i)).toBeInTheDocument()
    expect(screen.getByText(/Step 1/)).toBeInTheDocument()
  })

  it("shows 'Legg til denne' button when onPick prop is provided", async () => {
    const { getExerciseDetail } = await import("@/lib/api")
    vi.mocked(getExerciseDetail).mockResolvedValueOnce(MOCK_DETAIL)
    const onPick = vi.fn()

    render(<ExerciseDetailModal exerciseId="Barbell_Squat" onClose={() => {}} onPick={onPick} />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Legg til denne/i })).toBeInTheDocument()
    })
  })

  it("hides 'Legg til denne' button when onPick is omitted", async () => {
    const { getExerciseDetail } = await import("@/lib/api")
    vi.mocked(getExerciseDetail).mockResolvedValueOnce(MOCK_DETAIL)

    render(<ExerciseDetailModal exerciseId="Barbell_Squat" onClose={() => {}} />)

    await waitFor(() => {
      expect(screen.getByText("Barbell Squat")).toBeInTheDocument()
    })
    expect(screen.queryByRole("button", { name: /Legg til denne/i })).not.toBeInTheDocument()
  })

  it("closes when × is clicked", async () => {
    const { getExerciseDetail } = await import("@/lib/api")
    vi.mocked(getExerciseDetail).mockResolvedValueOnce(MOCK_DETAIL)
    const onClose = vi.fn()

    render(<ExerciseDetailModal exerciseId="Barbell_Squat" onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText("Barbell Squat")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /Lukk/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
