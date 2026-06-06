import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import FolderCard from "./FolderCard"

describe("FolderCard", () => {
  it("renders name and program count", () => {
    render(
      <FolderCard folder={{ id: "f-1", name: "Bulk 2026", program_count: 3 }} onOpen={() => {}} />
    )
    expect(screen.getByText("Bulk 2026")).toBeInTheDocument()
    expect(screen.getByText("3 programmer")).toBeInTheDocument()
  })

  it("renders '1 program' singular when count is 1", () => {
    render(<FolderCard folder={{ id: "f-2", name: "Cut", program_count: 1 }} onOpen={() => {}} />)
    expect(screen.getByText("1 program")).toBeInTheDocument()
  })

  it("fires onOpen when clicked", () => {
    const onOpen = vi.fn()
    render(<FolderCard folder={{ id: "f-3", name: "X", program_count: 0 }} onOpen={onOpen} />)
    fireEvent.click(screen.getByRole("button"))
    expect(onOpen).toHaveBeenCalledWith("f-3")
  })
})
