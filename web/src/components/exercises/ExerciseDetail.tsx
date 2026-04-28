"use client"

import { useState, useId } from "react"
import { useRouter } from "next/navigation"
import { ChevronIcon, PlayIcon, MoreIcon, PlusIcon } from "@/components/ui/icons"
import type { Exercise, MuscleKey } from "@/lib/exercises"

/* ── MuscleBody ── */
function MuscleBody({ highlight, width = 100, view }: { highlight: MuscleKey[]; width?: number; view: "front" | "back" }) {
  const on = (k: MuscleKey) => highlight.includes(k)
  const accent = "var(--ai-accent)"
  const body = "rgba(255,255,255,0.12)"
  const out = "rgba(255,255,255,0.25)"

  return (
    <svg width={width} height={width * 1.5} viewBox="0 0 100 150" fill="none" aria-hidden="true">
      <circle cx="50" cy="12" r="7.5" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M36 22 Q50 24 64 22 L68 36 Q70 48 68 62 Q65 74 62 82 L38 82 Q35 74 32 62 Q30 48 32 36 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M36 24 L28 30 Q24 38 26 52 L31 54 Q34 42 37 36 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M64 24 L72 30 Q76 38 74 52 L69 54 Q66 42 63 36 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M26 52 L22 76 L28 78 L32 54 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M74 52 L78 76 L72 78 L68 54 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M38 82 L34 114 L40 114 L46 84 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M62 82 L66 114 L60 114 L54 84 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M34 114 L32 142 L40 142 L40 114 Z" fill={body} stroke={out} strokeWidth="0.7"/>
      <path d="M66 114 L68 142 L60 142 L60 114 Z" fill={body} stroke={out} strokeWidth="0.7"/>

      {view === "front" && (
        <>
          {on("chest") && <path d="M38 30 Q50 34 62 30 L62 44 Q50 47 38 44 Z" fill={accent} opacity="0.72"/>}
          {on("shoulders") && <>
            <ellipse cx="34" cy="28" rx="6" ry="4.5" fill={accent} opacity="0.72"/>
            <ellipse cx="66" cy="28" rx="6" ry="4.5" fill={accent} opacity="0.72"/>
          </>}
          {on("abs") && <path d="M42 48 L58 48 L56 78 L44 78 Z" fill={accent} opacity="0.58"/>}
          {on("biceps") && <>
            <path d="M27 38 Q25 46 27 50 L31 50 Q33 44 33 38 Z" fill={accent} opacity="0.72"/>
            <path d="M73 38 Q75 46 73 50 L69 50 Q67 44 67 38 Z" fill={accent} opacity="0.72"/>
          </>}
          {on("forearms") && <>
            <path d="M24 58 L22 76 L28 78 L30 58 Z" fill={accent} opacity="0.6"/>
            <path d="M76 58 L78 76 L72 78 L70 58 Z" fill={accent} opacity="0.6"/>
          </>}
          {on("quads") && <>
            <path d="M38 86 L36 108 L42 108 L44 86 Z" fill={accent} opacity="0.72"/>
            <path d="M62 86 L64 108 L58 108 L56 86 Z" fill={accent} opacity="0.72"/>
          </>}
        </>
      )}
      {view === "back" && (
        <>
          {on("upperBack") && <path d="M36 26 Q50 30 64 26 L66 42 Q50 44 34 42 Z" fill={accent} opacity="0.72"/>}
          {on("lats") && <path d="M34 42 Q50 48 66 42 L64 60 Q50 63 36 60 Z" fill={accent} opacity="0.7"/>}
          {on("lowerBack") && <path d="M40 62 L60 62 L58 78 L42 78 Z" fill={accent} opacity="0.6"/>}
          {on("glutes") && <path d="M38 82 L62 82 L62 94 Q50 97 38 94 Z" fill={accent} opacity="0.72"/>}
          {on("hamstrings") && <>
            <path d="M38 94 L36 112 L42 112 L44 94 Z" fill={accent} opacity="0.7"/>
            <path d="M62 94 L64 112 L58 112 L56 94 Z" fill={accent} opacity="0.7"/>
          </>}
          {on("calves") && <>
            <path d="M34 116 L32 138 L40 138 L40 116 Z" fill={accent} opacity="0.72"/>
            <path d="M66 116 L68 138 L60 138 L60 116 Z" fill={accent} opacity="0.72"/>
          </>}
          {on("triceps") && <>
            <path d="M25 36 Q23 46 25 52 L29 52 Q31 44 31 36 Z" fill={accent} opacity="0.72"/>
            <path d="M75 36 Q77 46 75 52 L71 52 Q69 44 69 36 Z" fill={accent} opacity="0.72"/>
          </>}
          {on("shoulders") && <>
            <ellipse cx="34" cy="28" rx="6" ry="4.5" fill={accent} opacity="0.72"/>
            <ellipse cx="66" cy="28" rx="6" ry="4.5" fill={accent} opacity="0.72"/>
          </>}
        </>
      )}
    </svg>
  )
}

