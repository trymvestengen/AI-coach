import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import ProfileSection from "./ProfileSection"
import ProfileField from "./ProfileField"
import ProfileList from "./ProfileList"

describe("ProfileSection", () => {
  it("renders title and children", () => {
    render(
      <ProfileSection title="Kropp">
        <div>contents</div>
      </ProfileSection>
    )
    expect(screen.getByText("Kropp")).toBeInTheDocument()
    expect(screen.getByText("contents")).toBeInTheDocument()
  })
})

describe("ProfileField", () => {
  it("renders label, value, and chevron", () => {
    render(<ProfileField label="Vekt" value="75 kg" onClick={() => {}} />)
    expect(screen.getByText("Vekt")).toBeInTheDocument()
    expect(screen.getByText("75 kg")).toBeInTheDocument()
  })
})

describe("ProfileList", () => {
  it("renders items and add button", () => {
    render(
      <ProfileList
        items={[{ id: "1", primary: "Item 1", secondary: "details" }]}
        onAdd={() => {}}
        onItemClick={() => {}}
        addLabel="Legg til"
      />
    )
    expect(screen.getByText("Item 1")).toBeInTheDocument()
    expect(screen.getByText("+ Legg til")).toBeInTheDocument()
  })
})
