"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { chatStream, type StreamEvent } from "@/lib/coach-stream"
import MessageBubble from "@/components/chat/MessageBubble"
import ThinkingDots from "@/components/chat/ThinkingDots"
import QuickReplies from "@/components/chat/QuickReplies"

interface Msg {
  id: string
  role: "user" | "assistant"
  text: string
  quickReplies?: string[]
}

interface Props {
  accessToken: string
  firstName: string
}

export default function OnboardingClient({ accessToken, firstName }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [firstByteSeen, setFirstByteSeen] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const startedRef = useRef(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isStreaming])

  const send = async (text: string) => {
    if (!text.trim() || isStreaming) return
    setInput("")
    setIsStreaming(true)
    setFirstByteSeen(false)

    const userId = `local-user-${Date.now()}`
    setMessages((m) => [
      ...m,
      ...(text === "__start__" ? [] : [{ id: userId, role: "user" as const, text }]),
    ])

    let assistantId: string | null = null
    let pendingQR: string[] | null = null

    try {
      for await (const ev of chatStream(
        accessToken,
        sessionId,
        text === "__start__" ? `Hei! Jeg er klar.` : text,
        "onboarding"
      ) as AsyncGenerator<StreamEvent>) {
        setFirstByteSeen(true)
        if (ev.type === "session_id") {
          setSessionId(ev.id)
        } else if (ev.type === "text_delta") {
          if (assistantId === null) {
            assistantId = `local-asst-${Date.now()}`
            const id = assistantId
            setMessages((m) => [...m, { id, role: "assistant", text: ev.text }])
          } else {
            const id = assistantId
            setMessages((m) =>
              m.map((msg) => (msg.id === id ? { ...msg, text: msg.text + ev.text } : msg))
            )
          }
        } else if (ev.type === "quick_replies") {
          pendingQR = ev.options
        } else if (ev.type === "tool_result") {
          if (ev.name === "complete_onboarding" && ev.ok) {
            setCompleted(true)
          }
        }
      }
      if (pendingQR && assistantId !== null) {
        const id = assistantId
        const qr = pendingQR
        setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, quickReplies: qr } : msg)))
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: `Tilkoblingsfeil: ${(e as Error).message}`,
        },
      ])
    } finally {
      setIsStreaming(false)
      setFirstByteSeen(false)
    }
  }

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    send("__start__")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (completed && !isStreaming) {
      router.push("/home")
    }
  }, [completed, isStreaming, router])

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-neutral-800">
        <h1 className="text-white text-lg font-semibold">Bli kjent</h1>
        <span className="text-xs" style={{ color: "#888" }}>
          Hei, {firstName}
        </span>
      </header>

      <div className="flex flex-col gap-2 px-4 py-4 overflow-y-auto flex-1">
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col">
            <MessageBubble message={{ role: m.role, content: m.text }} />
            {m.quickReplies && (
              <QuickReplies
                options={m.quickReplies}
                onSelect={(opt) => send(opt)}
                disabled={isStreaming}
              />
            )}
          </div>
        ))}
        {isStreaming && !firstByteSeen && <ThinkingDots />}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-neutral-800 p-3 flex items-end gap-2">
        <textarea
          className="flex-1 bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 resize-none min-h-[44px] max-h-[120px]"
          placeholder="Skriv et svar..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          disabled={isStreaming}
          rows={1}
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={isStreaming || input.trim().length === 0}
          className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
        >
          Send
        </button>
      </div>
    </div>
  )
}
