import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import QuickReplies from "./QuickReplies"

describe("QuickReplies", () => {
  it("renders one button per option", () => {
    render(<QuickReplies options={["Ja", "Nei", "Kanskje"]} onSelect={() => {}} />)
    expect(screen.getByRole("button", { name: "Ja" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nei" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Kanskje" })).toBeInTheDocument()
  })

  it("calls onSelect with the clicked option", () => {
    const onSelect = vi.fn()
    render(<QuickReplies options={["Ja", "Nei"]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("button", { name: "Nei" }))
    expect(onSelect).toHaveBeenCalledWith("Nei")
  })

  it("disables all buttons when disabled=true", () => {
    render(<QuickReplies options={["A", "B"]} onSelect={() => {}} disabled />)
    expect(screen.getByRole("button", { name: "A" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "B" })).toBeDisabled()
  })
})
