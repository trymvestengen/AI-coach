import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import FolderPillBar from "./FolderPillBar"

describe("training/FolderPillBar", () => {
  const folders = [
    { id: "f-1", name: "Min PPL", template_count: 2 },
    { id: "f-2", name: "Bulk 26", template_count: 1 },
  ]

  it("renders 'Alle' pill with total count", () => {
    render(
      <FolderPillBar
        folders={folders}
        totalTemplateCount={3}
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
        totalTemplateCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    expect(screen.getByText("Min PPL")).toBeInTheDocument()
    expect(screen.getByText("Bulk 26")).toBeInTheDocument()
  })

  it("calls onSelect(folderId) when a folder pill is clicked", () => {
    const onSelect = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalTemplateCount={3}
        selectedFolderId={null}
        onSelect={onSelect}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByText("Min PPL"))
    expect(onSelect).toHaveBeenCalledWith("f-1")
  })

  it("calls onSelect(null) when 'Alle' is clicked", () => {
    const onSelect = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalTemplateCount={3}
        selectedFolderId={"f-1"}
        onSelect={onSelect}
        onAddFolder={() => {}}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByText(/Alle \(3\)/))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it("calls onAddFolder when '+ Mappe' is clicked", () => {
    const onAddFolder = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalTemplateCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={onAddFolder}
        onFolderLongPress={() => {}}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /\+ Mappe/i }))
    expect(onAddFolder).toHaveBeenCalledTimes(1)
  })

  it("calls onFolderLongPress on context menu", () => {
    const onFolderLongPress = vi.fn()
    render(
      <FolderPillBar
        folders={folders}
        totalTemplateCount={3}
        selectedFolderId={null}
        onSelect={() => {}}
        onAddFolder={() => {}}
        onFolderLongPress={onFolderLongPress}
      />
    )
    fireEvent.contextMenu(screen.getByText("Min PPL"))
    expect(onFolderLongPress).toHaveBeenCalledWith(folders[0])
  })
})
