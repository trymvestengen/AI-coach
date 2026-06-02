import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import NumberStep from "./NumberStep"

describe("NumberStep", () => {
  it("renders input with unit suffix", () => {
    render(
      <NumberStep
        title="Vekt"
        unit="kg"
        value={null}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        min={30}
        max={200}
      />
    )
    expect(screen.getByText("kg")).toBeInTheDocument()
  })

  it("calls onChange with parsed integer", () => {
    const onChange = vi.fn()
    render(
      <NumberStep
        title="x"
        unit="kg"
        value={null}
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
        min={30}
        max={200}
      />
    )
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "85" } })
    expect(onChange).toHaveBeenCalledWith(85)
  })

  it("disables Next when value is below min", () => {
    render(
      <NumberStep
        title="x"
        unit="kg"
        value={10}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        min={30}
        max={200}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })

  it("enables Next when value is within range", () => {
    render(
      <NumberStep
        title="x"
        unit="kg"
        value={80}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        min={30}
        max={200}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).not.toBeDisabled()
  })
})
