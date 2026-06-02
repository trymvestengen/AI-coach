"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import ChatBody, { type Message } from "./ChatBody"
import VoiceSheet from "@/components/voice/VoiceSheet"
import { chatStream, type StreamEvent } from "@/lib/coach-stream"

interface Props {
  initialSessionId: string | null
  initialMessages: Message[]
  accessToken: string
}

export default function CoachClient({ initialSessionId, initialMessages, accessToken }: Props) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [firstByteSeen, setFirstByteSeen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    setInput("")
    setIsStreaming(true)
    setFirstByteSeen(false)

    const userMsgId = `local-user-${Date.now()}`
    setMessages((m) => [...m, { id: userMsgId, role: "user", content: { text: trimmed } }])

    let assistantId: string | null = null

    try {
      for await (const ev of chatStream(
        accessToken,
        sessionId,
        trimmed
      ) as AsyncGenerator<StreamEvent>) {
        setFirstByteSeen(true)
        if (ev.type === "session_id") {
          setSessionId(ev.id)
        } else if (ev.type === "text_delta") {
          if (assistantId === null) {
            assistantId = `local-asst-${Date.now()}`
            const id = assistantId
            setMessages((m) => [
              ...m,
              { id, role: "assistant", content: { text: ev.text }, state: "streaming" },
            ])
          } else {
            const id = assistantId
            setMessages((m) =>
              m.map((msg) =>
                msg.id === id
                  ? { ...msg, content: { text: (msg.content.text ?? "") + ev.text } }
                  : msg
              )
            )
          }
        } else if (ev.type === "tool_use") {
          setMessages((m) => [
            ...m,
            {
              id: `tool-${ev.tool_use_id}`,
              role: "tool_use",
              content: { tool_name: ev.name },
              state: "running",
            },
          ])
        } else if (ev.type === "tool_result") {
          setMessages((m) =>
            m.map((msg) =>
              msg.id === `tool-${ev.tool_use_id}`
                ? { ...msg, state: ev.ok ? "done" : "error" }
                : msg
            )
          )
        } else if (ev.type === "error") {
          setMessages((m) => [
            ...m,
            {
              id: `error-${Date.now()}`,
              role: "assistant",
              content: { text: `Feil: ${ev.message}` },
            },
          ])
        }
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: { text: `Tilkoblingsfeil: ${(e as Error).message}` },
        },
      ])
    } finally {
      setIsStreaming(false)
      setFirstByteSeen(false)
      if (assistantId !== null) {
        const id = assistantId
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, state: "done" } : msg)))
      }
      router.refresh()
    }
  }

  const handleNewConversation = () => {
    setMessages([])
    setSessionId(null)
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
    >
      <header
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--brand-border)" }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--brand-ink)",
          }}
        >
          Coach
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            aria-label="Voice modus"
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: "var(--brand-subtle)",
              border: "1px solid var(--brand-border)",
              color: "var(--brand-orange-deep)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            🎤
          </button>
          <button
            type="button"
            onClick={handleNewConversation}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: "var(--brand-surface)",
              border: "1px solid var(--brand-border)",
              color: "var(--brand-ink)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Ny samtale
          </button>
        </div>
      </header>

      <ChatBody messages={messages} isStreamingFirstByte={isStreaming && !firstByteSeen} />

      <div
        className="flex items-end gap-2 p-3"
        style={{
          borderTop: "1px solid var(--brand-border)",
          background: "var(--brand-canvas)",
        }}
      >
        <textarea
          className="flex-1 resize-none"
          placeholder="Skriv en melding..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={isStreaming}
          rows={1}
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 12,
            padding: "11px 13px",
            fontSize: 15,
            color: "var(--brand-ink)",
            outline: "none",
            minHeight: 44,
            maxHeight: 120,
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isStreaming || input.trim().length === 0}
          style={{
            padding: "11px 18px",
            borderRadius: 12,
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: isStreaming || input.trim().length === 0 ? "default" : "pointer",
            opacity: isStreaming || input.trim().length === 0 ? 0.4 : 1,
          }}
        >
          Send
        </button>
      </div>

      <VoiceSheet open={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </div>
  )
}
