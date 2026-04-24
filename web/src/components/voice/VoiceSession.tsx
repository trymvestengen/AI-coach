"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import LiquidOrb, { type OrbState } from "./LiquidOrb"
import { MicIcon, MicOffIcon, KeyboardIcon, XIcon, ArrowUpIcon } from "@/components/ui/icons"
import { sendMessage, type Message, type Persona } from "@/lib/api"

type InputMode = "voice" | "text"

interface TranscriptLine {
  who: "coach" | "user"
  text: string
}

const PERSONA_LABELS: Record<Persona, string> = {
  friend:   "Friend",
  sergeant: "Sergeant",
  analyst:  "Analyst",
}
const PERSONA_DOTS: Record<Persona, string> = {
  friend:   "#FF6B35",
  sergeant: "#F87171",
  analyst:  "#60A5FA",
}
const PERSONA_ORDER: Persona[] = ["friend", "sergeant", "analyst"]

function PersonaChip({ persona, onClick }: { persona: Persona; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "7px 12px 7px 10px",
      background: "rgba(25,26,29,0.7)",
      border: "1px solid var(--border-2)",
      borderRadius: 999,
      color: "var(--fg-0)",
      fontSize: 12, fontWeight: 500,
      cursor: "pointer",
      backdropFilter: "blur(16px)",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: PERSONA_DOTS[persona], flexShrink: 0 }} />
      {PERSONA_LABELS[persona]}
    </button>
  )
}

