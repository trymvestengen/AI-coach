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
    expect(screen.getByText(/Underkropp/)).toBeInTheDocument()
    expect(screen.getByText(/4 øvelser/)).toBeInTheDocument()
  })

  it("shows 'I DAG' pill when isToday is true", () => {
    render(
      <DayCard
        day={{ id: "d-2", day_number: 2, name: "Overkropp", exercise_count: 5 }}
        isToday={true}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/I DAG/i)).toBeInTheDocument()
  })

  it("renders day name and 0 øvelser for rest day", () => {
    render(
      <DayCard
        day={{ id: "d-3", day_number: 3, name: "Hviledag", exercise_count: 0 }}
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
        day={{ id: "d-4", day_number: 4, name: "Legs", exercise_count: 3 }}
        isToday={false}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onOpen).toHaveBeenCalledWith("d-4")
  })

  it("expands to show exercise rows when exercises are provided", () => {
    render(
      <DayCard
        day={{
          id: "d-5",
          day_number: 5,
          name: "Push",
          exercise_count: 2,
          exercises: [
            { id: "e-1", exercise_id: "ex-1", name: "Benkpress" },
            { id: "e-2", exercise_id: "ex-2", name: "Skulderpress" },
          ],
        }}
        isToday={false}
      />
    )
    // Before expand, exercises not visible
    expect(screen.queryByText("Benkpress")).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(screen.getByRole("button", { name: /Push/ }))
    expect(screen.getByText("Benkpress")).toBeInTheDocument()
    expect(screen.getByText("Skulderpress")).toBeInTheDocument()
  })
})
