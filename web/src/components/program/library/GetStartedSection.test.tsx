import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import GetStartedSection from "./GetStartedSection"

describe("GetStartedSection", () => {
  it("renders 'Lag ditt første program' when empty", () => {
    const onCreate = vi.fn()
    render(
      <GetStartedSection
        state={{ kind: "empty" }}
        onCreateProgram={onCreate}
        onPickActive={() => {}}
      />
    )
    expect(screen.getByText(/første program/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Lag program/i }))
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it("renders 'Velg aktivt program' when no-active", () => {
    const onPick = vi.fn()
    render(
      <GetStartedSection
        state={{ kind: "no-active", programCount: 3 }}
        onCreateProgram={() => {}}
        onPickActive={onPick}
      />
    )
    expect(screen.getByText(/Ingen er aktiv/)).toBeInTheDocument()
    expect(screen.getByText(/3 programmer/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Velg aktivt program/i }))
    expect(onPick).toHaveBeenCalledTimes(1)
  })

  it("renders 'Lag et nytt program' when has-active", () => {
    const onCreate = vi.fn()
    render(
      <GetStartedSection
        state={{ kind: "has-active" }}
        onCreateProgram={onCreate}
        onPickActive={() => {}}
      />
    )
    expect(screen.getByText("Lag et nytt program")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Lag program/i }))
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it("uses singular 'program' when programCount is 1", () => {
    render(
      <GetStartedSection
        state={{ kind: "no-active", programCount: 1 }}
        onCreateProgram={() => {}}
        onPickActive={() => {}}
      />
    )
    expect(screen.getByText(/Du har 1 program/)).toBeInTheDocument()
  })
})
