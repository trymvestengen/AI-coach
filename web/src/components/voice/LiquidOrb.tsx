"use client"

import { useState, useEffect, useRef } from "react"

export type OrbState = "idle" | "listening" | "thinking" | "speaking"

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
