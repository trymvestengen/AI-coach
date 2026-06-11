import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ProgramCard from "./ProgramCard"

describe("ProgramCard", () => {
  it("renders program name and days count", () => {
    render(
      <ProgramCard
        program={{ id: "p-1", name: "PPL 6-dagers", is_active: false, days_count: 6 }}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText("PPL 6-dagers")).toBeInTheDocument()
    expect(screen.getByText(/6 dager/i)).toBeInTheDocument()
  })

  it("shows AKTIV pill when active", () => {
    render(
      <ProgramCard
        program={{ id: "p-2", name: "X", is_active: true, days_count: 3 }}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/AKTIV/i)).toBeInTheDocument()
  })

  it("does not show AKTIV pill when not active", () => {
    render(
      <ProgramCard
        program={{ id: "p-3", name: "Y", is_active: false, days_count: 3 }}
        onOpen={() => {}}
      />
    )
    expect(screen.queryByText(/AKTIV/i)).not.toBeInTheDocument()
  })

  it("fires onOpen with program id", () => {
    const onOpen = vi.fn()
    render(
      <ProgramCard
        program={{ id: "p-4", name: "Z", is_active: false, days_count: 3 }}
        onOpen={onOpen}
      />
    )
    fireEvent.click(screen.getByRole("button"))
    expect(onOpen).toHaveBeenCalledWith("p-4")
  })

  it("renders preview text when previewExercises is provided", () => {
    render(
      <ProgramCard
        program={{ id: "p-5", name: "PPL", is_active: false, days_count: 6 }}
        previewExercises={["Back squat", "Bench press", "Deadlift"]}
        onOpen={() => {}}
      />
    )
    expect(screen.getByText(/Back squat, Bench press, Deadlift/)).toBeInTheDocument()
  })

  it("omits preview when previewExercises is empty", () => {
    render(
      <ProgramCard
        program={{ id: "p-6", name: "PPL", is_active: false, days_count: 6 }}
        previewExercises={[]}
        onOpen={() => {}}
      />
    )
    // Should not render any preview text
    expect(screen.queryByText(/,/)).not.toBeInTheDocument()
  })
})
