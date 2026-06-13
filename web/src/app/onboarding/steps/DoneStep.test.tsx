import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import DoneStep from "./DoneStep"

describe("DoneStep", () => {
  it("renders greeting with first name", () => {
    render(
      <DoneStep
        firstName="Trym"
        summary={{ goals: "Bygg muskler", experience: "Middels", days: "3-4" }}
        onFinish={() => {}}
        busy={false}
      />
    )
    expect(screen.getByText(/Alt klart, Trym/)).toBeInTheDocument()
  })

  it("renders summary rows", () => {
    render(
      <DoneStep
        firstName="T"
        summary={{ goals: "Bygg muskler", experience: "Middels", days: "3-4" }}
        onFinish={() => {}}
        busy={false}
      />
    )
    expect(screen.getByText("Bygg muskler")).toBeInTheDocument()
    expect(screen.getByText("Middels")).toBeInTheDocument()
    expect(screen.getByText("3-4")).toBeInTheDocument()
  })

  it("calls onFinish when 'Kom i gang' clicked", () => {
    const onFinish = vi.fn()
    render(<DoneStep firstName="T" summary={{}} onFinish={onFinish} busy={false} />)
    fireEvent.click(screen.getByRole("button", { name: /kom i gang/i }))
    expect(onFinish).toHaveBeenCalled()
  })

  it("disables button when busy", () => {
    render(<DoneStep firstName="T" summary={{}} onFinish={() => {}} busy />)
    expect(screen.getByRole("button", { name: /lagrer/i })).toBeDisabled()
  })
})
