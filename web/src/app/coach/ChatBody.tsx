"use client"
import { useEffect, useRef } from "react"
import MessageBubble from "@/components/chat/MessageBubble"
import ToolUsePill from "@/components/chat/ToolUsePill"
import ThinkingDots from "@/components/chat/ThinkingDots"

export interface Message {
  id: string
  role: "user" | "assistant" | "tool_use" | "tool_result"
  content: {
    text?: string
    tool_name?: string
    result_link?: { label: string; href: string }
  }
  state?: "streaming" | "running" | "done" | "error"
}

interface Props {
  messages: Message[]
  isStreamingFirstByte: boolean
}

export default function ChatBody({ messages, isStreamingFirstByte }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isStreamingFirstByte])

  return (
    <div className="flex flex-col gap-2 px-4 py-4 overflow-y-auto flex-1">
      {messages.map((m) => {
        if (m.role === "tool_use") {
          return (
            <ToolUsePill
              key={m.id}
              toolName={m.content.tool_name ?? ""}
              state={(m.state as "running" | "done" | "error") ?? "running"}
              resultLink={m.content.result_link}
            />
          )
        }
        if (m.role === "tool_result") return null
        if (m.role === "user" || m.role === "assistant") {
          return (
            <MessageBubble key={m.id} message={{ role: m.role, content: m.content.text ?? "" }} />
          )
        }
        return null
      })}
      {isStreamingFirstByte && <ThinkingDots />}
      <div ref={bottomRef} />
    </div>
  )
}
