import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import CoachClient from "./CoachClient"

vi.mock("@/lib/coach-stream", () => {
  return {
    chatStream: vi.fn(async function* () {
      yield { type: "session_id", id: "s-1" }
      yield { type: "text_delta", text: "Hei!" }
      yield { type: "done" }
    }),
  }
})

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe("CoachClient", () => {
  it("renders initial messages", () => {
    render(
      <CoachClient
        initialSessionId={"s-1"}
        initialMessages={[
          { id: "m-1", role: "user", content: { text: "hei" } },
          { id: "m-2", role: "assistant", content: { text: "Hei tilbake" } },
        ]}
        accessToken="token"
      />
    )
    expect(screen.getByText("hei")).toBeInTheDocument()
    expect(screen.getByText("Hei tilbake")).toBeInTheDocument()
  })

  it("sends user message and streams reply", async () => {
    render(<CoachClient initialSessionId={null} initialMessages={[]} accessToken="token" />)
    const textarea = screen.getByPlaceholderText(/spør coachen/i) as HTMLInputElement
    fireEvent.change(textarea, { target: { value: "hei coach" } })
    fireEvent.click(screen.getByRole("button", { name: /send melding/i }))

    await waitFor(() => {
      expect(screen.getByText("hei coach")).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByText("Hei!")).toBeInTheDocument()
    })
  })
})
