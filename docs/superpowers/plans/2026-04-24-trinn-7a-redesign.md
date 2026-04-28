# Trinn 7A: Design-redesign — Home + Voice — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Erstatt den eksisterende UI med designet fra Claude Design — mørk bakgrunn, deep-orange accent, flytende blob-orb — startende med Home-skjermen og Voice/Coach-skjermen.

**Architecture:** Beholder Next.js App Router. Legger til design-tokens fra designet i `globals.css` og tvinger dark mode via `dark`-klasse på `<html>`. Nye komponenter bruker inline styles + CSS-variabler (ikke Tailwind-klasser). Eksisterende program/sett-komponenter røres ikke. `/coach`-ruten legges utenfor `(tabs)`-layout for å vise VoiceSession uten TabBar.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS (beholdes for eksisterende komponenter), CSS custom properties, SVG-animasjon med requestAnimationFrame, `/api/chat` for chat-integrasjon.

---

## File Map

**Modified:**
- `web/src/app/globals.css` — legg til design-tokens og keyframe-animasjoner
- `web/src/app/layout.tsx` — tving dark mode, juster outer bg
- `web/src/components/layout/BottomNav.tsx` — port TabBar fra designet
- `web/src/app/(tabs)/home/page.tsx` — render ny HomeScreen

**Created:**
- `web/src/components/ui/icons.tsx` — alle SVG-ikoner fra designet
- `web/src/components/home/HomeScreen.tsx` — ny Home-skjerm med mock-data
- `web/src/components/voice/LiquidOrb.tsx` — animert blob-orb
- `web/src/components/voice/VoiceSession.tsx` — full voice/chat-skjerm
- `web/src/app/coach/page.tsx` — coach-rute (utenfor tabs-layout)

---

### Task 1: Design tokens + dark mode

**Files:**
- Modify: `web/src/app/globals.css`
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Oppdater globals.css**

Legg til dette ETTER de eksisterende `@layer base` reglene (behold alt som er der fra før):

```css
/* ============================================================
   AI Coach Design Tokens
   ============================================================ */

:root {
  --bg-0: #0A0A0B;
  --bg-1: #121214;
  --bg-2: #191A1D;
  --bg-3: #212227;
  --bg-4: #2A2C32;

  --border-1: rgba(255, 255, 255, 0.06);
  --border-2: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.16);

  --fg-0: #F6F6F7;
  --fg-1: #C9CACE;
  --fg-2: #8A8C93;
  --fg-3: #5D5F66;

  --ai-accent: #FF6B35;
  --ai-accent-hot: #FF8355;
  --ai-accent-deep: #E0501F;
  --ai-accent-soft: rgba(255, 107, 53, 0.14);
  --ai-accent-glow: rgba(255, 107, 53, 0.55);

  --success: #4ADE80;
  --warn: #FBBF24;
  --danger: #F87171;

  --r-xs: 8px;
  --r-sm: 12px;
  --r-md: 16px;
  --r-lg: 20px;
  --r-xl: 28px;
  --r-pill: 999px;

  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-in-out: cubic-bezier(0.7, 0, 0.3, 1);
}

/* Override shadcn dark-mode tokens to match our design */
.dark {
  --background: #0A0A0B;
  --card: #191A1D;
  --border: rgba(255, 255, 255, 0.06);
  --foreground: #F6F6F7;
  --muted-foreground: #8A8C93;
  --muted: #212227;
  --primary: #FF6B35;
  --primary-foreground: #1A0A04;
}

/* Keyframes */
@keyframes coachPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--ai-accent-glow); }
  50%       { box-shadow: 0 0 0 8px transparent; }
}
@keyframes dotPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
@keyframes caret {
  0%   { opacity: 1; }
  50%  { opacity: 0; }
  100% { opacity: 1; }
}

/* Utility classes for new components */
.tnum { font-variant-numeric: tabular-nums; }
.screen {
  width: 100%;
  height: 100%;
  background: var(--bg-0);
  color: var(--fg-0);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
```

- [ ] **Step 2: Oppdater layout.tsx — tving dark mode og juster body-bakgrunn**

Erstatt hele filen:

```tsx
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "AI Coach",
  description: "Din personlige AI-trener",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${geist.variable} dark h-full antialiased`}>
      <body className="h-full bg-zinc-950 font-sans flex justify-center">
        <div className="relative w-full max-w-[390px] h-full bg-[#0A0A0B] text-[#F6F6F7] shadow-2xl overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 4: Commit**

```bash
git add web/src/app/globals.css web/src/app/layout.tsx
git commit -m "feat: add design tokens and force dark mode"
```

---

### Task 2: Icons

**Files:**
- Create: `web/src/components/ui/icons.tsx`

- [ ] **Step 1: Opprett icons.tsx**

