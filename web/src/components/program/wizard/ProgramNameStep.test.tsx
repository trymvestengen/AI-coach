import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import ProgramNameStep from "./ProgramNameStep"

describe("ProgramNameStep", () => {
  it("disables Fortsett when input is empty", () => {
    render(<ProgramNameStep initialName="" onNext={() => {}} />)
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeDisabled()
  })

  it("enables Fortsett when input has at least one char", () => {
    render(<ProgramNameStep initialName="PPL" onNext={() => {}} />)
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeEnabled()
  })

  it("calls onNext with trimmed name when Fortsett is clicked", () => {
    const onNext = vi.fn()
    render(<ProgramNameStep initialName="  PPL  " onNext={onNext} />)
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onNext).toHaveBeenCalledWith("PPL")
  })
})
