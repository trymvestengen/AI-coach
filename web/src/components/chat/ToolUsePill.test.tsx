import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import ToolUsePill from "./ToolUsePill"
import ThinkingDots from "./ThinkingDots"

describe("ToolUsePill", () => {
  it("renders mapped label and running state", () => {
    render(<ToolUsePill toolName="get_workout_history" state="running" />)
    expect(screen.getByText(/Henter treningshistorikk/)).toBeInTheDocument()
  })

  it("renders generic label for unknown tool", () => {
    render(<ToolUsePill toolName="unknown_tool" state="running" />)
    expect(screen.getByText(/unknown_tool/)).toBeInTheDocument()
  })

  it("shows checkmark for done state", () => {
    const { container } = render(<ToolUsePill toolName="get_workout_history" state="done" />)
    expect(container.textContent).toContain("✓")
  })

  it("shows X for error state", () => {
    const { container } = render(<ToolUsePill toolName="get_workout_history" state="error" />)
    expect(container.textContent).toContain("✗")
  })
})

describe("ThinkingDots", () => {
  it("renders three dots", () => {
    const { container } = render(<ThinkingDots />)
    const dots = container.querySelectorAll("span.animate-pulse")
    expect(dots.length).toBe(3)
  })
})