```tsx
type IconProps = { size?: number; active?: boolean; filled?: boolean; dir?: "right" | "down" | "left" }

export const HomeIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H5.5A1.5 1.5 0 0 1 4 19v-8.5Z"
      stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.18 : 0}/>
  </svg>
)

export const DumbbellIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>
    {active && <path d="M6 12h12" strokeWidth="3"/>}
  </svg>
)

export const CoachOrbIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6"
      fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.25 : 0}/>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.55"/>
  </svg>
)

export const SocialIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="9" r="3.2" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0}/>
    <circle cx="17" cy="11" r="2.6"/>
    <path d="M3 20c0.6-3.2 3-5 6-5s5.4 1.8 6 5"/>
    <path d="M15 19.5c0.5-2.4 2-3.8 4-3.8"/>
  </svg>
)

export const ProfileIcon = ({ size = 22, active = false }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="8.5" r="3.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.2 : 0}/>
    <path d="M4.5 20c1.2-3.6 4.2-5.5 7.5-5.5s6.3 1.9 7.5 5.5" strokeLinecap="round"/>
  </svg>
)

export const MicIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="3" width="6" height="12" rx="3"/>
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
  </svg>
)

export const MicOffIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4l16 16"/>
    <path d="M9 5a3 3 0 0 1 6 0v6M15 13.5a3 3 0 0 1-5.9.5"/>
    <path d="M5 11a7 7 0 0 0 12 4.9M19 11a7 7 0 0 1-.3 2M12 18v3"/>
  </svg>
)

export const KeyboardIcon = ({ size = 22 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="6" width="19" height="12" rx="2.5"/>
    <path d="M6 10h0M10 10h0M14 10h0M18 10h0M6 14h12"/>
  </svg>
)

export const XIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M6 18L18 6"/>
  </svg>
)

export const ArrowUpIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19V5M6 11l6-6 6 6"/>
  </svg>
)

export const FlameIcon = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 2.5c.8 3-1.5 4.5-2.8 6.5-1.3 2-1.5 4 .3 4 1.2 0 1.8-.9 2-2 .8 1 1.5 2.5 1.5 4a5 5 0 1 1-10 0c0-3 2-5 3.5-6.8C9.8 6 10.5 4 10 2c2 .2 3 .5 3.5.5Z"/>
  </svg>
)

export const BoltIcon = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>
  </svg>
)

export const ChevronIcon = ({ size = 16, dir = "right" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: dir === "down" ? "rotate(90deg)" : dir === "left" ? "rotate(180deg)" : "none" }} aria-hidden="true">
    <path d="M9 6l6 6-6 6"/>
  </svg>
)
```

- [ ] **Step 2: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/ui/icons.tsx
git commit -m "feat: add icon system from design"
```

---

### Task 3: BottomNav redesign

**Files:**
- Modify: `web/src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Reskriv BottomNav.tsx**

Erstatt hele filen:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HomeIcon, DumbbellIcon, CoachOrbIcon, SocialIcon, ProfileIcon } from "@/components/ui/icons"

const tabs = [
  { href: "/home",    label: "Home",    Icon: HomeIcon },
  { href: "/program", label: "Workout", Icon: DumbbellIcon },
  { href: "/coach",   label: "Coach",   Icon: CoachOrbIcon },
  { href: "/social",  label: "Social",  Icon: SocialIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <div style={{
      position: "absolute",
      bottom: 0, left: 0, right: 0,
      paddingTop: 8, paddingBottom: 28,
      background: "linear-gradient(to top, #0A0A0B 55%, rgba(10,10,11,0) 100%)",
      display: "flex",
      justifyContent: "space-around",
      zIndex: 10,
    }}>
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href || (href === "/coach" && pathname.startsWith("/coach"))
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "6px 0",
              color: active ? "var(--ai-accent)" : "var(--fg-3)",
              textDecoration: "none",
              border: "none",
              background: "none",
            }}
          >
            <Icon size={24} active={active} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.2 }}>{label}</span>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/layout/BottomNav.tsx
git commit -m "feat: redesign BottomNav with new design system"
```

---

### Task 4: HomeScreen

**Files:**
- Create: `web/src/components/home/HomeScreen.tsx`
- Modify: `web/src/app/(tabs)/home/page.tsx`

- [ ] **Step 1: Opprett HomeScreen.tsx**

```tsx
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
                background: "var(--ai-accent)", color: "#1A0A04",
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
```

- [ ] **Step 2: Oppdater home/page.tsx**

Erstatt hele filen:

```tsx
import HomeScreen from "@/components/home/HomeScreen"

export default function HomePage() {
  return <HomeScreen />
}
```

- [ ] **Step 3: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/home/HomeScreen.tsx web/src/app/(tabs)/home/page.tsx
git commit -m "feat: new Home screen with mock data"
```

---

### Task 5: LiquidOrb + VoiceSession + coach route

