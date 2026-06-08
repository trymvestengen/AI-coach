"use client"
import { useState } from "react"
import { type Program, type ProgramFolder, type ProgramDay, patchProgram } from "@/lib/api"
import ProgramMenuSheet from "./ProgramMenuSheet"
import MoveToFolderSheet from "./MoveToFolderSheet"
import RenameDaySheet from "./RenameDaySheet"
import ManageDaysSheet from "./ManageDaysSheet"
import ExercisePickerSheet from "@/components/program/workout/ExercisePickerSheet"
import EditExerciseSheet from "./EditExerciseSheet"
import ExerciseActionsSheet from "./ExerciseActionsSheet"
import { addExerciseToDay, updateProgramExercise, deleteExercise } from "@/lib/api"

interface Props {
  program: Program
  folders: ProgramFolder[]
  todayDayNumber: number
}

const DOW_LABELS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"]

export default function ProgramDetail({ program, folders }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [manageDaysOpen, setManageDaysOpen] = useState(false)
  const [renameProgOpen, setRenameProgOpen] = useState(false)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)

  type ExerciseEditState = {
    id: string
    initial: { sets: number; reps: number; weight_kg: number | null; notes: string }
  }
  const [editExOpen, setEditExOpen] = useState<ExerciseEditState | null>(null)
  const [exActionsOpen, setExActionsOpen] = useState<ExerciseEditState | null>(null)

  const days = program.days ?? []
  const activeDay: ProgramDay | undefined = days[activeDayIdx]

  // Swipe state
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX
    setTouchStartX(null)
    if (Math.abs(deltaX) < 50) return
    if (deltaX < 0 && activeDayIdx < days.length - 1) {
      setActiveDayIdx(activeDayIdx + 1)
    } else if (deltaX > 0 && activeDayIdx > 0) {
      setActiveDayIdx(activeDayIdx - 1)
    }
  }

  const scheduleLabel = activeDay
    ? activeDay.weekdays.length > 0
      ? [...activeDay.weekdays]
          .sort((a, b) => a - b)
          .map((d) => DOW_LABELS[d])
          .join(" · ")
      : activeDay.frequency_per_week
        ? `${activeDay.frequency_per_week}× per uke`
        : null
    : null

  return (
    <div
      style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
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
            fontSize: 24,
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
        <button
          type="button"
          aria-label="Program-meny"
          onClick={() => setMenuOpen(true)}
          style={{
            background: "none",
            border: "none",
            color: "var(--brand-muted)",
            fontSize: 22,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ⋯
        </button>
      </div>

      {activeDay ? (
        <>
          {/* Day section header */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
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
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--brand-ink)" }}>
                {activeDay.name}
              </div>
            </div>
            {days.length > 1 && (
              <div style={{ display: "flex", gap: 6, paddingBottom: 4 }}>
                {days.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveDayIdx(idx)}
                    aria-label={`Bytt til dag ${idx + 1}`}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        idx === activeDayIdx ? "var(--brand-orange)" : "var(--brand-border)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Exercise rows */}
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
            {(activeDay.exercises ?? []).map((ex) => {
              const sets = ex.sets?.length ?? 3
              const reps = ex.sets?.[0]?.reps ?? 10
              const weight = ex.sets?.[0]?.weight_kg ?? null
              const initial = {
                sets,
                reps,
                weight_kg: weight,
                notes: ex.notes ?? "",
              }
              return (
                <div
                  key={ex.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "var(--brand-surface)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    onClick={() => setEditExOpen({ id: ex.id, initial })}
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
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-ink)" }}>
                        {ex.name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--brand-muted)" }}>
                        {sets} × {reps}
                        {weight != null ? ` · ${weight} kg` : ""}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Øvelse-handlinger ${ex.name}`}
                    onClick={() => setExActionsOpen({ id: ex.id, initial })}
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
              )
            })}
          </div>

          {/* + LEGG TIL ØVELSE */}
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
              padding: "16px 0",
              cursor: "pointer",
              width: "100%",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            + LEGG TIL ØVELSE
          </button>
        </>
      ) : (
        <div
          style={{ marginTop: 60, textAlign: "center", color: "var(--brand-muted)", fontSize: 14 }}
        >
          Ingen dager enda.
          <br />
          Tap <span style={{ fontWeight: 700 }}>⋯ → Rediger dager</span> for å legge til.
        </div>
      )}

      {/* Sheets */}
      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={async (exercise: { id: string }) => {
          if (!activeDay) return
          await addExerciseToDay(program.id, activeDay.id, { exercise_id: exercise.id })
          setPickerOpen(false)
          window.location.reload()
        }}
      />

      {editExOpen && (
        <EditExerciseSheet
          open={true}
          initial={editExOpen.initial}
          onClose={() => setEditExOpen(null)}
          onSave={async (body) => {
            if (!activeDay) return
            await updateProgramExercise(program.id, activeDay.id, editExOpen.id, body)
            setEditExOpen(null)
            window.location.reload()
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
            if (!activeDay) return
            await deleteExercise(program.id, activeDay.id, exActionsOpen.id)
            setExActionsOpen(null)
            window.location.reload()
          }}
        />
      )}

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

      <ManageDaysSheet
        open={manageDaysOpen}
        program={program}
        onClose={() => setManageDaysOpen(false)}
      />

      <ProgramMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        programId={program.id}
        programName={program.name}
        isActive={program.is_active}
        onOpenMoveSheet={() => setMoveOpen(true)}
        onOpenManageDays={() => setManageDaysOpen(true)}
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
