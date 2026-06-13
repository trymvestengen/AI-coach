import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import CoachSuggestionCard from "./CoachSuggestionCard"

describe("CoachSuggestionCard", () => {
  const suggestion = {
    template_id: "t-9",
    name: "Pull A",
    reason: "basert på økta i går",
  }

  it("renders the suggested template name and reason", () => {
    render(<CoachSuggestionCard suggestion={suggestion} onStart={() => {}} onSwap={() => {}} />)
    expect(screen.getByText(/Coachen foreslår/i)).toBeInTheDocument()
    expect(screen.getByText("Pull A")).toBeInTheDocument()
    expect(screen.getByText(/basert på økta i går/i)).toBeInTheDocument()
  })

  it("calls onStart with the template id when 'Start økt' is clicked", () => {
    const onStart = vi.fn()
    render(<CoachSuggestionCard suggestion={suggestion} onStart={onStart} onSwap={() => {}} />)
    fireEvent.click(screen.getByRole("button", { name: /Start økt/i }))
    expect(onStart).toHaveBeenCalledWith("t-9")
  })

  it("calls onSwap when 'Bytt' is clicked", () => {
    const onSwap = vi.fn()
    render(<CoachSuggestionCard suggestion={suggestion} onStart={() => {}} onSwap={onSwap} />)
    fireEvent.click(screen.getByRole("button", { name: /Bytt/i }))
    expect(onSwap).toHaveBeenCalledTimes(1)
  })
})
