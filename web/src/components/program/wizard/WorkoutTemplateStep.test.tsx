import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import WorkoutTemplateStep from "./WorkoutTemplateStep"

describe("WorkoutTemplateStep", () => {
  it("renders all templates with Custom on top", () => {
    render(<WorkoutTemplateStep onSelect={() => {}} />)
    const rows = screen.getAllByRole("button", {
      name: /custom|push|pull|legs|full body|upper body/i,
    })
    expect(rows[0]).toHaveTextContent(/custom/i)
  })

  it("calls onSelect with template id when tapped", () => {
    const onSelect = vi.fn()
    render(<WorkoutTemplateStep onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("button", { name: /^push$/i }))
    expect(onSelect).toHaveBeenCalledWith("push")
  })

  it("calls onSelect with 'custom' when Custom is tapped", () => {
    const onSelect = vi.fn()
    render(<WorkoutTemplateStep onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("button", { name: /^custom$/i }))
    expect(onSelect).toHaveBeenCalledWith("custom")
  })
})
