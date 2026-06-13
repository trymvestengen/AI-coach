import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ActiveWorkoutBar from "./ActiveWorkoutBar"

describe("ActiveWorkoutBar", () => {
  it("renders the label and calls onContinue when 'fortsett' is clicked", () => {
    const onContinue = vi.fn()
    render(<ActiveWorkoutBar label="Kveldsøkt" onContinue={onContinue} />)
    expect(screen.getByText(/Kveldsøkt/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onContinue).toHaveBeenCalledTimes(1)
  })
})
