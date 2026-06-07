import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DayCard from "./DayCard"

describe("DayCard", () => {
  it("renders day name and exercise count", () => {
    render(
      <DayCard
        day={{
          id: "d-1",
          day_number: 1,
          name: "Underkropp",
          weekdays: [],
          frequency_per_week: null,
          exercise_count: 4,
        }}
        programId="prog-1"
        isToday={false}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/Underkropp/)).toBeInTheDocument()
    expect(screen.getByText(/4 øvelser/)).toBeInTheDocument()
  })

  it("shows 'I DAG' pill when isToday is true", () => {
    render(
      <DayCard
        day={{
          id: "d-2",
          day_number: 2,
          name: "Overkropp",
          weekdays: [],
          frequency_per_week: null,
          exercise_count: 5,
        }}
        programId="prog-1"
        isToday={true}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/I DAG/i)).toBeInTheDocument()
  })

  it("renders day name and 0 øvelser for rest day", () => {
    render(
      <DayCard
        day={{
          id: "d-3",
          day_number: 3,
          name: "Hviledag",
          weekdays: [],
          frequency_per_week: null,
          exercise_count: 0,
        }}
        programId="prog-1"
        isToday={false}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/Hviledag/)).toBeInTheDocument()
    expect(screen.getByText(/0 øvelser/)).toBeInTheDocument()
  })

  it("fires onOpen when toggle button is clicked", () => {
    const onOpen = vi.fn()
    render(
      <DayCard
        day={{
          id: "d-4",
          day_number: 4,
          name: "Legs",
          weekdays: [],
          frequency_per_week: null,
          exercise_count: 3,
        }}
        programId="prog-1"
        isToday={false}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /Legs/ }))
    expect(onOpen).toHaveBeenCalledWith("d-4")
  })

  it("expands to show exercise rows when exercises are provided", () => {
    render(
      <DayCard
        day={{
          id: "d-5",
          day_number: 5,
          name: "Push",
          weekdays: [],
          frequency_per_week: null,
          exercise_count: 2,
          exercises: [
            { id: "e-1", exercise_id: "ex-1", name: "Benkpress" },
            { id: "e-2", exercise_id: "ex-2", name: "Skulderpress" },
          ],
        }}
        programId="prog-1"
        isToday={false}
      />
    )
    // Before expand, exercises not visible
    expect(screen.queryByText("Benkpress")).not.toBeInTheDocument()

    // Click toggle (the button containing "Push")
    fireEvent.click(screen.getByRole("button", { name: /Push/ }))
    expect(screen.getByText("Benkpress")).toBeInTheDocument()
    expect(screen.getByText("Skulderpress")).toBeInTheDocument()
  })

  it("shows weekday label when day has weekdays", () => {
    render(
      <DayCard
        day={{
          id: "d-6",
          day_number: 1,
          name: "Push",
          weekdays: [1, 3, 5],
          frequency_per_week: null,
          exercise_count: 0,
        }}
        programId="prog-1"
        isToday={false}
      />
    )
    expect(screen.getByText(/Mandag.*Onsdag.*Fredag/i)).toBeInTheDocument()
  })

  it("shows frequency label when day has frequency_per_week", () => {
    render(
      <DayCard
        day={{
          id: "d-7",
          day_number: 1,
          name: "Cardio",
          weekdays: [],
          frequency_per_week: 3,
          exercise_count: 0,
        }}
        programId="prog-1"
        isToday={false}
      />
    )
    expect(screen.getByText(/3× per uke/i)).toBeInTheDocument()
  })
})