/* ── ExerciseIllustration ── */
function ExerciseIllustration({ highlight, image }: { highlight: MuscleKey[]; view: "front" | "back"; image?: string }) {
  return (
    <div style={{
      position: "relative",
      background: "radial-gradient(ellipse at 50% 40%, #1A1816 0%, #0A0A0B 70%)",
      borderRadius: 20, overflow: "hidden",
      border: "1px solid var(--border-1)",
      minHeight: 220,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        position: "absolute", inset: -20, top: "auto", height: 120,
        background: "radial-gradient(ellipse at 50% 100%, rgba(255,107,53,0.18), transparent 70%)",
        pointerEvents: "none",
      }} />
      {image ? (
        <img
          src={image}
          alt=""
          style={{
            width: "100%", maxHeight: 280, objectFit: "contain",
            padding: "16px", boxSizing: "border-box",
          }}
        />
      ) : (
        <div style={{ display: "flex", gap: 24, padding: "18px 16px" }}>
          <MuscleBody width={100} view="front" highlight={highlight} />
          <MuscleBody width={100} view="back" highlight={highlight} />
        </div>
      )}
    </div>
  )
}

/* ── Tab button ── */
function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "10px 0", background: "none", border: "none",
      color: active ? "var(--fg-0)" : "var(--fg-2)",
      fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em",
      position: "relative", cursor: "pointer",
    }}>
      {label}
      {active && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 2, background: "var(--ai-accent)", borderRadius: 2,
        }} />
      )}
    </button>
  )
}

/* ── MOCK progression data ── */
const PROG_PTS = [60, 62, 58, 65, 64, 68, 70, 72, 74, 76, 78, 80, 82.5]
const HISTORY = [
  { d: "Apr 23, 2026", s: "4 sett", best: "82.5 × 5", pr: true  },
  { d: "Apr 16, 2026", s: "4 sett", best: "80 × 5",   pr: false },
  { d: "Apr 9, 2026",  s: "3 sett", best: "80 × 4",   pr: false },
  { d: "Apr 2, 2026",  s: "4 sett", best: "77.5 × 5", pr: false },
  { d: "Mar 26, 2026", s: "4 sett", best: "75 × 5",   pr: false },
]

