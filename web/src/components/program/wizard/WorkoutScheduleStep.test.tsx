import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import WorkoutScheduleStep from "./WorkoutScheduleStep"

describe("WorkoutScheduleStep", () => {
  it("starts in weekdays tab with no days selected — button disabled", () => {
    render(<WorkoutScheduleStep workoutName="Push" onNext={() => {}} />)
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeDisabled()
  })

  it("toggles weekdays on tap", () => {
    render(<WorkoutScheduleStep workoutName="Push" onNext={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /^man$/i }))
    fireEvent.click(screen.getByRole("button", { name: /^ons$/i }))
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeEnabled()
    expect(screen.getByText(/Push på/i)).toHaveTextContent(/Man.*Ons/)
  })

  it("calls onNext with weekdays schedule", () => {
    const onNext = vi.fn()
    render(<WorkoutScheduleStep workoutName="Push" onNext={onNext} />)
    fireEvent.click(screen.getByRole("button", { name: /^man$/i }))
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onNext).toHaveBeenCalledWith({ kind: "weekdays", weekdays: [1] })
  })

  it("switches to frequency tab and selects 3x", () => {
    const onNext = vi.fn()
    render(<WorkoutScheduleStep workoutName="Push" onNext={onNext} />)
    fireEvent.click(screen.getByRole("button", { name: /hyppighet/i }))
    fireEvent.click(screen.getByRole("button", { name: "3×" }))
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onNext).toHaveBeenCalledWith({ kind: "frequency", frequency_per_week: 3 })
  })
})
