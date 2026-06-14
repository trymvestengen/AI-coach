import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import NewExerciseSheet from "./NewExerciseSheet"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({ createCustomExercise: vi.fn() }))

describe("NewExerciseSheet", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders nothing when closed", () => {
    const { container } = render(
      <NewExerciseSheet open={false} onClose={vi.fn()} onCreated={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("creates a custom exercise and calls onCreated", async () => {
    vi.mocked(api.createCustomExercise).mockResolvedValue({
      id: "usr-1",
      name: "Min curl",
      is_custom: true,
    })
    const onCreated = vi.fn()
    render(<NewExerciseSheet open onClose={vi.fn()} onCreated={onCreated} />)
    fireEvent.change(screen.getByLabelText(/navn/i), { target: { value: "Min curl" } })
    fireEvent.click(screen.getByRole("button", { name: /lag øvelse/i }))
    await waitFor(() =>
      expect(api.createCustomExercise).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Min curl" })
      )
    )
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith("usr-1"))
  })
})
