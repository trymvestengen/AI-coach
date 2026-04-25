"use client"

import { useRouter } from "next/navigation"
import { MicIcon, FlameIcon } from "@/components/ui/icons"

interface Friend {
  id: string
  name: string
  initials: string
  hue: number
  workout: string
  duration: string
  pr: boolean
}

interface Suggestion {
  id: string
  name: string
  initials: string
  hue: number
}

const MOCK_FRIENDS: Friend[] = [
  { id: "1", name: "Jonas B.",  initials: "JB", hue: 20,  workout: "Pull A · back squat @ 110 kg", duration: "46 min", pr: false },
  { id: "2", name: "Aida S.",   initials: "AS", hue: 160, workout: "Zone 2 ride, 45 min",           duration: "45 min", pr: false },
  { id: "3", name: "Henrik L.", initials: "HL", hue: 200, workout: "HF PR bench 90 kg",             duration: "52 min", pr: true  },
]

const MOCK_SUGGESTIONS: Suggestion[] = [
  { id: "s1", name: "Sofia T.",  initials: "ST", hue: 280 },
  { id: "s2", name: "Marius T.", initials: "MT", hue: 40  },
]

function Avatar({ name, initials, hue, size = 36 }: { name: string; initials: string; hue: number; size?: number }) {
  return (
    <div
      role="img"
      aria-label={name}
      style={{
        width: size, height: size, borderRadius: 999,
        background: `linear-gradient(135deg, hsl(${hue} 60% 45%), hsl(${(hue + 40) % 360} 55% 28%))`,
        display: "grid", placeItems: "center",
        color: "var(--fg-0)", fontWeight: 600,
        fontSize: Math.round(size * 0.36), letterSpacing: "-0.01em",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

export default function HomeScreen({ firstName }: { firstName: string }) {
  const router = useRouter()

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>

        {/* Header */}
        <div style={{ padding: "8px 20px 4px" }}>
          <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500, letterSpacing: "-0.005em" }}>
            {new Date().toLocaleDateString("no-NO", { weekday: "long", month: "long", day: "numeric" })}
          </div>
          <div className="display-l" style={{ marginTop: 2 }}>Hei, {firstName}.</div>
        </div>

        {/* Coach card */}
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{
            background: "linear-gradient(180deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))",
            border: "1px solid rgba(255,107,53,0.18)",
            borderRadius: 24, padding: 18,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 14, right: 14,
              width: 40, height: 40, borderRadius: 999,
              background: "radial-gradient(circle at 32% 32%, #FFC9A8, var(--ai-accent) 55%, #9A2E10)",
              boxShadow: "0 0 22px rgba(255,107,53,0.45), inset 0 0 6px rgba(255,255,255,0.35)",
            }} />
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              textTransform: "uppercase", color: "var(--ai-accent)", marginBottom: 8,
            }}>
              Coach · Klar
            </div>
            <div className="title-l" style={{ marginBottom: 4, paddingRight: 52 }}>Push A</div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500, marginBottom: 14 }}>
              5 øvelser · ~52 min · Uke 4 av 8
            </div>
            <button
              onClick={() => router.push("/coach")}
              style={{
                width: "100%", height: 52, borderRadius: 16,
                background: "var(--ai-accent)", color: "var(--primary-foreground)",
                border: "none", cursor: "pointer",
                fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 10px 30px -10px var(--ai-accent-glow)",
              }}
            >
              <MicIcon size={18} />
              Start voice session
            </button>
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "var(--warn)" }}><FlameIcon size={13} /></span>
                <span className="caption">Streak</span>
              </div>
              <div className="metric" style={{ marginTop: 8 }}>
                12<span style={{ fontSize: 15, color: "var(--fg-2)", fontWeight: 500, marginLeft: 4 }}>dager</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 500, marginTop: 4 }}>
                4 økt igjen denne uken
              </div>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="caption">Ukentlig volum</div>
              <div className="metric" style={{ marginTop: 8 }}>
                14.2<span style={{ fontSize: 15, color: "var(--fg-2)", fontWeight: 500, marginLeft: 3 }}>t</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600, marginTop: 4 }}>
                ↑ 12% vs forrige
              </div>
            </div>
          </div>
        </div>

        {/* Friends active today */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span className="caption">Venner · Aktive i dag</span>
            <button
              onClick={() => router.push("/social")}
              style={{
                fontSize: 12, color: "var(--ai-accent)", fontWeight: 600,
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              Se alle
            </button>
          </div>
          <div className="card" style={{ overflow: "hidden" }}>
            {MOCK_FRIENDS.map((f, i) => (
              <div key={f.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                borderTop: i === 0 ? "none" : "1px solid var(--border-1)",
              }}>
                <Avatar name={f.name} initials={f.initials} hue={f.hue} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em" }}>{f.name}</div>
                  <div style={{
                    fontSize: 12, color: "var(--fg-2)", marginTop: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {f.workout}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {f.pr && (
                    <div style={{
                      fontSize: 10, color: "var(--ai-accent)", fontWeight: 700,
                      letterSpacing: 0.4, textTransform: "uppercase",
                      padding: "2px 6px", background: "var(--ai-accent-soft)",
                      borderRadius: 999, marginBottom: 3, display: "inline-block",
                    }}>
                      PR
                    </div>
                  )}
                  <div className="tnum" style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>
                    {f.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* People to follow */}
        <div style={{ padding: "18px 20px 0" }}>
          <div className="caption" style={{ marginBottom: 12 }}>Folk du kanskje vil følge</div>
          <div style={{ display: "flex", gap: 16 }}>
            {MOCK_SUGGESTIONS.map((s) => (
              <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <Avatar name={s.name} initials={s.initials} hue={s.hue} size={48} />
                <div style={{ fontSize: 11, color: "var(--fg-1)", fontWeight: 500 }}>{s.name}</div>
                <button style={{
                  fontSize: 11, fontWeight: 600, color: "var(--ai-accent)",
                  background: "var(--ai-accent-soft)", border: "none",
                  borderRadius: 999, padding: "4px 12px", cursor: "pointer",
                }}>
                  Følg
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
