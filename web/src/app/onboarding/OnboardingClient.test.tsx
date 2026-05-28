import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import OnboardingClient from "./OnboardingClient"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("@/lib/coach-stream", () => ({
  chatStream: vi.fn(),
}))

const { chatStream } = await import("@/lib/coach-stream")

async function* fakeStream(events: unknown[]) {
  for (const ev of events) yield ev
}

describe("OnboardingClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("auto-sends an initial 'hei' message on mount", async () => {
    ;(chatStream as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeStream([{ type: "text_delta", text: "Hei Trym!" }, { type: "done" }])
    )
    render(<OnboardingClient accessToken="tok" firstName="Trym" />)
    await waitFor(() => {
      expect(chatStream).toHaveBeenCalled()
    })
    const args = (chatStream as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(args[3]).toBe("onboarding") // mode parameter
  })

  it("renders quick-reply buttons when quick_replies event arrives", async () => {
    ;(chatStream as ReturnType<typeof vi.fn>).mockReturnValue(
      fakeStream([
        { type: "text_delta", text: "Hva er målet ditt?" },
        { type: "quick_replies", options: ["Bygg muskler", "Bli sterkere"] },
        { type: "done" },
      ])
    )
    render(<OnboardingClient accessToken="tok" firstName="Trym" />)
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Bygg muskler" })).toBeInTheDocument()
    })
  })

  it("sends quick-reply text as user message when clicked", async () => {
    let callIdx = 0
    ;(chatStream as ReturnType<typeof vi.fn>).mockImplementation(() => {
      callIdx += 1
      if (callIdx === 1) {
        return fakeStream([
          { type: "text_delta", text: "Hva er målet?" },
          { type: "quick_replies", options: ["Bygg muskler"] },
          { type: "done" },
        ])
      }
      return fakeStream([{ type: "text_delta", text: "Bra!" }, { type: "done" }])
    })
    render(<OnboardingClient accessToken="tok" firstName="Trym" />)
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Bygg muskler" })).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole("button", { name: "Bygg muskler" }))
    await waitFor(() => {
      expect((chatStream as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2)
    })
    const secondCall = (chatStream as ReturnType<typeof vi.fn>).mock.calls[1]
    expect(secondCall[2]).toBe("Bygg muskler")
  })
})
