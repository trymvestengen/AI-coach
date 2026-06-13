"use client"

export type BannerState =
  | { kind: "in-progress"; workoutId: string; dayName: string; setsLogged: number }
  | { kind: "today-ready"; dayId: string; dayName: string; exerciseCount: number }
  | { kind: "rest-day"; nextDayName: string | null }
  | { kind: "no-active"; programCount: number }
  | { kind: "empty" }

interface Props {
  state: BannerState
  onStart?: () => void
  onContinue?: () => void
  onSeeProgram?: () => void
}

function activeBg(): string {
  return "linear-gradient(135deg, var(--brand-orange) 0%, var(--brand-orange-deep) 100%)"
}

function restBg(): string {
  return "linear-gradient(135deg, var(--brand-subtle) 0%, var(--brand-orange-soft) 100%)"
}

export default function TodaysWorkoutBanner({ state, onStart, onContinue, onSeeProgram }: Props) {
  const baseStyle: React.CSSProperties = {
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 18,
  }

  if (state.kind === "in-progress") {
    return (
      <div style={{ ...baseStyle, background: activeBg(), color: "#fff" }}>
        <div style={labelStyle}>
          <span style={pulseStyle} aria-hidden /> Pågående
        </div>
        <div style={titleStyle}>{state.dayName}</div>
        <div style={metaStyle(true)}>{state.setsLogged} sett logget</div>
        <button type="button" onClick={onContinue} style={ctaStyle("white")}>
          Fortsett →
        </button>
      </div>
    )
  }

  if (state.kind === "today-ready") {
    return (
      <div style={{ ...baseStyle, background: activeBg(), color: "#fff" }}>
        <div style={labelStyle}>Dagens økt</div>
        <div style={titleStyle}>{state.dayName}</div>
        <div style={metaStyle(true)}>{state.exerciseCount} øvelser</div>
        <button type="button" onClick={onStart} style={ctaStyle("white")}>
          Start →
        </button>
      </div>
    )
  }

  if (state.kind === "rest-day") {
    return (
      <div
        style={{
          ...baseStyle,
          background: restBg(),
          color: "var(--brand-ink)",
          border: "1px solid var(--brand-orange-soft)",
        }}
      >
        <div style={{ ...labelStyle, color: "var(--brand-muted)" }}>I dag</div>
        <div style={titleStyle}>Hviledag 💤</div>
        <div style={metaStyle(false)}>
          {state.nextDayName
            ? `Neste økt: i morgen · ${state.nextDayName}`
            : "Neste økt: senere denne uken"}
        </div>
        <button type="button" onClick={onSeeProgram} style={ctaStyle("muted")}>
          Se programmet →
        </button>
      </div>
    )
  }

  // no-active and empty: muted placeholder (the CTA lives in GetStartedSection)
  return (
    <div
      style={{
        ...baseStyle,
        background: "var(--brand-surface)",
        border: "1px solid var(--brand-border)",
        color: "var(--brand-ink)",
      }}
    >
      <div style={{ ...labelStyle, color: "var(--brand-muted)" }}>Dagens økt</div>
      <div style={{ ...titleStyle, color: "var(--brand-muted)", fontSize: 15 }}>
        Ingen aktiv plan
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: 1,
  textTransform: "uppercase",
  fontWeight: 600,
  opacity: 0.9,
}

const titleStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  margin: "4px 0 2px",
  letterSpacing: "-0.02em",
}

function metaStyle(onOrange: boolean): React.CSSProperties {
  return {
    fontSize: 12,
    opacity: onOrange ? 0.9 : 1,
    color: onOrange ? "inherit" : "var(--brand-muted)",
    marginBottom: 10,
  }
}

function ctaStyle(variant: "white" | "muted" | "orange"): React.CSSProperties {
  if (variant === "white") {
    return {
      background: "#fff",
      color: "var(--brand-orange-deep)",
      border: "none",
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
    }
  }
  if (variant === "orange") {
    return {
      background: "var(--brand-orange)",
      color: "#fff",
      border: "none",
      borderRadius: 999,
      padding: "8px 14px",
      fontSize: 12,
      fontWeight: 700,
      cursor: "pointer",
    }
  }
  return {
    background: "rgba(255,255,255,0.85)",
    color: "var(--brand-orange-deep)",
    border: "none",
    borderRadius: 999,
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  }
}

const pulseStyle: React.CSSProperties = {
  display: "inline-block",
  width: 6,
  height: 6,
  borderRadius: 999,
  background: "#fff",
  marginRight: 6,
  verticalAlign: "middle",
}
