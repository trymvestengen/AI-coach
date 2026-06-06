import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import TodaysWorkoutBanner from "./TodaysWorkoutBanner"

describe("TodaysWorkoutBanner", () => {
  it("renders 'Fortsett' when workout is in progress", () => {
    render(
      <TodaysWorkoutBanner
        state={{
          kind: "in-progress",
          workoutId: "w-1",
          dayName: "Underkropp",
          setsLogged: 2,
        }}
      />
    )
    expect(screen.getByText(/Pågående/i)).toBeInTheDocument()
    expect(screen.getByText("Underkropp")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Fortsett/i })).toBeInTheDocument()
  })

  it("renders 'Start' when today has a workout day", () => {
    render(
      <TodaysWorkoutBanner
        state={{
          kind: "today-ready",
          dayId: "d-1",
          dayName: "Underkropp",
          exerciseCount: 4,
        }}
      />
    )
    expect(screen.getByText(/Dagens økt/i)).toBeInTheDocument()
    expect(screen.getByText("Underkropp")).toBeInTheDocument()
    expect(screen.getByText(/4 øvelser/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start/i })).toBeInTheDocument()
  })

  it("renders rest-day message", () => {
    render(<TodaysWorkoutBanner state={{ kind: "rest-day", nextDayName: "Overkropp" }} />)
    expect(screen.getByText(/Hviledag/)).toBeInTheDocument()
    expect(screen.getByText(/Overkropp/)).toBeInTheDocument()
  })

  it("renders 'Velg aktivt program' when no active program", () => {
    render(<TodaysWorkoutBanner state={{ kind: "no-active", programCount: 3 }} />)
    expect(screen.getByText(/Ingen er aktiv/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Velg aktivt program/i })).toBeInTheDocument()
  })

  it("renders empty CTA when no programs at all", () => {
    render(<TodaysWorkoutBanner state={{ kind: "empty" }} />)
    expect(screen.getByText(/første program/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Lag program/i })).toBeInTheDocument()
  })
})
