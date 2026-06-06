import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DayCard from "./DayCard"

describe("DayCard", () => {
  it("renders day name and exercise count", () => {
    render(
      <DayCard
        day={{ id: "d-1", day_number: 1, name: "Underkropp", exercise_count: 4 }}
        isToday={false}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/Dag 1 · Underkropp/)).toBeInTheDocument()
    expect(screen.getByText(/4 øvelser/)).toBeInTheDocument()
  })

  it("shows 'I dag' pill when isToday is true", () => {
    render(
      <DayCard
        day={{ id: "d-2", day_number: 2, name: "Overkropp", exercise_count: 5 }}
        isToday={true}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/I dag/i)).toBeInTheDocument()
  })

  it("renders 'Hviledag' state when exercise_count is 0", () => {
    render(
      <DayCard
        day={{ id: "d-3", day_number: 3, name: "Hviledag", exercise_count: 0 }}
        isToday={false}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/Hviledag/)).toBeInTheDocument()
  })

  it("fires onOpen when clicked and has exercises", () => {
    const onOpen = vi.fn()
    render(
      <DayCard
        day={{ id: "d-4", day_number: 4, name: "Legs", exercise_count: 3 }}
        isToday={false}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onOpen).toHaveBeenCalledWith("d-4")
  })
})
