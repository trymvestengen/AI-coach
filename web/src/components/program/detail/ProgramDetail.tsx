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
import EditSetSheet from "./EditSetSheet"
import {
  addExerciseToDay,
  updateProgramExercise,
  deleteExercise,
  addSet,
  updateSet,
  deleteSet,
} from "@/lib/api"

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
  const [editSetOpen, setEditSetOpen] = useState<{
    exerciseId: string
    setId: string
    initial: { reps: number; weight_kg: number | null; notes: string }
  } | null>(null)

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
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {(activeDay.exercises ?? []).map((ex) => {
              const initial = {
                sets: ex.sets?.length ?? 3,
                reps: ex.sets?.[0]?.reps ?? 10,
                weight_kg: ex.sets?.[0]?.weight_kg ?? null,
                notes: ex.notes ?? "",
              }
              return (
                <div
                  key={ex.id}
                  style={{
                    background: "var(--brand-surface)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        background: "var(--brand-subtle)",
                        flexShrink: 0,
                      }}
                    />
                    <div
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--brand-ink)",
                      }}
                    >
                      {ex.name}
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

                  {/* Set table header */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--brand-muted)",
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      marginBottom: 6,
                      padding: "0 4px",
                    }}
                  >
                    <div style={{ width: 28 }}>Sett</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Kg</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Reps</div>
                    <div style={{ width: 24 }} />
                  </div>

                  {(ex.sets ?? []).map((set) => (
                    <button
                      key={set.id}
                      type="button"
                      onClick={() =>
                        setEditSetOpen({
                          exerciseId: ex.id,
                          setId: set.id,
                          initial: {
                            reps: set.reps,
                            weight_kg: set.weight_kg,
                            notes: set.notes ?? "",
                          },
                        })
                      }
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "var(--brand-canvas)",
                        border: "1px solid var(--brand-border)",
                        borderRadius: 8,
                        padding: "8px 4px",
                        marginBottom: 4,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          textAlign: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--brand-ink)",
                        }}
                      >
                        {set.set_number}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: 13,
                          color: set.weight_kg != null ? "var(--brand-ink)" : "var(--brand-muted)",
                        }}
                      >
                        {set.weight_kg != null ? set.weight_kg : "—"}
                      </div>
                      <div
                        style={{
                          flex: 1,
                          textAlign: "center",
                          fontSize: 13,
                          color: "var(--brand-ink)",
                        }}
                      >
                        {set.reps}
                      </div>
                      <div style={{ width: 24, display: "grid", placeItems: "center" }}>
                        {set.notes && (
                          <span title={set.notes} style={{ fontSize: 13 }}>
                            📝
                          </span>
                        )}
                      </div>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeDay) return
                      const lastSet = (ex.sets ?? [])[(ex.sets?.length ?? 1) - 1]
                      await addSet(program.id, activeDay.id, ex.id, {
                        reps: lastSet?.reps ?? 10,
                        weight_kg: lastSet?.weight_kg ?? null,
                      })
                      window.location.reload()
                    }}
                    style={{
                      width: "100%",
                      background: "none",
                      border: "none",
                      color: "var(--brand-orange)",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      padding: "10px 0 2px",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    + Legg til sett
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

      {editSetOpen && (
        <EditSetSheet
          open={true}
          initial={editSetOpen.initial}
          onClose={() => setEditSetOpen(null)}
          onSave={async (body) => {
            if (!activeDay) return
            await updateSet(
              program.id,
              activeDay.id,
              editSetOpen.exerciseId,
              editSetOpen.setId,
              body
            )
            setEditSetOpen(null)
            window.location.reload()
          }}
          onDelete={async () => {
            if (!activeDay) return
            await deleteSet(program.id, activeDay.id, editSetOpen.exerciseId, editSetOpen.setId)
            setEditSetOpen(null)
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
