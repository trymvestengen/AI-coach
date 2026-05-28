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
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h1 className="text-white text-lg font-semibold">Coach</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVoiceOpen(true)}
            className="px-3 py-1 rounded-full bg-neutral-800 text-white text-sm"
            aria-label="Voice modus"
          >
            🎤
          </button>
          <button
            type="button"
            onClick={handleNewConversation}
            className="px-3 py-1 rounded-full bg-neutral-800 text-white text-sm"
          >
            Ny samtale
          </button>
        </div>
      </header>

      <ChatBody messages={messages} isStreamingFirstByte={isStreaming && !firstByteSeen} />

      <div className="border-t border-neutral-800 p-3 flex items-end gap-2">
        <textarea
          className="flex-1 bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 resize-none min-h-[44px] max-h-[120px]"
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
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isStreaming || input.trim().length === 0}
          className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
        >
          Send
        </button>
      </div>

      <VoiceSheet open={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </div>
  )
}
