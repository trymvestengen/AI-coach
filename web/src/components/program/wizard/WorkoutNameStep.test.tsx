import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import WorkoutNameStep from "./WorkoutNameStep"

describe("WorkoutNameStep", () => {
  it("pre-fills input with initialName", () => {
    render(<WorkoutNameStep initialName="Push" onNext={() => {}} />)
    expect(screen.getByRole("textbox")).toHaveValue("Push")
  })

  it("disables Fortsett when empty", () => {
    render(<WorkoutNameStep initialName="" onNext={() => {}} />)
    expect(screen.getByRole("button", { name: /fortsett/i })).toBeDisabled()
  })

  it("calls onNext with trimmed name", () => {
    const onNext = vi.fn()
    render(<WorkoutNameStep initialName=" Push " onNext={onNext} />)
    fireEvent.click(screen.getByRole("button", { name: /fortsett/i }))
    expect(onNext).toHaveBeenCalledWith("Push")
  })
})
