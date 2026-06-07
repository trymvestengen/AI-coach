import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import EditExerciseSheet from "./EditExerciseSheet"

describe("EditExerciseSheet", () => {
  it("does not render when open is false", () => {
    render(
      <EditExerciseSheet
        open={false}
        initial={{ sets: 3, reps: 10, weight_kg: 80, notes: "" }}
        onClose={() => {}}
        onSave={() => {}}
      />
    )
    expect(screen.queryByRole("button", { name: /lagre/i })).not.toBeInTheDocument()
  })

  it("pre-fills inputs with initial values", () => {
    render(
      <EditExerciseSheet
        open={true}
        initial={{ sets: 4, reps: 8, weight_kg: 60, notes: "note" }}
        onClose={() => {}}
        onSave={() => {}}
      />
    )
    expect(screen.getByLabelText(/sett/i)).toHaveValue(4)
    expect(screen.getByLabelText(/reps/i)).toHaveValue(8)
    expect(screen.getByLabelText(/vekt/i)).toHaveValue(60)
    expect(screen.getByLabelText(/notes/i)).toHaveValue("note")
  })

  it("calls onSave with all 4 fields", () => {
    const onSave = vi.fn()
    render(
      <EditExerciseSheet
        open={true}
        initial={{ sets: 3, reps: 10, weight_kg: 80, notes: "" }}
        onClose={() => {}}
        onSave={onSave}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /lagre/i }))
    expect(onSave).toHaveBeenCalledWith({ sets: 3, reps: 10, weight_kg: 80, notes: "" })
  })
})
