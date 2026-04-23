"use client"

import { useState } from "react"
import ChatWindow from "@/components/chat/ChatWindow"
import ChatInput from "@/components/chat/ChatInput"
import { sendMessage, type Message } from "@/lib/api"

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSend(text: string) {
    const userMsg: Message = { role: "user", content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const reply = await sendMessage(next)
      setMessages([...next, { role: "assistant", content: reply }])
    } catch {
      setMessages([...next, { role: "assistant", content: "Noe gikk galt. Prøv igjen." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-3 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">AI Coach</h1>
        {loading && <p className="text-xs text-muted-foreground">Coachen tenker...</p>}
      </header>
      <div className="flex-1 overflow-y-auto">
        <ChatWindow messages={messages} />
      </div>
      <div className="shrink-0">
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  )
}
