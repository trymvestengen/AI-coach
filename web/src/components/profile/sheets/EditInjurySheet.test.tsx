import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EditInjurySheet from "./EditInjurySheet"

describe("EditInjurySheet", () => {
  it("renders and saves new injury", () => {
    const onSave = vi.fn()
    render(
      <EditInjurySheet
        open={true}
        onClose={() => {}}
        injury={null}
        onSave={onSave}
        onDelete={() => {}}
      />
    )
    fireEvent.change(screen.getByLabelText("Kroppsdel"), { target: { value: "venstre kne" } })
    fireEvent.change(screen.getByLabelText("Beskrivelse"), {
      target: { value: "vondt ved knebøy" },
    })
    fireEvent.click(screen.getByText("Moderat"))
    fireEvent.click(screen.getByText("Lagre"))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        body_part: "venstre kne",
        description: "vondt ved knebøy",
        severity: "moderat",
      })
    )
  })
})
