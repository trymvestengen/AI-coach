"use client"
import { useState } from "react"
import ExerciseDetailModal from "@/components/exercises/ExerciseDetailModal"
import ExercisePickerSheet from "@/components/program/workout/ExercisePickerSheet"
import DayActionsSheet from "./DayActionsSheet"
import RenameDaySheet from "./RenameDaySheet"
import EditExerciseSheet from "./EditExerciseSheet"
import ExerciseActionsSheet from "./ExerciseActionsSheet"
import EditScheduleSheet from "./EditScheduleSheet"
import {
  addExerciseToDay,
  updateProgramDay,
  deleteProgramDay,
  updateProgramExercise,
  deleteExercise,
} from "@/lib/api"

interface ExerciseRow {
  id: string
  exercise_id: string
  name: string
  image_url?: string | null
  notes?: string | null
  sets?: number
  reps?: number
  weight_kg?: number | null
}

export interface DaySummary {
  id: string
  day_number: number
  name: string
  weekdays: number[]
  frequency_per_week: number | null
  exercise_count: number
  exercises?: ExerciseRow[]
}

interface Props {
  day: DaySummary
  programId: string
  isToday: boolean
  onOpen?: (id: string) => void
  onChanged?: () => void
}

const DOW_LABELS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"]

export default function DayCard({ day, programId, isToday, onOpen, onChanged }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editExOpen, setEditExOpen] = useState<{
    id: string
    initial: { sets: number; reps: number; weight_kg: number | null; notes: string }
  } | null>(null)
  const [exActionsOpen, setExActionsOpen] = useState<{
    id: string
    initial: { sets: number; reps: number; weight_kg: number | null; notes: string }
  } | null>(null)

  const handleToggle = () => {
    setExpanded((x) => !x)
    onOpen?.(day.id)
  }

  const scheduleLabel =
    day.weekdays.length > 0
      ? [...day.weekdays]
          .sort((a, b) => a - b)
          .map((d) => DOW_LABELS[d])
          .join(" · ")
      : day.frequency_per_week
        ? `${day.frequency_per_week}× per uke`
        : null

  return (
    <>
      <div
        style={{
          background: "var(--brand-surface)",
          border: "1px solid var(--brand-border)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
        }}
      >
        {scheduleLabel && (
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "var(--brand-orange)",
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {scheduleLabel}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={handleToggle}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              flex: 1,
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-ink)" }}>
                {day.name}
                {isToday && (
                  <span
                    style={{
                      marginLeft: 8,
                      background: "var(--brand-orange)",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 999,
                    }}
                  >
                    I DAG
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 2 }}>
                {day.exercise_count} øvelser
              </div>
            </div>
            <span style={{ fontSize: 14, color: "var(--brand-muted)" }}>
              {expanded ? "▾" : "▸"}
            </span>
          </button>
          <button
            type="button"
            aria-label="Dag-handlinger"
            onClick={(e) => {
              e.stopPropagation()
              setActionsOpen(true)
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-muted)",
              fontSize: 18,
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ⋯
          </button>
        </div>

        {expanded && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {day.exercises?.map((ex) => (
              <div
                key={ex.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--brand-canvas)",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 8,
                  padding: "8px 10px",
                }}
              >
                <div
                  onClick={() =>
                    setEditExOpen({
                      id: ex.id,
                      initial: {
                        sets: ex.sets ?? 3,
                        reps: ex.reps ?? 10,
                        weight_kg: ex.weight_kg ?? null,
                        notes: ex.notes ?? "",
                      },
                    })
                  }
                  style={{
                    flex: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: "var(--brand-subtle)",
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {ex.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ex.image_url}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).style.display = "none"
                        }}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-ink)" }}>
                      {ex.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>
                      {ex.sets ?? 3} × {ex.reps ?? 10}
                      {ex.weight_kg != null ? ` · ${ex.weight_kg} kg` : ""}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Øvelse-handlinger ${ex.name}`}
                  onClick={() =>
                    setExActionsOpen({
                      id: ex.id,
                      initial: {
                        sets: ex.sets ?? 3,
                        reps: ex.reps ?? 10,
                        weight_kg: ex.weight_kg ?? null,
                        notes: ex.notes ?? "",
                      },
                    })
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--brand-muted)",
                    fontSize: 16,
                    cursor: "pointer",
                    padding: "0 4px",
                  }}
                >
                  ⋯
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand-orange)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
                padding: "8px 0",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              + LEGG TIL ØVELSE
            </button>
          </div>
        )}
      </div>

      <ExerciseDetailModal exerciseId={detailId} onClose={() => setDetailId(null)} />

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (exercise) => {
          await addExerciseToDay(programId, day.id, { exercise_id: exercise.id })
          setPickerOpen(false)
          onChanged?.()
        }}
      />

      <DayActionsSheet
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        onRename={() => setRenameOpen(true)}
        onEditSchedule={() => setScheduleOpen(true)}
        onDelete={async () => {
          if (confirm(`Slett "${day.name}"?`)) {
            await deleteProgramDay(programId, day.id)
            onChanged?.()
          }
        }}
      />

      <RenameDaySheet
        open={renameOpen}
        initialName={day.name}
        onClose={() => setRenameOpen(false)}
        onSave={async (name) => {
          await updateProgramDay(programId, day.id, { name })
          setRenameOpen(false)
          onChanged?.()
        }}
      />

      <EditScheduleSheet
        open={scheduleOpen}
        programId={programId}
        dayId={day.id}
        dayName={day.name}
        onClose={() => setScheduleOpen(false)}
        onSaved={() => onChanged?.()}
      />

      {editExOpen && (
        <EditExerciseSheet
          open={true}
          initial={editExOpen.initial}
          onClose={() => setEditExOpen(null)}
          onSave={async (body) => {
            await updateProgramExercise(programId, day.id, editExOpen.id, body)
            setEditExOpen(null)
            onChanged?.()
          }}
        />
      )}

      {exActionsOpen && (
        <ExerciseActionsSheet
          open={true}
          onClose={() => setExActionsOpen(null)}
          onEdit={() => {
            setEditExOpen(exActionsOpen)
            setExActionsOpen(null)
          }}
          onRemove={async () => {
            await deleteExercise(programId, day.id, exActionsOpen.id)
            setExActionsOpen(null)
            onChanged?.()
          }}
        />
      )}
    </>
  )
}
