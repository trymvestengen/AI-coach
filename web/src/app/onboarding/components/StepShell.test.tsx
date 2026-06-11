import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import StepShell from "./StepShell"

describe("StepShell", () => {
  it("renders title and children", () => {
    render(
      <StepShell title="Hello" onBack={() => {}} onNext={() => {}} canProgress>
        <div>child content</div>
      </StepShell>
    )
    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument()
    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("shows back arrow when onBack provided", () => {
    render(
      <StepShell title="x" onBack={() => {}} onNext={() => {}} canProgress>
        <div />
      </StepShell>
    )
    expect(screen.getByRole("button", { name: /tilbake/i })).toBeInTheDocument()
  })

  it("hides back arrow when onBack is null", () => {
    render(
      <StepShell title="x" onBack={null} onNext={() => {}} canProgress>
        <div />
      </StepShell>
    )
    expect(screen.queryByRole("button", { name: /tilbake/i })).not.toBeInTheDocument()
  })

  it("disables Next when canProgress is false", () => {
    render(
      <StepShell title="x" onBack={() => {}} onNext={() => {}} canProgress={false}>
        <div />
      </StepShell>
    )
    expect(screen.getByRole("button", { name: /neste/i })).toBeDisabled()
  })

  it("calls onNext when Next clicked", () => {
    const onNext = vi.fn()
    render(
      <StepShell title="x" onBack={() => {}} onNext={onNext} canProgress>
        <div />
      </StepShell>
    )
    fireEvent.click(screen.getByRole("button", { name: /neste/i }))
    expect(onNext).toHaveBeenCalled()
  })

  it("renders skip link when onSkip provided", () => {
    const onSkip = vi.fn()
    render(
      <StepShell title="x" onBack={() => {}} onNext={() => {}} canProgress onSkip={onSkip}>
        <div />
      </StepShell>
    )
    fireEvent.click(screen.getByRole("button", { name: /hopp over/i }))
    expect(onSkip).toHaveBeenCalled()
  })

  it("hides skip link when onSkip omitted", () => {
    render(
      <StepShell title="x" onBack={() => {}} onNext={() => {}} canProgress>
        <div />
      </StepShell>
    )
    expect(screen.queryByRole("button", { name: /hopp over/i })).not.toBeInTheDocument()
  })

  it("renders progress bar when totalSteps > 0", () => {
    const { container } = render(
      <StepShell
        title="x"
        onBack={() => {}}
        onNext={() => {}}
        canProgress
        currentStep={3}
        totalSteps={10}
      >
        <div />
      </StepShell>
    )
    expect(container.querySelectorAll("[data-segment]").length).toBe(10)
  })
})
