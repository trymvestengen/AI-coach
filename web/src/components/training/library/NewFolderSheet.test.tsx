import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import NewFolderSheet from "./NewFolderSheet"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  createTemplateFolder: vi.fn(),
}))

describe("training/NewFolderSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders nothing when closed", () => {
    const { container } = render(
      <NewFolderSheet open={false} onClose={() => {}} onCreated={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("creates a template folder and calls onCreated", async () => {
    vi.mocked(api.createTemplateFolder).mockResolvedValue({
      id: "f-1",
      name: "Bulk 27",
      template_count: 0,
    })
    const onCreated = vi.fn()
    render(<NewFolderSheet open onClose={() => {}} onCreated={onCreated} />)

    fireEvent.change(screen.getByPlaceholderText(/Bulk/i), { target: { value: "Bulk 27" } })
    fireEvent.click(screen.getByRole("button", { name: /Lag mappe/i }))

    await waitFor(() => expect(api.createTemplateFolder).toHaveBeenCalledWith("Bulk 27"))
    expect(onCreated).toHaveBeenCalledTimes(1)
  })
})
