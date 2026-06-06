import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import WorkoutExerciseRow from "./WorkoutExerciseRow"

const sampleExercise = {
  id: "ex-1",
  exercise_id: "back-squat",
  name: "Back squat",
  muscle_groups: ["quads"],
  order_index: 0,
  sets: [
    { id: "s-1", set_number: 1, reps: 5, weight_kg: 80 },
    { id: "s-2", set_number: 2, reps: 5, weight_kg: 80 },
  ],
}

describe("WorkoutExerciseRow", () => {
  it("renders exercise name and set count", () => {
    render(
      <WorkoutExerciseRow
        ex={sampleExercise}
        log={[
          { reps: 5, weightKg: 80, done: false },
          { reps: 5, weightKg: 80, done: false },
        ]}
        onCheck={() => {}}
      />
    )
    expect(screen.getByText("Back squat")).toBeInTheDocument()
    expect(screen.getByText(/2 × 5/)).toBeInTheDocument()
  })

  it("calls onCheck with set index, reps, weight when ✓ pressed", () => {
    const onCheck = vi.fn()
    render(
      <WorkoutExerciseRow
        ex={sampleExercise}
        log={[
          { reps: 5, weightKg: 80, done: false },
          { reps: 5, weightKg: 80, done: false },
        ]}
        onCheck={onCheck}
      />
    )
    const checks = screen.getAllByRole("button", { name: /Fullfør sett/i })
    fireEvent.click(checks[0])
    expect(onCheck).toHaveBeenCalledWith(0, 5, 80)
  })

  it("disables inputs for done sets", () => {
    render(
      <WorkoutExerciseRow
        ex={sampleExercise}
        log={[
          { reps: 5, weightKg: 80, done: true },
          { reps: 5, weightKg: 80, done: false },
        ]}
        onCheck={() => {}}
      />
    )
    const repsInputs = screen.getAllByLabelText(/Reps sett/i)
    expect(repsInputs[0]).toBeDisabled()
    expect(repsInputs[1]).not.toBeDisabled()
  })
})