/* ── ExerciseDetail ── */
export default function ExerciseDetail({ exercise }: { exercise: Exercise }) {
  const router = useRouter()
  const [tab, setTab] = useState<"summary" | "history" | "howto">("summary")
  const chartId = useId()

  return (
    <div className="screen">
      <div style={{ height: 54 }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 8px 8px" }}>
        <button onClick={() => router.back()} style={{
          width: 40, height: 40, borderRadius: 999,
          background: "transparent", border: "none", color: "var(--fg-0)",
          display: "grid", placeItems: "center", cursor: "pointer",
        }}>
          <ChevronIcon dir="left" size={20} />
        </button>
        <div className="title-m">{exercise.name}</div>
        <button aria-label="More options" style={{
          width: 40, height: 40, borderRadius: 999,
          background: "transparent", border: "none", color: "var(--fg-0)",
          display: "grid", placeItems: "center", cursor: "pointer",
        }}>
          <MoreIcon size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border-1)", padding: "0 20px" }}>
        <TabButton label="Summary"  active={tab === "summary"}  onClick={() => setTab("summary")} />
        <TabButton label="History"  active={tab === "history"}  onClick={() => setTab("history")} />
        <TabButton label="How to"   active={tab === "howto"}    onClick={() => setTab("howto")} />
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 160px" }}>
        <ExerciseIllustration highlight={exercise.highlight} view={exercise.view} image={exercise.image || undefined} />

        {/* Name + tags */}
        <div style={{ marginTop: 14 }}>
          <div className="title-l">{exercise.name}</div>
          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 6,
              background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
            }}>
              Primary · {exercise.primary}
            </div>
            {exercise.secondary.map(s => (
              <div key={s} style={{
                fontSize: 11, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase",
                padding: "3px 8px", borderRadius: 6,
                background: "rgba(255,255,255,0.06)", color: "var(--fg-2)",
              }}>{s}</div>
            ))}
          </div>
        </div>

        {tab === "summary" && (
          <>
            {/* Coach tip */}
            <div style={{
              marginTop: 14, padding: "12px 14px",
              background: "linear-gradient(180deg, rgba(255,107,53,0.08), rgba(255,107,53,0.02))",
              border: "1px solid rgba(255,107,53,0.2)", borderRadius: 14,
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999, flexShrink: 0,
                background: "radial-gradient(circle at 32% 32%, #FFC9A8, var(--ai-accent) 55%, #9A2E10)",
                boxShadow: "0 0 14px rgba(255,107,53,0.4)", marginTop: 1,
              }} />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--ai-accent)", marginBottom: 2 }}>
                  Coach tip
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4, color: "var(--fg-0)" }}>
                  Basert på dine siste tre sesjoner — prøv 2.5 kg over forrige gang. Bar-hastigheten har vært sterk.
                </div>
              </div>
            </div>

            {/* PR + last used */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <div className="card" style={{ padding: 12 }}>
                <div className="caption">Personal record</div>
                <div className="metric" style={{ marginTop: 8, fontSize: 22 }}>{exercise.pr}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>12 Apr 2026</div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="caption">Sist brukt</div>
                <div className="metric" style={{ marginTop: 8, fontSize: 22 }}>{exercise.lastUsed}</div>
                <div style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 4 }}>{exercise.lastWeight}</div>
              </div>
            </div>

            {/* Progression chart */}
            <div className="card" style={{ padding: 14, marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div className="caption">Tyngste vekt</div>
                  <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", marginTop: 4 }} className="tnum">
                    82.5 kg <span style={{ fontSize: 12, color: "var(--fg-2)", fontWeight: 500 }}>· Apr 23</span>
                  </div>
                </div>
                <div style={{
                  fontSize: 12, color: "var(--ai-accent)", fontWeight: 600,
                  padding: "5px 10px", borderRadius: 999, background: "var(--ai-accent-soft)",
                }}>År ▾</div>
              </div>
              <svg width="100%" height="90" viewBox="0 0 320 90" preserveAspectRatio="none" style={{ display: "block" }} aria-hidden="true">
                <defs>
                  <linearGradient id={`chartFill-${chartId}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--ai-accent)" stopOpacity="0.35"/>
                    <stop offset="100%" stopColor="var(--ai-accent)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[0,1,2,3].map(i => (
                  <line key={i} x1="0" x2="320" y1={i * 22 + 6} y2={i * 22 + 6} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                ))}
                {(() => {
                  const pts = PROG_PTS
                  const min = 55, max = 85
                  const xs = pts.map((_, i) => (i / (pts.length - 1)) * 320)
                  const ys = pts.map(p => 82 - ((p - min) / (max - min)) * 72)
                  const line = pts.map((_, i) => `${i === 0 ? "M" : "L"}${xs[i].toFixed(1)},${ys[i].toFixed(1)}`).join(" ")
                  const area = `${line} L320,90 L0,90 Z`
                  return (
                    <>
                      <path d={area} fill={`url(#chartFill-${chartId})`}/>
                      <path d={line} stroke="var(--ai-accent)" strokeWidth="2" fill="none" strokeLinejoin="round" strokeLinecap="round"/>
                      {xs.map((x, i) => i === xs.length - 1 && (
                        <circle key={i} cx={x} cy={ys[i]} r="3.5" fill="var(--ai-accent)" stroke="var(--bg-0)" strokeWidth="2"/>
                      ))}
                    </>
                  )
                })()}
                <text x="2" y="88" fontSize="9" fill="var(--fg-3)">Apr &apos;25</text>
                <text x="155" y="88" fontSize="9" fill="var(--fg-3)" textAnchor="middle">Okt &apos;25</text>
                <text x="316" y="88" fontSize="9" fill="var(--fg-3)" textAnchor="end">Apr &apos;26</text>
              </svg>
              <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto" }}>
                {["Tyngste", "1RM est.", "Best volum", "Sesjonsvolum"].map((l, i) => (
                  <div key={l} style={{
                    fontSize: 11, fontWeight: 600, padding: "6px 10px", borderRadius: 999,
                    background: i === 0 ? "var(--ai-accent)" : "var(--bg-3)",
                    color: i === 0 ? "var(--primary-foreground)" : "var(--fg-1)",
                    border: i === 0 ? "none" : "1px solid var(--border-1)",
                    whiteSpace: "nowrap", flexShrink: 0,
                  }}>{l}</div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: 18 }}>
              <div className="caption" style={{ marginBottom: 6 }}>Om øvelsen</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--fg-1)" }}>{exercise.description}</div>
            </div>
          </>
        )}

        {tab === "history" && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {HISTORY.map(h => (
              <div key={h.d} className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.008em" }}>{h.d}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{h.s} · top sett {h.best}</div>
                </div>
                {h.pr && (
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
                    padding: "3px 7px", borderRadius: 6,
                    background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                  }}>PR</div>
                )}
                <ChevronIcon size={14} dir="right" />
              </div>
            ))}
          </div>
        )}

        {tab === "howto" && (
          <div style={{ marginTop: 14 }}>
            <div className="caption" style={{ marginBottom: 6 }}>Nøkkelpunkter</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {exercise.tips.map((t, i) => (
                <div key={t} style={{
                  display: "flex", gap: 12, padding: 12,
                  background: "var(--bg-2)", border: "1px solid var(--border-1)", borderRadius: 12,
                }}>
                  <div className="tnum" style={{
                    width: 22, height: 22, borderRadius: 999,
                    background: "var(--ai-accent-soft)", color: "var(--ai-accent)",
                    display: "grid", placeItems: "center",
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--fg-1)" }}>{t}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "14px 20px 28px",
        background: "linear-gradient(to top, #0A0A0B 60%, rgba(10,10,11,0))",
      }}>
        <button style={{
          width: "100%", height: 52, borderRadius: 16,
          background: "var(--ai-accent)", color: "var(--primary-foreground)",
          border: "none", cursor: "pointer",
          fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <PlusIcon size={18} />
          Logg øvelse
        </button>
      </div>
    </div>
  )
}
