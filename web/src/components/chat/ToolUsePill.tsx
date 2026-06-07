import Link from "next/link"
import { TOOL_LABELS, shouldShowPill } from "@/lib/tool-labels"

interface Props {
  toolName: string
  state: "running" | "done" | "error"
  resultLink?: { label: string; href: string }
}

export default function ToolUsePill({ toolName, state, resultLink }: Props) {
  if (!shouldShowPill(toolName)) return null
  const label = TOOL_LABELS[toolName]
  const text =
    state === "running"
      ? `${label.emoji} ${label.in_progress}…`
      : state === "done"
        ? `${label.emoji} ${label.done}`
        : `${label.emoji} ${label.in_progress}`
  return (
    <div
      role="status"
      className="self-center text-xs my-2 flex items-center gap-2 w-fit mx-auto px-3 py-1 rounded-full"
      style={{
        background: "var(--brand-subtle)",
        border: "1px solid var(--brand-border)",
        color: "var(--brand-muted)",
      }}
    >
      <span>{text}</span>
      {state === "running" && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "var(--brand-orange)" }}
        />
      )}
      {state === "done" && <span style={{ color: "var(--success)" }}>✓</span>}
      {state === "error" && <span style={{ color: "var(--danger)" }}>✗</span>}
      {state === "done" && resultLink && (
        <Link
          href={resultLink.href}
          className="ml-1 underline"
          style={{ color: "var(--brand-orange)" }}
        >
          {resultLink.label} →
        </Link>
      )}
    </div>
  )
}
