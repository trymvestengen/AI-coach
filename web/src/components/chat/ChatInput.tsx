"use client"

import { useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { SendHorizontal } from "lucide-react"

type Props = {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("")

  function submit() {
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue("")
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 border-t border-border bg-background">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Skriv til coachen..."
        disabled={disabled}
        className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
      />
      <Button
        onClick={submit}
        size="icon"
        disabled={disabled || !value.trim()}
        className="rounded-full shrink-0"
      >
        <SendHorizontal size={18} />
      </Button>
    </div>
  )
}
