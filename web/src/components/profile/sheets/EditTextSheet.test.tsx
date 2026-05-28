import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EditTextSheet from "./EditTextSheet"
import EditChoiceSheet from "./EditChoiceSheet"
import EditMultiSelectSheet from "./EditMultiSelectSheet"

describe("EditTextSheet", () => {
  it("renders input and calls onSave with new value", () => {
    const onSave = vi.fn()
    render(
      <EditTextSheet
        open={true}
        onClose={() => {}}
        title="Edit Weight"
        initialValue="75"
        unit="kg"
        type="number"
        onSave={onSave}
      />
    )
    const input = screen.getByRole("spinbutton") as HTMLInputElement
    fireEvent.change(input, { target: { value: "76" } })
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith("76")
  })
})

describe("EditChoiceSheet", () => {
  it("renders choices and selects one", () => {
    const onSave = vi.fn()
    render(
      <EditChoiceSheet
        open={true}
        onClose={() => {}}
        title="Erfaring"
        choices={[
          { value: "beginner", label: "Nybegynner" },
          { value: "intermediate", label: "Middels" },
        ]}
        initialValue="beginner"
        onSave={onSave}
      />
    )
    fireEvent.click(screen.getByText("Middels"))
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith("intermediate")
  })
})

describe("EditMultiSelectSheet", () => {
  it("toggles selections", () => {
    const onSave = vi.fn()
    render(
      <EditMultiSelectSheet
        open={true}
        onClose={() => {}}
        title="Mål"
        choices={[
          { value: "build_muscle", label: "Bygg muskler" },
          { value: "lose_weight", label: "Gå ned i vekt" },
        ]}
        initialValues={["build_muscle"]}
        onSave={onSave}
      />
    )
    fireEvent.click(screen.getByText("Gå ned i vekt"))
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith(["build_muscle", "lose_weight"])
  })
})
