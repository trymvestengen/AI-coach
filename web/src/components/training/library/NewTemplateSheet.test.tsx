import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import NewTemplateSheet from "./NewTemplateSheet"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  createTemplate: vi.fn(),
}))

describe("training/NewTemplateSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders nothing when closed", () => {
    const { container } = render(
      <NewTemplateSheet open={false} folderId={null} onClose={() => {}} onCreated={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("creates a template in the active folder and passes the result to onCreated", async () => {
    const created = { id: "t-1", name: "Push A", folder_id: "f-2" }
    vi.mocked(api.createTemplate).mockResolvedValue(created)
    const onCreated = vi.fn()
    render(<NewTemplateSheet open folderId="f-2" onClose={() => {}} onCreated={onCreated} />)

    fireEvent.change(screen.getByPlaceholderText(/mal/i), { target: { value: "Push A" } })
    fireEvent.click(screen.getByRole("button", { name: /Lag mal/i }))

    await waitFor(() => expect(api.createTemplate).toHaveBeenCalledWith("Push A", "f-2"))
    expect(onCreated).toHaveBeenCalledWith(created)
  })
})
