export type Message = {
  role: "user" | "assistant"
  content: string
}

export type Persona = "friend" | "sergeant" | "analyst"

export async function sendMessage(messages: Message[], persona: Persona = "friend"): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/chat`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, persona }),
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}`)
  }

  const data = await res.json()
  return data.message as string
}
