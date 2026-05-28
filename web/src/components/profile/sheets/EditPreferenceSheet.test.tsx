import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EditPreferenceSheet from "./EditPreferenceSheet"
import EditConstraintSheet from "./EditConstraintSheet"

describe("EditPreferenceSheet", () => {
  it("creates new preference", () => {
    const onSave = vi.fn()
    render(
      <EditPreferenceSheet
        open={true}
        onClose={() => {}}
        preference={null}
        onSave={onSave}
        onDelete={() => {}}
      />
    )
    fireEvent.click(screen.getByText("Øvelse"))
    fireEvent.change(screen.getByLabelText("Beskrivelse"), {
      target: { value: "liker ikke beinpress" },
    })
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "exercise",
        preference: "liker ikke beinpress",
      })
    )
  })
})

describe("EditConstraintSheet", () => {
  it("creates new constraint", () => {
    const onSave = vi.fn()
    render(
      <EditConstraintSheet
        open={true}
        onClose={() => {}}
        constraint={null}
        onSave={onSave}
        onDelete={() => {}}
      />
    )
    fireEvent.click(screen.getByText("Tidsplan"))
    fireEvent.change(screen.getByLabelText("Beskrivelse"), {
      target: { value: "kun tirs/tors/lør" },
    })
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "schedule",
        description: "kun tirs/tors/lør",
      })
    )
  })
})
