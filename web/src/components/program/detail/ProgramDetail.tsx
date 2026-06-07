"use client"
import { useState } from "react"
import { type Program, type ProgramFolder, patchProgram } from "@/lib/api"
import DayCard from "./DayCard"
import ProgramMenuSheet from "./ProgramMenuSheet"
import MoveToFolderSheet from "./MoveToFolderSheet"
import AddDaySheet from "./AddDaySheet"
import RenameDaySheet from "./RenameDaySheet"

interface Props {
  program: Program
  folders: ProgramFolder[]
  todayDayNumber: number
}

export default function ProgramDetail({ program, folders, todayDayNumber }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [addDayOpen, setAddDayOpen] = useState(false)
  const [renameProgOpen, setRenameProgOpen] = useState(false)

  const totalSessionsPerWeek = (program.days ?? []).reduce((sum, d) => {
    if (d.weekdays && d.weekdays.length > 0) return sum + d.weekdays.length
    if (d.frequency_per_week) return sum + d.frequency_per_week
    return sum
  }, 0)
  const baseSubtitle =
    totalSessionsPerWeek > 0
      ? `${program.days?.length ?? 0} dager · ${totalSessionsPerWeek} økter/uke`
      : `${program.days?.length ?? 0} dager`
  const subtitle = `${baseSubtitle}${program.is_active ? " · aktiv" : ""}`

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      {/* Top bar: title (tap to rename), AKTIVER, dots menu */}
      <div
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
      >
        <button
          type="button"
          onClick={() => setRenameProgOpen(true)}
          aria-label="Endre programnavn"
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--brand-ink)",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "inline-block",
              maxWidth: "100%",
            }}
          >
            {program.name} <span style={{ color: "var(--brand-muted)", fontSize: 16 }}>✎</span>
          </span>
        </button>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
          {!program.is_active && (
            <button
              type="button"
              onClick={async () => {
                await patchProgram(program.id, { is_active: true })
                window.location.reload()
              }}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand-orange)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.6,
                cursor: "pointer",
                padding: 0,
              }}
            >
              AKTIVER
            </button>
          )}
          <button
            type="button"
            aria-label="Program-meny"
            onClick={() => setMenuOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-muted)",
              fontSize: 20,
              cursor: "pointer",
              padding: 0,
              lineHeight: 1,
            }}
          >
            ⋯
          </button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--brand-muted)", marginBottom: 22, marginTop: 4 }}>
        {subtitle}
      </div>

      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--brand-muted)",
          fontWeight: 600,
          margin: "8px 4px",
        }}
      >
        Uken
      </div>

      {(program.days ?? []).map((day) => (
        <DayCard
          key={day.id}
          programId={program.id}
          day={{
            id: day.id,
            day_number: day.day_number,
            name: day.name,
            weekdays: day.weekdays ?? [],
            frequency_per_week: day.frequency_per_week ?? null,
            exercise_count: day.exercises?.length ?? 0,
            exercises: day.exercises?.map((ex) => ({
              id: ex.id,
              exercise_id: ex.exercise_id,
              name: ex.name,
              image_url: null,
              notes: ex.notes,
              sets: ex.sets?.length,
              reps: ex.sets?.[0]?.reps,
              weight_kg: ex.sets?.[0]?.weight_kg,
            })),
          }}
          isToday={day.day_number === todayDayNumber && (day.exercises?.length ?? 0) > 0}
          onChanged={() => window.location.reload()}
        />
      ))}

      <button
        type="button"
        onClick={() => setAddDayOpen(true)}
        style={{
          background: "none",
          border: "none",
          color: "var(--brand-orange)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1,
          textTransform: "uppercase",
          textAlign: "center",
          width: "100%",
          padding: "16px 0",
          marginTop: 24,
          borderTop: "1px solid var(--brand-border)",
          cursor: "pointer",
        }}
      >
        + LEGG TIL DAG
      </button>

      <AddDaySheet
        open={addDayOpen}
        programId={program.id}
        onClose={() => setAddDayOpen(false)}
        onAdded={() => window.location.reload()}
      />

      <RenameDaySheet
        open={renameProgOpen}
        initialName={program.name}
        onClose={() => setRenameProgOpen(false)}
        onSave={async (name) => {
          await patchProgram(program.id, { name })
          setRenameProgOpen(false)
          window.location.reload()
        }}
      />

      <ProgramMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        programId={program.id}
        programName={program.name}
        isActive={program.is_active}
        onOpenMoveSheet={() => setMoveOpen(true)}
      />

      <MoveToFolderSheet
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        programId={program.id}
        currentFolderId={program.folder_id ?? null}
        folders={folders}
        onMoved={() => window.location.reload()}
      />
    </div>
  )
}
