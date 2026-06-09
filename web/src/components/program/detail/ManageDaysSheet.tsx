"use client"
import { useState } from "react"
import { type Program, deleteProgramDay } from "@/lib/api"
import AddDaySheet from "./AddDaySheet"
import RenameDaySheet from "./RenameDaySheet"
import EditScheduleSheet from "./EditScheduleSheet"
import { updateProgramDay } from "@/lib/api"

interface Props {
  open: boolean
  program: Program
  onClose: () => void
}

const DOW_LABELS = ["Søn", "Man", "Tir", "Ons", "Tor", "Fre", "Lør"]

export default function ManageDaysSheet({ open, program, onClose }: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<{ id: string; name: string } | null>(null)

  if (!open) return null

  return (
    <div
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
          maxHeight: "85vh",
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 18px 24px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 99,
            margin: "0 auto 14px",
          }}
        />
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14, textAlign: "center" }}>
          Rediger dager
        </h2>

        <div
          style={{
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            marginBottom: 12,
          }}
        >
          {(program.days ?? []).map((day) => {
            const schedule =
              day.weekdays.length > 0
                ? [...day.weekdays]
                    .sort((a, b) => a - b)
                    .map((d) => DOW_LABELS[d])
                    .join(" · ")
                : day.frequency_per_week
                  ? `${day.frequency_per_week}× per uke`
                  : "Ingen schedule"
            return (
              <div
                key={day.id}
                style={{
                  background: "var(--brand-surface)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-ink)" }}>
                    {day.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>{schedule}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setRenameTarget({ id: day.id, name: day.name })}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brand-orange)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Navn
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleTarget({ id: day.id, name: day.name })}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brand-orange)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Plan
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`Slett "${day.name}"?`)) {
                      await deleteProgramDay(program.id, day.id)
                      window.location.reload()
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Slett
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "12px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          + Legg til dag
        </button>
      </div>

      <AddDaySheet
        open={addOpen}
        programId={program.id}
        onClose={() => setAddOpen(false)}
        onAdded={() => window.location.reload()}
      />

      {renameTarget && (
        <RenameDaySheet
          open={true}
          initialName={renameTarget.name}
          onClose={() => setRenameTarget(null)}
          onSave={async (name) => {
            await updateProgramDay(program.id, renameTarget.id, { name })
            setRenameTarget(null)
            window.location.reload()
          }}
        />
      )}

      {scheduleTarget && (
        <EditScheduleSheet
          open={true}
          programId={program.id}
          dayId={scheduleTarget.id}
          dayName={scheduleTarget.name}
          onClose={() => setScheduleTarget(null)}
          onSaved={() => window.location.reload()}
        />
      )}
    </div>
  )
}
