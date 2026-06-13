import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import FolderPillBar from "./FolderPillBar"

describe("FolderPillBar", () => {
  const folders = [
    { id: "f-1", name: "Min split", program_count: 2 },
    { id: "f-2", name: "Bulk 26", program_count: 1 },
  ]

  it("renders 'Alle' pill with total count", () => {
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    expect(screen.getByText(/Alle \(3\)/)).toBeInTheDocument()
  })

  it("renders a pill for each folder", () => {
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    expect(screen.getByText("Min split")).toBeInTheDocument()
    expect(screen.getByText("Bulk 26")).toBeInTheDocument()
  })

  it("renders + Mappe pill at the end", () => {
    render(
      <FolderPillBar
        folders={[]}
        totalProgramCount={0}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    expect(screen.getByRole("button", { name: /\+ Mappe/i })).toBeInTheDocument()
  })

  it("calls onSelect(null) when 'Alle' is clicked", () => {
    const onSelect = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={"f-1"}
        onSelect={onSelect}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByText(/Alle \(3\)/))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it("calls onSelect(folderId) when a folder pill is clicked", () => {
    const onSelect = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={null}
        onSelect={onSelect}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByText("Min split"))
    expect(onSelect).toHaveBeenCalledWith("f-1")
  })

  it("calls onAddFolder when '+ Mappe' is clicked", () => {
    const onAddFolder = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalProgramCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={onAddFolder}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /\+ Mappe/i }))
    expect(onAddFolder).toHaveBeenCalledTimes(1)
  })
})
