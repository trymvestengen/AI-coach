"use client"

import { useEffect, useRef } from "react"
import MessageBubble, { type Message } from "./MessageBubble"

export default function ChatWindow({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.length === 0 && (
        <p className="text-center text-muted-foreground text-sm mt-16">
          Si hei til coachen din
        </p>
      )}
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
