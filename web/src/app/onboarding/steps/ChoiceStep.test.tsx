import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import ChoiceStep from "./ChoiceStep"

const opts = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
  { value: "c", label: "Gamma" },
]

describe("ChoiceStep", () => {
  it("renders all options", () => {
    render(
      <ChoiceStep
        title="Velg"
        options={opts}
        value={[]}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        multi
      />
    )
    expect(screen.getByRole("button", { name: "Alpha" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Beta" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Gamma" })).toBeInTheDocument()
  })

  it("single-select: clicking calls onChange with single value array", () => {
    const onChange = vi.fn()
    render(
      <ChoiceStep
        title="x"
        options={opts}
        value={[]}
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Beta" }))
    expect(onChange).toHaveBeenCalledWith(["b"])
  })

  it("multi-select: clicking toggles values", () => {
    const onChange = vi.fn()
    render(
      <ChoiceStep
        title="x"
        options={opts}
        value={["a"]}
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
        multi
      />
    )
    fireEvent.click(screen.getByRole("button", { name: "Beta" }))
    expect(onChange).toHaveBeenCalledWith(["a", "b"])
    onChange.mockClear()
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it("disables Next when value is empty", () => {
    render(
      <ChoiceStep
        title="x"
        options={opts}
        value={[]}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })

  it("enables Next when at least one option is selected", () => {
    render(
      <ChoiceStep
        title="x"
        options={opts}
        value={["a"]}
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).not.toBeDisabled()
  })
})
