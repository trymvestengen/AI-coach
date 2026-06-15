"use client"

import { useRouter } from "next/navigation"

const WEEKDAYS = [
  { label: "Mandag", iso: 1 },
  { label: "Tirsdag", iso: 2 },
  { label: "Onsdag", iso: 3 },
  { label: "Torsdag", iso: 4 },
  { label: "Fredag", iso: 5 },
  { label: "Lørdag", iso: 6 },
  { label: "Søndag", iso: 7 },
] as const

interface WeekTemplate {
  id: string
  name: string
  scheduled_days?: number[]
}

interface Props {
  open: boolean
  templates: WeekTemplate[]
  onClose: () => void
}

export default function WeekPlanSheet({ open, templates, onClose }: Props) {
  const router = useRouter()

  if (!open) return null

  const jsDay = new Date().getDay()
  const isoToday = jsDay === 0 ? 7 : jsDay

  const handleTemplate = (id: string) => {
    router.push("/program/template/" + id)
    onClose()
  }

  return (
    <div
      data-testid="week-plan-backdrop"
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 32px",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        className="forge"
      >
        {/* drag handle */}
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 18px",
          }}
        />

        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--brand-ink)",
            margin: "0 0 18px",
          }}
        >
          Denne uka
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {WEEKDAYS.map(({ label, iso }) => {
            const dayTemplates = templates.filter((t) => t.scheduled_days?.includes(iso))
            const isToday = iso === isoToday

            return (
              <div key={iso}>
                <h3
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: isToday ? "var(--brand-orange)" : "var(--brand-muted)",
                    margin: "0 0 5px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {label}
                  {isToday && (
                    <span
                      style={{
                        background: "var(--brand-orange)",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        padding: "1px 6px",
                        borderRadius: 999,
                        textTransform: "uppercase",
                      }}
                    >
                      I dag
                    </span>
                  )}
                </h3>

                {dayTemplates.length === 0 ? (
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--brand-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    Ingen planlagt
                  </span>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {dayTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        aria-label={t.name}
                        onClick={() => handleTemplate(t.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: "var(--brand-surface)",
                          border: "1px solid var(--brand-border)",
                          borderRadius: 10,
                          padding: "10px 14px",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          color: "var(--brand-ink)",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--brand-orange)",
                            flexShrink: 0,
                          }}
                        />
                        {t.name}
                        <span style={{ marginLeft: "auto", color: "var(--brand-muted)" }}>›</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
