import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TemplateMenuSheet from "./TemplateMenuSheet"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}))

describe("TemplateMenuSheet", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders nothing when template is null", () => {
    const { container } = render(
      <TemplateMenuSheet
        template={null}
        onClose={() => {}}
        onChanged={() => {}}
        onDeleted={() => {}}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("renames the template via updateTemplate and calls onChanged", async () => {
    vi.mocked(api.updateTemplate).mockResolvedValue({ id: "t-1", status: "ok" })
    const onChanged = vi.fn()
    render(
      <TemplateMenuSheet
        template={{ id: "t-1", name: "Push A", folder_id: null }}
        onClose={() => {}}
        onChanged={onChanged}
        onDeleted={() => {}}
      />
    )
    const input = screen.getByDisplayValue("Push A")
    fireEvent.change(input, { target: { value: "Push B" } })
    fireEvent.click(screen.getByRole("button", { name: /Lagre navn/i }))
    await waitFor(() => expect(api.updateTemplate).toHaveBeenCalledWith("t-1", { name: "Push B" }))
    expect(onChanged).toHaveBeenCalled()
  })

  it("deletes the template via deleteTemplate and calls onDeleted", async () => {
    vi.mocked(api.deleteTemplate).mockResolvedValue(undefined)
    const onDeleted = vi.fn()
    render(
      <TemplateMenuSheet
        template={{ id: "t-1", name: "Push A", folder_id: null }}
        onClose={() => {}}
        onChanged={() => {}}
        onDeleted={onDeleted}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /Slett mal/i }))
    await waitFor(() => expect(api.deleteTemplate).toHaveBeenCalledWith("t-1"))
    expect(onDeleted).toHaveBeenCalled()
  })

  it("renders 7 weekday chips (Ma..Sø)", () => {
    render(
      <TemplateMenuSheet
        template={{ id: "t-1", name: "Push A", folder_id: null, scheduled_days: [] }}
        onClose={() => {}}
        onChanged={() => {}}
        onDeleted={() => {}}
      />
    )
    for (const label of ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"]) {
      expect(screen.getByRole("button", { name: label })).toBeDefined()
    }
  })

  it("clicking a weekday chip calls updateTemplate with sorted merged days", async () => {
    vi.mocked(api.updateTemplate).mockResolvedValue({ id: "t-1", status: "ok" })
    const onChanged = vi.fn()
    render(
      <TemplateMenuSheet
        template={{ id: "t-1", name: "Push A", folder_id: null, scheduled_days: [1] }}
        onClose={() => {}}
        onChanged={onChanged}
        onDeleted={() => {}}
      />
    )
    // Click "On" (ISO 3) — should add it to existing [1]
    fireEvent.click(screen.getByRole("button", { name: "On" }))
    await waitFor(() =>
      expect(api.updateTemplate).toHaveBeenCalledWith("t-1", { scheduled_days: [1, 3] })
    )
    expect(onChanged).toHaveBeenCalled()
  })
})
