import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import TemplateMenuSheet from "./TemplateMenuSheet"
import * as api from "@/lib/api"

vi.mock("@/lib/api", () => ({
  updateTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
}))

const folders = [{ id: "f-1", name: "Min PPL", template_count: 1 }]

describe("TemplateMenuSheet", () => {
  beforeEach(() => vi.clearAllMocks())

  it("renders nothing when template is null", () => {
    const { container } = render(
      <TemplateMenuSheet
        template={null}
        folders={folders}
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
        folders={folders}
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
        folders={folders}
        onClose={() => {}}
        onChanged={() => {}}
        onDeleted={onDeleted}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /Slett mal/i }))
    await waitFor(() => expect(api.deleteTemplate).toHaveBeenCalledWith("t-1"))
    expect(onDeleted).toHaveBeenCalled()
  })

  it("moves the template to a folder via updateTemplate and calls onChanged", async () => {
    vi.mocked(api.updateTemplate).mockResolvedValue({ id: "t-1", status: "ok" })
    const onChanged = vi.fn()
    render(
      <TemplateMenuSheet
        template={{ id: "t-1", name: "Push A", folder_id: null }}
        folders={folders}
        onClose={() => {}}
        onChanged={onChanged}
        onDeleted={() => {}}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /Min PPL/i }))
    await waitFor(() =>
      expect(api.updateTemplate).toHaveBeenCalledWith("t-1", { folder_id: "f-1" })
    )
    expect(onChanged).toHaveBeenCalled()
  })
})
