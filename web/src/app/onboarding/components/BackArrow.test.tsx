import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import BackArrow from "./BackArrow"

describe("BackArrow", () => {
  it("renders a button with accessible label", () => {
    render(<BackArrow onClick={() => {}} />)
    expect(screen.getByRole("button", { name: /tilbake/i })).toBeInTheDocument()
  })

  it("calls onClick when pressed", () => {
    const onClick = vi.fn()
    render(<BackArrow onClick={onClick} />)
    fireEvent.click(screen.getByRole("button", { name: /tilbake/i }))
    expect(onClick).toHaveBeenCalled()
  })
})
