import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import QuickStartCTA from "./QuickStartCTA"

describe("QuickStartCTA", () => {
  it("renders the start-empty-workout button", () => {
    render(<QuickStartCTA onStart={() => {}} />)
    expect(screen.getByText(/Hurtigstart/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start tom økt/i })).toBeInTheDocument()
  })

  it("calls onStart when clicked", () => {
    const onStart = vi.fn()
    render(<QuickStartCTA onStart={onStart} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it("disables button when busy", () => {
    render(<QuickStartCTA onStart={() => {}} busy />)
    expect(screen.getByRole("button")).toBeDisabled()
  })
})