**Files:**
- Create: `web/src/components/voice/LiquidOrb.tsx`
- Create: `web/src/components/voice/VoiceSession.tsx`
- Create: `web/src/app/coach/page.tsx`

- [ ] **Step 1: Opprett LiquidOrb.tsx**

```tsx
"use client"

import { useState, useEffect, useRef } from "react"

type OrbState = "idle" | "listening" | "thinking" | "speaking"

interface LiquidOrbProps {
  state?: OrbState
  intensity?: number
}

const CFG: Record<OrbState, { amp: number; speed: number; glow: number }> = {
  idle:      { amp: 4,  speed: 0.4, glow: 0.4 },
  listening: { amp: 14, speed: 1.3, glow: 0.9 },
  thinking:  { amp: 8,  speed: 2.4, glow: 0.7 },
  speaking:  { amp: 18, speed: 1.7, glow: 1.0 },
}

const ACCENT = "#FF6B35"
const CX = 140, CY = 140, BASE_R = 78

export type OrbState = "idle" | "listening" | "thinking" | "speaking"

export default function LiquidOrb({ state = "idle", intensity = 1 }: LiquidOrbProps) {
  const [t, setT] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const start = performance.now()
    const tick = (now: number) => {
      setT((now - start) / 1000)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const cfg = CFG[state]
  const amp = cfg.amp * intensity

  const buildBlob = (seed: number, radiusBias = 0): string => {
    const N = 64
    const pts: [number, number][] = []
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2
      const s1 = Math.sin(a * 3 + t * cfg.speed + seed) * amp
      const s2 = Math.sin(a * 5 - t * cfg.speed * 1.3 + seed * 2) * amp * 0.6
      const s3 = Math.sin(a * 2 + t * cfg.speed * 0.7) * amp * 0.4
      const r = BASE_R + radiusBias + s1 + s2 + s3
      pts.push([CX + Math.cos(a) * r, CY + Math.sin(a) * r])
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
    for (let i = 0; i < N; i++) {
      const p0 = pts[i]
      const p1 = pts[(i + 1) % N]
      const mx = (p0[0] + p1[0]) / 2
      const my = (p0[1] + p1[1]) / 2
      d += ` Q${p0[0].toFixed(1)},${p0[1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`
    }
    return d + " Z"
  }

  const glowAlpha = Math.round(cfg.glow * 55).toString(16).padStart(2, "0")

  return (
    <div style={{ width: 280, height: 280, position: "relative" }}>
      <div style={{
        position: "absolute", inset: -40,
        background: `radial-gradient(circle at 50% 50%, ${ACCENT}${glowAlpha} 0%, transparent 60%)`,
        filter: "blur(12px)",
        pointerEvents: "none",
      }} />
      <svg width="280" height="280" viewBox="0 0 280 280" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="orbFill" cx="38%" cy="34%" r="72%">
            <stop offset="0%" stopColor="#FFC9A8"/>
            <stop offset="18%" stopColor="#FF9762"/>
            <stop offset="55%" stopColor={ACCENT}/>
            <stop offset="100%" stopColor="#9A2E10"/>
          </radialGradient>
          <radialGradient id="orbInner" cx="42%" cy="38%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45"/>
            <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0"/>
          </radialGradient>
          <filter id="orbBlur"><feGaussianBlur stdDeviation="0.5"/></filter>
          <filter id="orbSoft"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <path d={buildBlob(1.7, 14)} fill={ACCENT} fillOpacity={0.12} filter="url(#orbSoft)"/>
        <path d={buildBlob(0.5, 6)} fill="none" stroke={ACCENT} strokeOpacity={0.35} strokeWidth="1"/>
        <path d={buildBlob(0, 0)} fill="url(#orbFill)" filter="url(#orbBlur)"/>
        <path d={buildBlob(2.3, -22)} fill="#FFD9BE" fillOpacity={0.22}/>
        <path d={buildBlob(0, 0)} fill="url(#orbInner)"/>
      </svg>
    </div>
  )
}
```

- [ ] **Step 2: Opprett VoiceSession.tsx**

```tsx
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
              background: "var(--ai-accent)", color: "#1A0A04",
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
                color: draft.trim() && orbState !== "thinking" ? "#1A0A04" : "var(--fg-3)",
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
```

- [ ] **Step 3: Opprett coach/page.tsx**

```tsx
import VoiceSession from "@/components/voice/VoiceSession"

export default function CoachPage() {
  return <VoiceSession />
}
```

- [ ] **Step 4: TypeScript-sjekk**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/web
npx tsc --noEmit
```

Forventet: ingen feil.

- [ ] **Step 5: Commit**

```bash
git add web/src/components/voice/LiquidOrb.tsx web/src/components/voice/VoiceSession.tsx web/src/app/coach/page.tsx
git commit -m "feat: LiquidOrb animation and VoiceSession screen wired to /api/chat"
```
