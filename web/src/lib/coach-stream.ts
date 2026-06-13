const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export type StreamEvent =
  | { type: "session_id"; id: string }
  | { type: "text_delta"; text: string }
  | { type: "tool_use"; tool_use_id: string; name: string; input: unknown }
  | {
      type: "tool_result"
      tool_use_id: string
      name: string
      ok: boolean
      result_link?: { label: string; href: string }
    }
  | { type: "done" }
  | { type: "error"; message: string }

export async function* chatStream(
  token: string,
  sessionId: string | null,
  message: string
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ session_id: sessionId, message }),
  })
  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    while (true) {
      const idx = buffer.indexOf("\n\n")
      if (idx === -1) break
      const frame = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"))
      if (!dataLine) continue
      const json = dataLine.slice(5).trim()
      if (!json) continue
      yield JSON.parse(json) as StreamEvent
    }
  }
}
