import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DateStep from "./DateStep"

describe("DateStep", () => {
  it("renders date input", () => {
    const { container } = render(
      <DateStep
        title="Når er du født?"
        value=""
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    expect(container.querySelector("input[type='date']")).toBeInTheDocument()
  })

  it("calls onChange with YYYY-MM-DD value", () => {
    const onChange = vi.fn()
    const { container } = render(
      <DateStep title="x" value="" onChange={onChange} onNext={() => {}} onBack={() => {}} />
    )
    const input = container.querySelector("input[type='date']")!
    fireEvent.change(input, { target: { value: "1990-03-15" } })
    expect(onChange).toHaveBeenCalledWith("1990-03-15")
  })

  it("disables Next when value empty", () => {
    render(<DateStep title="x" value="" onChange={() => {}} onNext={() => {}} onBack={() => {}} />)
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })
})
