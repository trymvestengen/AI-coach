"use client"

import { useRouter } from "next/navigation"
import { MicIcon, FlameIcon, BoltIcon } from "@/components/ui/icons"

const MOCK_STREAK = [true, true, false, true, true, true, false]
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]
const TODAY_IDX = 5

const MOCK_EXERCISES = [
  { n: "Bench Press",      sets: "4 × 5",  target: "82.5 kg" },
  { n: "Overhead Press",   sets: "3 × 8",  target: "47.5 kg" },
  { n: "Incline DB Press", sets: "3 × 10", target: "22.5 kg" },
  { n: "Cable Fly",        sets: "3 × 12", target: "—" },
  { n: "Tricep Pushdown",  sets: "3 × 12", target: "32 kg" },
]

function Sparkline({ points, width = 58, height = 20, color = "var(--ai-accent)" }: {
  points: number[]
  width?: number
  height?: number
  color?: string
}) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)
  const d = points.map((p, i) => {
    const x = i * step
    const y = height - ((p - min) / range) * height
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  return (
    <svg width={width} height={height} style={{ display: "block" }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function HomeScreen() {
  const router = useRouter()

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
        {/* Header */}
        <div style={{ padding: "8px 20px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500, letterSpacing: "-0.005em" }}>
              {new Date().toLocaleDateString("no-NO", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <div style={{ fontSize: 34, lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 600, marginTop: 2 }}>
              Hei, Trym.
            </div>
          </div>
        </div>

        {/* Coach message card */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{
            background: "linear-gradient(180deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))",
            border: "1px solid rgba(255,107,53,0.18)",
            borderRadius: 24,
            padding: 18,
            position: "relative",
            overflow: "hidden",
          }}>
            {/* Mini orb */}
            <div style={{
              position: "absolute", top: 14, right: 14,
              width: 36, height: 36, borderRadius: 999,
              background: "radial-gradient(circle at 32% 32%, #FFC9A8, var(--ai-accent) 55%, #9A2E10)",
              boxShadow: "0 0 22px rgba(255,107,53,0.45), inset 0 0 6px rgba(255,255,255,0.35)",
            }} />
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              textTransform: "uppercase", color: "var(--ai-accent)", marginBottom: 6,
            }}>
              Coach · Friend
            </div>
            <div style={{
              fontSize: 17, lineHeight: 1.38, letterSpacing: "-0.012em",
              color: "var(--fg-0)", fontWeight: 400, paddingRight: 40,
            }}>
              Push-dag i dag. Benk har klatret fint — la oss ta 82,5 for 5 og se hvordan skulderen føles.
            </div>
            <button
              onClick={() => router.push("/coach")}
              style={{
                marginTop: 16,
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

        {/* Today's workout card */}
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.02, textTransform: "uppercase", color: "var(--fg-2)", padding: "8px 2px 6px" }}>
            Today's workout
          </div>
          <button
            onClick={() => router.push("/program")}
            style={{
              width: "100%", textAlign: "left",
              background: "var(--bg-2)", border: "1px solid var(--border-1)",
              borderRadius: 20, padding: 18, cursor: "pointer", color: "inherit",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 600, marginBottom: 2 }}>Push A</div>
                <div style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>Upper/Lower · Uke 4 av 8</div>
              </div>
              <div style={{
                padding: "6px 10px", borderRadius: 999,
                background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
              }}>
                ~52 min
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {MOCK_EXERCISES.map((e, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 0",
                  borderTop: i === 0 ? "none" : "1px solid var(--border-1)",
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: 999,
                    background: i === 0 ? "var(--ai-accent)" : "var(--fg-3)",
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, fontSize: 14, fontWeight: 500, letterSpacing: "-0.008em" }}>{e.n}</div>
                  <div className="tnum" style={{ fontSize: 13, color: "var(--fg-2)", fontWeight: 500 }}>{e.sets}</div>
                  <div className="tnum" style={{ fontSize: 13, color: "var(--fg-1)", fontWeight: 600, minWidth: 60, textAlign: "right" }}>{e.target}</div>
                </div>
              ))}
            </div>
          </button>
        </div>

        {/* Metric row */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {/* Streak tile */}
            <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 20, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-2)" }}>
                <FlameIcon size={13} />
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.02, textTransform: "uppercase", color: "var(--fg-2)" }}>Streak</div>
              </div>
              <div className="tnum" style={{ fontSize: 28, lineHeight: 1, letterSpacing: "-0.03em", fontWeight: 600, marginTop: 8 }}>
                5<span style={{ fontSize: 15, color: "var(--fg-2)", fontWeight: 500, marginLeft: 4 }}>uker</span>
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 12 }}>
                {MOCK_STREAK.map((on, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{
                      height: 22, borderRadius: 6,
                      background: i === TODAY_IDX
                        ? "var(--ai-accent)"
                        : on ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.04)",
                      border: i === TODAY_IDX ? "none" : "1px solid var(--border-1)",
                    }} />
                    <div style={{ fontSize: 9, color: "var(--fg-3)", marginTop: 4, fontWeight: 600 }}>{DAY_LABELS[i]}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume tile */}
            <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 20, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.02, textTransform: "uppercase", color: "var(--fg-2)" }}>Ukentlig volum</div>
              <div className="tnum" style={{ fontSize: 28, lineHeight: 1, letterSpacing: "-0.03em", fontWeight: 600, marginTop: 8 }}>
                18.4<span style={{ fontSize: 15, color: "var(--fg-2)", fontWeight: 500, marginLeft: 3 }}>t</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
                  ↑ 12% vs forrige
                </div>
                <Sparkline points={[10, 12, 11, 14, 13, 16, 18]} />
              </div>
            </div>
          </div>
        </div>

        {/* Last session */}
        <div style={{ padding: "18px 20px 0" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.02, textTransform: "uppercase", color: "var(--fg-2)", padding: "8px 2px 6px" }}>
            Siste økt
          </div>
          <div style={{ background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 20, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 17, lineHeight: 1.3, letterSpacing: "-0.012em", fontWeight: 600 }}>Pull B</div>
                <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 2 }}>Torsdag · 48 min</div>
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 12, color: "var(--ai-accent)", fontWeight: 600,
                padding: "4px 8px", background: "var(--ai-accent-soft)", borderRadius: 999,
              }}>
                <BoltIcon size={11} /> 2 PRs
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.02, textTransform: "uppercase", color: "var(--fg-2)", marginBottom: 4 }}>Volum</div>
                <div className="tnum" style={{ fontSize: 17, lineHeight: 1, letterSpacing: "-0.015em", fontWeight: 600 }}>6 120 kg</div>
              </div>
              <div style={{ width: 1, height: 32, background: "var(--border-1)" }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.02, textTransform: "uppercase", color: "var(--fg-2)", marginBottom: 4 }}>Sett</div>
                <div className="tnum" style={{ fontSize: 17, lineHeight: 1, letterSpacing: "-0.015em", fontWeight: 600 }}>21</div>
              </div>
              <div style={{ width: 1, height: 32, background: "var(--border-1)" }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.02, textTransform: "uppercase", color: "var(--fg-2)", marginBottom: 4 }}>Avg RPE</div>
                <div className="tnum" style={{ fontSize: 17, lineHeight: 1, letterSpacing: "-0.015em", fontWeight: 600 }}>7.8</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
