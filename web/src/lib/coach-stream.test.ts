import { describe, it, expect, vi, beforeEach } from "vitest"
import { chatStream } from "./coach-stream"

function makeMockBody(chunks: string[]) {
  let i = 0
  return {
    getReader() {
      return {
        async read() {
          if (i >= chunks.length) return { done: true, value: undefined }
          const value = new TextEncoder().encode(chunks[i++])
          return { done: false, value }
        },
      }
    },
  } as unknown as ReadableStream<Uint8Array>
}

describe("chatStream", () => {
  beforeEach(() => {
    global.fetch = vi.fn() as unknown as typeof fetch
  })

  it("yields parsed events for a clean stream", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: makeMockBody([
        'data: {"type":"session_id","id":"s-1"}\n\n',
        'data: {"type":"text_delta","text":"Hei"}\n\n',
        'data: {"type":"done"}\n\n',
      ]),
    })

    const events: unknown[] = []
    for await (const ev of chatStream("token", null, "hei")) {
      events.push(ev)
    }
    expect(events).toEqual([
      { type: "session_id", id: "s-1" },
      { type: "text_delta", text: "Hei" },
      { type: "done" },
    ])
  })

  it("handles partial frames across chunk boundaries", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      body: makeMockBody([
        'data: {"type":"session_id"',
        ',"id":"s-1"}\n\ndata: {"type":"done"}\n\n',
      ]),
    })

    const events: unknown[] = []
    for await (const ev of chatStream("token", null, "hei")) {
      events.push(ev)
    }
    expect(events).toEqual([{ type: "session_id", id: "s-1" }, { type: "done" }])
  })

  it("throws on non-ok response", async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      body: null,
    })
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of chatStream("token", null, "hei")) {
        /* noop */
      }
    }).rejects.toThrow()
  })
})
