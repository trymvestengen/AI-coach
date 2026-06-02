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

interface Props {
  initialSessionId: string | null
  initialMessages: Message[]
  accessToken: string
  promptContext?: PromptContext
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

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
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

  // Seed-based shuffle so we get a stable set per session but rotate on new conversation.
  // Sort by hash to mix order deterministically.
  const seedHash = sessionKey.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  const allMixed = [
    ...personalized.sort((a, b) => ((a.length + seedHash) % 7) - ((b.length + seedHash) % 7)),
    ...pickRandom(GENERIC_PROMPTS, 3),
  ]

  return allMixed.slice(0, 3)
}

export default function CoachClient({
  initialSessionId,
  initialMessages,
  accessToken,
  promptContext = {},
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
        <div
          className="flex-1 flex flex-col items-center justify-center px-6 text-center"
          style={{ color: "var(--brand-ink)" }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
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
              marginBottom: 24,
              maxWidth: 280,
            }}
          >
            Spør om program, progresjon, restitusjon — eller bare fortell hvordan dagen har vært.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: "100%",
              maxWidth: 320,
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
