"use client"

export interface DaySummary {
  id: string
  day_number: number
  name: string
  exercise_count: number
}

interface Props {
  day: DaySummary
  isToday: boolean
  onOpen: (id: string) => void
}

export default function DayCard({ day, isToday, onOpen }: Props) {
  const isRest = day.exercise_count === 0
  const baseStyle: React.CSSProperties = {
    background: isToday
      ? "linear-gradient(180deg, var(--brand-subtle) 0%, var(--brand-surface) 100%)"
      : "var(--brand-surface)",
    border: `${isToday ? "1.5px" : "1px"} solid ${isToday ? "var(--brand-orange)" : "var(--brand-border)"}`,
    borderRadius: 12,
    padding: "12px 14px",
    marginBottom: 8,
    opacity: isRest ? 0.55 : 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    textAlign: "left",
    cursor: isRest ? "default" : "pointer",
  }

  const content = (
    <>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>
          Dag {day.day_number} · {day.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 2 }}>
          {isRest ? "—" : `${day.exercise_count} øvelser`}
        </div>
      </div>
      {isToday && (
        <span
          style={{
            background: "var(--brand-orange)",
            color: "#fff",
            fontSize: 8,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 999,
            letterSpacing: 0.4,
          }}
        >
          I DAG
        </span>
      )}
      {!isToday && !isRest && <span style={{ color: "var(--brand-faint)", fontSize: 14 }}>›</span>}
    </>
  )

  if (isRest) {
    return <div style={baseStyle}>{content}</div>
  }
  return (
    <button type="button" onClick={() => onOpen(day.id)} style={baseStyle}>
      {content}
    </button>
  )
}
