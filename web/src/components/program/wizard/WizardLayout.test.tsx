import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import WizardLayout from "./WizardLayout"

describe("WizardLayout", () => {
  it("shows progress bar with given percent", () => {
    render(
      <WizardLayout progressPercent={50} onBack={() => {}}>
        <div>child</div>
      </WizardLayout>
    )
    expect(screen.getByTestId("wizard-progress")).toHaveStyle({ width: "50%" })
  })

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn()
    render(
      <WizardLayout progressPercent={25} onBack={onBack}>
        <div>child</div>
      </WizardLayout>
    )
    fireEvent.click(screen.getByLabelText("Tilbake"))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it("renders children", () => {
    render(
      <WizardLayout progressPercent={25} onBack={() => {}}>
        <div>my content</div>
      </WizardLayout>
    )
    expect(screen.getByText("my content")).toBeInTheDocument()
  })
})
