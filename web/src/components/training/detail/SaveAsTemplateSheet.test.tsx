import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import SaveAsTemplateSheet from "./SaveAsTemplateSheet"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  createTemplateFromWorkout: vi.fn(),
}))

describe("SaveAsTemplateSheet", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders nothing when closed", () => {
    const { container } = render(
      <SaveAsTemplateSheet open={false} workoutId="w-1" onClose={() => {}} onSaved={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("saves the workout as a template and calls onSaved", async () => {
    vi.mocked(api.createTemplateFromWorkout).mockResolvedValue({ id: "t-1", name: "Push A" })
    const onSaved = vi.fn()
    render(<SaveAsTemplateSheet open workoutId="w-1" onClose={() => {}} onSaved={onSaved} />)

    fireEvent.change(screen.getByPlaceholderText(/mal/i), { target: { value: "Push A" } })
    fireEvent.click(screen.getByRole("button", { name: /Lagre som mal/i }))

    await waitFor(() =>
      expect(api.createTemplateFromWorkout).toHaveBeenCalledWith({
        workout_id: "w-1",
        name: "Push A",
      })
    )
    expect(onSaved).toHaveBeenCalledTimes(1)
  })
})
