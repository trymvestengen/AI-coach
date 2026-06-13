import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import TemplateCard from "./TemplateCard"

describe("TemplateCard", () => {
  const template = { id: "t-1", name: "Push A", exercise_count: 3 }

  it("renders template name and exercise count", () => {
    render(<TemplateCard template={template} onOpen={() => {}} onMenu={() => {}} />)
    expect(screen.getByText("Push A")).toBeInTheDocument()
    expect(screen.getByText(/3 øvelser/i)).toBeInTheDocument()
  })

  it("renders singular when exercise_count is 1", () => {
    render(
      <TemplateCard
        template={{ ...template, exercise_count: 1 }}
        onOpen={() => {}}
        onMenu={() => {}}
      />
    )
    expect(screen.getByText(/1 øvelse$/i)).toBeInTheDocument()
  })

  it("calls onOpen with template id when the card is clicked", () => {
    const onOpen = vi.fn()
    render(<TemplateCard template={template} onOpen={onOpen} onMenu={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /Push A/ }))
    expect(onOpen).toHaveBeenCalledWith("t-1")
  })

  it("calls onMenu and not onOpen when the menu button is clicked", () => {
    const onOpen = vi.fn()
    const onMenu = vi.fn()
    render(<TemplateCard template={template} onOpen={onOpen} onMenu={onMenu} />)
    fireEvent.click(screen.getByRole("button", { name: /valg/i }))
    expect(onMenu).toHaveBeenCalledWith("t-1")
    expect(onOpen).not.toHaveBeenCalled()
  })
})
