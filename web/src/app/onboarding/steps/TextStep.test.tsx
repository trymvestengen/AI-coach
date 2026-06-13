import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import TextStep from "./TextStep"

describe("TextStep", () => {
  it("renders title and input with placeholder", () => {
    render(
      <TextStep
        title="Hva heter du?"
        placeholder="Fornavn"
        value=""
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        validate={(v) => v.length > 0}
      />
    )
    expect(screen.getByRole("heading", { name: "Hva heter du?" })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Fornavn")).toBeInTheDocument()
  })

  it("calls onChange when typing", () => {
    const onChange = vi.fn()
    render(
      <TextStep
        title="x"
        placeholder="p"
        value=""
        onChange={onChange}
        onNext={() => {}}
        onBack={() => {}}
        validate={() => true}
      />
    )
    fireEvent.change(screen.getByPlaceholderText("p"), { target: { value: "Trym" } })
    expect(onChange).toHaveBeenCalledWith("Trym")
  })

  it("disables Next when validate returns false", () => {
    render(
      <TextStep
        title="x"
        placeholder="p"
        value=""
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        validate={(v) => v.length >= 6}
      />
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })

  it("supports password type", () => {
    render(
      <TextStep
        title="x"
        placeholder="p"
        value="abcdef"
        onChange={() => {}}
        onNext={() => {}}
        onBack={() => {}}
        validate={() => true}
        type="password"
      />
    )
    expect(screen.getByPlaceholderText("p")).toHaveAttribute("type", "password")
  })
})
