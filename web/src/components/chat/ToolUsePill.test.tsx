import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import ToolUsePill from "./ToolUsePill"
import ThinkingDots from "./ThinkingDots"

describe("ToolUsePill", () => {
  it("renders label and running state for a visible tool", () => {
    render(<ToolUsePill toolName="create_program" state="running" />)
    expect(screen.getByText(/Lager program/)).toBeInTheDocument()
  })

  it("renders nothing for unknown tool", () => {
    const { container } = render(<ToolUsePill toolName="unknown_tool" state="running" />)
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing for silent read tools", () => {
    const { container } = render(<ToolUsePill toolName="get_workout_history" state="running" />)
    expect(container.firstChild).toBeNull()
  })

  it("shows checkmark for done state", () => {
    const { container } = render(<ToolUsePill toolName="create_program" state="done" />)
    expect(container.textContent).toContain("✓")
  })

  it("shows X for error state", () => {
    const { container } = render(<ToolUsePill toolName="create_program" state="error" />)
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
