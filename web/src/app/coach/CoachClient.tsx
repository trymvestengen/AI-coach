"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import ChatBody, { type Message } from "./ChatBody"
import { chatStream, type StreamEvent } from "@/lib/coach-stream"

export interface PromptContext {
  firstName?: string | null
  goals?: string[] | null
  experienceLevel?: string | null
  trainingDaysPerWeek?: number | null
  recentExercise?: string | null
  activeInjury?: string | null
}

export interface RecentSession {
  id: string
  last_activity_at: string
  preview: string
}

interface Props {
  initialSessionId: string | null
  initialMessages: Message[]
  accessToken: string
  promptContext?: PromptContext
  recentSessions?: RecentSession[]
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const minutes = Math.floor((now - then) / 60_000)
  if (minutes < 60) return `${minutes} min siden`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} t siden`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d siden`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} u siden`
  return new Date(iso).toLocaleDateString("no-NO", { day: "numeric", month: "short" })
}

const GENERIC_PROMPTS = [
  "Hvorfor er restitusjon viktig?",
  "Hva er forskjellen på styrke og hypertrofi?",
  "Hvor mye protein bør jeg spise?",
  "Hvordan unngår jeg platå i treningen?",
  "Bør jeg trene før eller etter jobb?",
  "Hvor lenge bør en økt vare?",
  "Hva er RPE og hvordan bruker jeg det?",
  "Hvordan vet jeg om jeg overtrener?",
]

const GOAL_LABEL: Record<string, string> = {
  build_muscle: "muskelvekst",
  lose_weight: "fettforbrenning",
  get_stronger: "maks styrke",
  improve_endurance: "kondisjon",
  maintain: "vedlikehold",
}

const EXP_LABEL: Record<string, string> = {
  beginner: "nybegynner",
  intermediate: "middels",
  advanced: "erfaren",
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function pickSeeded<T>(arr: T[], n: number, seed: number): T[] {
  // Deterministic shuffle using seed-based offset.
  const out: T[] = []
  const taken = new Set<number>()
  for (let i = 0; i < n && i < arr.length; i++) {
    let idx = (seed + i * 7919) % arr.length
    let attempts = 0
    while (taken.has(idx) && attempts < arr.length) {
      idx = (idx + 1) % arr.length
      attempts++
    }
    taken.add(idx)
    out.push(arr[idx])
  }
  return out
}

function buildSuggestions(ctx: PromptContext, sessionKey: string): string[] {
  // Personalized prompts based on profile + recent activity
  const personalized: string[] = []

  if (ctx.recentExercise) {
    personalized.push(`Hvordan progresjonerer jeg på ${ctx.recentExercise}?`)
  }
  if (ctx.activeInjury) {
    personalized.push(`Hvordan jobber jeg rundt ${ctx.activeInjury}-skaden?`)
  }
  if (ctx.trainingDaysPerWeek && ctx.experienceLevel) {
    personalized.push(
      `Lag et ${EXP_LABEL[ctx.experienceLevel] ?? ctx.experienceLevel} program i ${ctx.trainingDaysPerWeek} dager`
    )
  } else if (ctx.trainingDaysPerWeek) {
    personalized.push(`Lag et ${ctx.trainingDaysPerWeek}-dagers program`)
  }
  if (ctx.goals && ctx.goals.length > 0) {
    const goalLabel = GOAL_LABEL[ctx.goals[0]] ?? "mine mål"
    personalized.push(`Hva bør jeg fokusere på for ${goalLabel}?`)
  }

  // Deterministic seeded mix: stable per session, different per "Ny samtale"
  const seed = hashString(sessionKey)
  const personalizedPick = pickSeeded(personalized, Math.min(2, personalized.length), seed)
  const remaining = 3 - personalizedPick.length
  const genericPick = pickSeeded(GENERIC_PROMPTS, remaining, seed + 1)

  return [...personalizedPick, ...genericPick]
}

export default function CoachClient({
  initialSessionId,
  initialMessages,
  accessToken,
  promptContext = {},
  recentSessions = [],
}: Props) {
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [firstByteSeen, setFirstByteSeen] = useState(false)
  const [promptSeed, setPromptSeed] = useState<string>(() => initialSessionId ?? "fresh")

  const suggestions = useMemo(
    () => buildSuggestions(promptContext, promptSeed),
    [promptContext, promptSeed]
  )

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return
    await runStream(text.trim())
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    setInput("")
    await runStream(trimmed)
  }

  const runStream = async (trimmed: string) => {
    setIsStreaming(true)
    setFirstByteSeen(false)

    // eslint-disable-next-line react-hooks/purity
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
                ? {
                    ...msg,
                    state: ev.ok ? "done" : "error",
                    content: { ...msg.content, result_link: ev.result_link },
                  }
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

  const loadSession = async (id: string) => {
    if (isStreaming) return
    try {
      const res = await fetch(`${API_BASE}/api/chat/sessions/${id}/messages`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`Kunne ikke laste samtalen (${res.status})`)
      const rows = (await res.json()) as Array<{
        id: string
        role: string
        content: { text?: string; tool_name?: string }
      }>
      const loaded = rows
        .filter((r) => r.role === "user" || r.role === "assistant" || r.role === "tool_use")
        .map((r) => ({
          id: r.id,
          role: r.role as Message["role"],
          content: r.content,
          state: r.role === "tool_use" ? ("done" as const) : undefined,
        }))
      setMessages(loaded)
      setSessionId(id)
    } catch (e) {
      console.error(e)
    }
  }

  const handleNewConversation = () => {
    setMessages([])
    setSessionId(null)

    setPromptSeed(`fresh-${Date.now()}`)
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
      </header>

      {messages.length === 0 ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-6" style={{ color: "var(--brand-ink)" }}>
          <div style={{ textAlign: "center", paddingTop: 36, marginBottom: 22 }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>💬</div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: 6,
              }}
            >
              Hva vil du jobbe med i dag
              {promptContext.firstName ? `, ${promptContext.firstName}` : ""}?
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--brand-muted)",
                maxWidth: 280,
                margin: "0 auto",
              }}
            >
              Spør om program, progresjon, restitusjon — eller bare fortell hvordan dagen har vært.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
            }}
          >
            {suggestions.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                style={{
                  background: "var(--brand-surface)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 12,
                  padding: "11px 14px",
                  fontSize: 14,
                  color: "var(--brand-ink)",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {recentSessions.length > 0 && (
            <div style={{ width: "100%", marginTop: 28, paddingBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--brand-muted)",
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: 8,
                  textAlign: "left",
                  padding: "0 4px",
                }}
              >
                Tidligere samtaler
              </div>
              <div
                style={{
                  background: "var(--brand-surface)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {recentSessions.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => loadSession(s.id)}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      borderTop: i === 0 ? "none" : "1px solid var(--brand-border)",
                      padding: "11px 14px",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--brand-ink)",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        width: "100%",
                      }}
                    >
                      {s.preview}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--brand-muted)" }}
                      suppressHydrationWarning
                    >
                      {timeAgo(s.last_activity_at)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <ChatBody messages={messages} isStreamingFirstByte={isStreaming && !firstByteSeen} />
      )}

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
    </div>
  )
}