function Transcript({ lines }: { lines: TranscriptLine[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [lines])

  return (
    <div ref={scrollRef} style={{
      flex: 1, overflowY: "auto", padding: "0 28px",
      maskImage: "linear-gradient(to bottom, transparent 0, black 14%, black 86%, transparent 100%)",
    }}>
      {lines.map((l, i) => {
        const isCoach = l.who === "coach"
        const isCurrent = i === lines.length - 1
        return (
          <div key={i} style={{
            marginBottom: 14,
            opacity: isCurrent ? 1 : 0.42,
            transition: "opacity 400ms var(--ease-out)",
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 0.8,
              textTransform: "uppercase",
              color: isCoach ? "var(--ai-accent)" : "var(--fg-3)",
              marginBottom: 4,
            }}>
              {isCoach ? "Coach" : "Du"}
            </div>
            <div style={{
              fontSize: isCurrent ? 19 : 16,
              lineHeight: 1.35,
              letterSpacing: "-0.012em",
              fontWeight: isCurrent ? 500 : 400,
              color: isCurrent ? "var(--fg-0)" : "var(--fg-1)",
            }}>
              {l.text}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const INITIAL_LINES: TranscriptLine[] = [
  { who: "coach", text: "Hei, Trym! Klar for push-dag? Benken din har klatret fint — la oss ta 82,5 for 5 i dag." },
]

export default function VoiceSession() {
  const router = useRouter()
  const [orbState, setOrbState] = useState<OrbState>("idle")
  const [inputMode, setInputMode] = useState<InputMode>("voice")
  const [muted, setMuted] = useState(false)
  const [persona, setPersona] = useState<Persona>("friend")
  const [draft, setDraft] = useState("")
  const [lines, setLines] = useState<TranscriptLine[]>(INITIAL_LINES)
  const [chatHistory, setChatHistory] = useState<Message[]>([])
  const [elapsed, setElapsed] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (inputMode === "text" && inputRef.current) inputRef.current.focus()
  }, [inputMode])

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

  async function handleSend() {
    const text = draft.trim()
    if (!text) return
    setDraft("")

    const userMsg: Message = { role: "user", content: text }
    const nextHistory = [...chatHistory, userMsg]
    setChatHistory(nextHistory)
    setLines((prev) => [...prev, { who: "user", text }])
    setOrbState("thinking")

    try {
      const reply = await sendMessage(nextHistory, persona)
      const assistantMsg: Message = { role: "assistant", content: reply }
      setChatHistory([...nextHistory, assistantMsg])
      setLines((prev) => [...prev, { who: "coach", text: reply }])
      setOrbState("speaking")
      setTimeout(() => setOrbState("idle"), 2500)
    } catch {
      setLines((prev) => [...prev, { who: "coach", text: "Noe gikk galt. Prøv igjen." }])
      setOrbState("idle")
    }
  }

  const cyclePersona = () => {
    const idx = PERSONA_ORDER.indexOf(persona)
    setPersona(PERSONA_ORDER[(idx + 1) % PERSONA_ORDER.length])
  }

  const statusText =
    inputMode === "text"
      ? orbState === "thinking" ? "Tenker..." : orbState === "speaking" ? "Coach svarer" : "Skriv en melding"
      : { idle: "Trykk for å snakke", listening: "Lytter", thinking: "Tenker...", speaking: "Coach snakker" }[orbState]

  return (
    <div className="screen" style={{
      background: "radial-gradient(ellipse at 50% 38%, #1B1512 0%, #0A0A0B 48%)",
    }}>
      <div style={{ height: 54 }} />

      {/* Top row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px 0",
      }}>
        <button
          onClick={() => router.push("/home")}
          aria-label="Tilbake"
          style={{
            width: 36, height: 36, borderRadius: 999,
            background: "rgba(25,26,29,0.7)", border: "1px solid var(--border-2)",
            color: "var(--fg-0)", display: "grid", placeItems: "center",
            cursor: "pointer",
          }}
        >
          <XIcon size={18} />
        </button>
        <PersonaChip persona={persona} onClick={cyclePersona} />
        <div className="tnum" style={{
          fontSize: 13, color: "var(--fg-2)", fontWeight: 500,
          minWidth: 36, textAlign: "right",
        }}>
          {fmt(elapsed)}
        </div>
      </div>

      {/* Orb */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 28, paddingBottom: 14,
      }}>
        <LiquidOrb state={orbState} />
        <div style={{
          marginTop: 8,
          fontSize: 12, fontWeight: 600, letterSpacing: 1.2,
          textTransform: "uppercase",
          color: orbState === "listening" ? "var(--ai-accent)" : "var(--fg-2)",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, flexShrink: 0,
            background: orbState === "listening" ? "var(--ai-accent)" : "var(--fg-2)",
            animation: orbState === "listening" ? "dotPulse 1.2s ease-in-out infinite" : "none",
          }} />
          {statusText}
        </div>
      </div>

      {/* Transcript */}
      <Transcript lines={lines} />

      {/* Bottom controls */}
      {inputMode === "voice" ? (
        <div style={{
          padding: "16px 24px 40px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
        }}>
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Skru på mikrofon" : "Demp mikrofon"}
            style={{
              width: 56, height: 56, borderRadius: 999,
              background: muted ? "rgba(248,113,113,0.12)" : "rgba(25,26,29,0.7)",
              border: `1px solid ${muted ? "rgba(248,113,113,0.4)" : "var(--border-2)"}`,
              color: muted ? "#F87171" : "var(--fg-0)",
              display: "grid", placeItems: "center", cursor: "pointer",
            }}
          >
            {muted ? <MicOffIcon size={22} /> : <MicIcon size={22} />}
          </button>

          <button
            onClick={() => router.push("/home")}
            style={{
              height: 56, minWidth: 160, borderRadius: 999,
              background: "var(--ai-accent)", color: "var(--primary-foreground)",
              border: "none", cursor: "pointer",
              fontSize: 15, fontWeight: 600,
              padding: "0 26px",
              boxShadow: "0 12px 36px -10px var(--ai-accent-glow)",
            }}
          >
            Avslutt økt
          </button>

          <button
            onClick={() => { setInputMode("text"); setOrbState("idle") }}
            aria-label="Bytt til tekst"
            style={{
              width: 56, height: 56, borderRadius: 999,
              background: "rgba(25,26,29,0.7)",
              border: "1px solid var(--border-2)",
              color: "var(--fg-0)",
              display: "grid", placeItems: "center", cursor: "pointer",
            }}
          >
            <KeyboardIcon size={22} />
          </button>
        </div>
      ) : (
        <div style={{ padding: "14px 16px 40px", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => { setInputMode("voice"); setOrbState("idle") }}
            aria-label="Bytt til tale"
            style={{
              width: 48, height: 48, borderRadius: 999, flexShrink: 0,
              background: "rgba(25,26,29,0.7)",
              border: "1px solid var(--border-2)",
              color: "var(--fg-0)",
              display: "grid", placeItems: "center", cursor: "pointer",
            }}
          >
            <MicIcon size={20} />
          </button>

          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8,
            background: "rgba(25,26,29,0.85)",
            border: "1px solid var(--border-2)",
            borderRadius: 26, padding: "4px 4px 4px 16px",
            minHeight: 48,
          }}>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Skriv til coachen…"
              style={{
                flex: 1, minWidth: 0,
                background: "transparent", border: "none", outline: "none",
                color: "var(--fg-0)", fontFamily: "inherit",
                fontSize: 15, fontWeight: 400,
                padding: "10px 0",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || orbState === "thinking"}
              aria-label="Send"
              style={{
                width: 40, height: 40, borderRadius: 999, flexShrink: 0,
                background: draft.trim() && orbState !== "thinking" ? "var(--ai-accent)" : "var(--bg-3)",
                color: draft.trim() && orbState !== "thinking" ? "var(--primary-foreground)" : "var(--fg-3)",
                border: "none",
                display: "grid", placeItems: "center",
                cursor: draft.trim() && orbState !== "thinking" ? "pointer" : "default",
                transition: "background 160ms var(--ease-out)",
                boxShadow: draft.trim() ? "0 6px 18px -6px var(--ai-accent-glow)" : "none",
              }}
            >
              <ArrowUpIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
