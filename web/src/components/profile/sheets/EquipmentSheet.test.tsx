import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import EquipmentSheet from "./EquipmentSheet"

describe("EquipmentSheet", () => {
  it("adds custom equipment", () => {
    const onAdd = vi.fn()
    render(
      <EquipmentSheet
        open={true}
        onClose={() => {}}
        mode="add"
        existing={[]}
        onAdd={onAdd}
        onDelete={() => {}}
        item={null}
      />
    )
    fireEvent.change(screen.getByLabelText("Utstyr"), { target: { value: "kettlebell_16kg" } })
    fireEvent.click(screen.getByText("Lagre"))
    expect(onAdd).toHaveBeenCalledWith("kettlebell_16kg")
  })

  it("applies home gym preset", () => {
    const onAdd = vi.fn()
    render(
      <EquipmentSheet
        open={true}
        onClose={() => {}}
        mode="add"
        existing={[]}
        onAdd={onAdd}
        onDelete={() => {}}
        item={null}
      />
    )
    fireEvent.click(screen.getByText("Hjemmegym basic"))
    expect(onAdd).toHaveBeenCalled()
    expect((onAdd as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1)
  })
})
