"use client"
import { useState, useEffect } from "react"
import { type Program, type ProgramFolder, type ProgramDay, patchProgram } from "@/lib/api"
import ProgramMenuSheet from "./ProgramMenuSheet"
import MoveToFolderSheet from "./MoveToFolderSheet"
import RenameDaySheet from "./RenameDaySheet"
import ManageDaysSheet from "./ManageDaysSheet"
import ExercisePickerSheet from "@/components/program/workout/ExercisePickerSheet"
import EditExerciseSheet from "./EditExerciseSheet"
import ExerciseActionsSheet from "./ExerciseActionsSheet"
import ExerciseSheet from "./ExerciseSheet"
import FinishWorkoutSheet from "./FinishWorkoutSheet"
import {
  addExerciseToDay,
  updateProgramExercise,
  deleteExercise,
  startWorkout,
  logSet,
  unlogSet,
  getInProgressWorkout,
  getLastLoggedSets,
  type InProgressWorkout,
  type LastLoggedSet,
} from "@/lib/api"

interface Props {
  program: Program
  folders: ProgramFolder[]
  todayDayNumber: number
}

export default function ProgramDetail({ program, folders }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [manageDaysOpen, setManageDaysOpen] = useState(false)
  const [renameProgOpen, setRenameProgOpen] = useState(false)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lastLogged, setLastLogged] = useState<Record<string, LastLoggedSet>>({})
  const [startingWorkout, setStartingWorkout] = useState(false)
  const [inProgress, setInProgress] = useState<InProgressWorkout | null>(null)
  const [finishOpen, setFinishOpen] = useState(false)

  // Load last-logged data once per program
  useEffect(() => {
    // TODO(frontend-lint-debt): see docs/follow-ups/frontend-lint-debt.md

    getLastLoggedSets(program.id)
      .then(setLastLogged)
      .catch(() => {
        // silently ignore — fallback to no data
      })
  }, [program.id])

  // Load any in-progress workout on mount
  useEffect(() => {
    getInProgressWorkout()
      .then((w) => setInProgress(w))
      .catch(() => setInProgress(null))
  }, [program.id])

  type ExerciseEditState = {
    id: string
    initial: { sets: number; reps: number; weight_kg: number | null; notes: string }
  }
  const [editExOpen, setEditExOpen] = useState<ExerciseEditState | null>(null)
  const [exActionsOpen, setExActionsOpen] = useState<ExerciseEditState | null>(null)
  const [openExId, setOpenExId] = useState<string | null>(null)

  const days = program.days ?? []
  const activeDay: ProgramDay | undefined = days[activeDayIdx]
  const workoutActive = !!inProgress && !!activeDay && inProgress.program_day_id === activeDay.id

  // Derived: set of logged set keys (`exerciseId-setNumber`) for this day's in-progress workout.
  const loggedKeys = workoutActive
    ? new Set((inProgress?.logged_sets ?? []).map((s) => `${s.exercise_id}-${s.set_number}`))
    : new Set<string>()

  // Convert to Set<program_exercise_set.id> for ExerciseSheet, which addresses sets by their
  // template ID (not exercise_id + set_number).
  const completedSetIds = new Set<string>()
  for (const ex of activeDay?.exercises ?? []) {
    for (const set of ex.sets ?? []) {
      if (loggedKeys.has(`${ex.exercise_id}-${set.set_number}`)) {
        completedSetIds.add(set.id)
      }
    }
  }

  const handleToggleSet = async (
    exerciseId: string,
    set: { id: string; set_number: number; reps: number; weight_kg: number | null }
  ) => {
    if (!inProgress || !activeDay || inProgress.program_day_id !== activeDay.id) {
      alert("Start økt først for å logge sett.")
      return
    }
    const isLogged = loggedKeys.has(`${exerciseId}-${set.set_number}`)
    try {
      if (isLogged) {
        await unlogSet(inProgress.workout_id, exerciseId, set.set_number)
      } else {
        await logSet(inProgress.workout_id, {
          exercise_id: exerciseId,
          set_number: set.set_number,
          reps: set.reps,
          weight_kg: set.weight_kg,
        })
      }
      const updated = await getInProgressWorkout().catch(() => null)
      setInProgress(updated)
    } catch (e) {
      console.error("Failed to toggle set", e)
    }
  }

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

  return (
    <div
      style={{
        padding: 20,
        paddingBottom: 100,
        background: "var(--brand-canvas)",
        minHeight: "100%",
      }}
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
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--brand-ink)",
                flex: 1,
                minWidth: 0,
              }}
            >
              {activeDay.name}
            </div>
            {days.length > 1 && (
              <div style={{ display: "flex", gap: 6 }}>
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
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column" }}>
            {(activeDay.exercises ?? []).map((ex, exIdx) => {
              const initial = {
                sets: ex.sets?.length ?? 3,
                reps: ex.sets?.[0]?.reps ?? 10,
                weight_kg: ex.sets?.[0]?.weight_kg ?? null,
                notes: ex.notes ?? "",
              }
              const lastForEx = lastLogged[ex.exercise_id]
              return (
                <div
                  key={ex.id}
                  style={{
                    paddingTop: exIdx === 0 ? 0 : 12,
                    paddingBottom: 12,
                    borderTop: exIdx === 0 ? "none" : "1px solid var(--brand-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    onClick={() => setOpenExId(ex.id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      minWidth: 0,
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
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-ink)" }}>
                        {ex.name}
                      </div>
                      {(() => {
                        const total = ex.sets?.length ?? 0
                        const done = (ex.sets ?? []).filter((s) => completedSetIds.has(s.id)).length
                        const isComplete = total > 0 && done === total
                        return (
                          <>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--brand-muted)",
                                marginTop: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span>
                                {done > 0 ? `${done}/${total} sett` : `${total} sett`}
                                {lastForEx && (
                                  <>
                                    {" · "}
                                    Sist: {lastForEx.weight_kg ?? "—"} kg × {lastForEx.reps}
                                  </>
                                )}
                              </span>
                              {isComplete && (
                                <span
                                  aria-label="Ferdig"
                                  style={{
                                    display: "inline-grid",
                                    placeItems: "center",
                                    width: 16,
                                    height: 16,
                                    borderRadius: 99,
                                    background: "#16a34a",
                                    color: "white",
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                            {total > 0 && done > 0 && !isComplete && (
                              <div
                                style={{
                                  marginTop: 4,
                                  height: 3,
                                  background: "var(--brand-border)",
                                  borderRadius: 99,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${(done / total) * 100}%`,
                                    height: "100%",
                                    background: "var(--brand-orange)",
                                    transition: "width 200ms ease",
                                  }}
                                />
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Øvelse-handlinger ${ex.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExActionsOpen({ id: ex.id, initial })
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--brand-muted)",
                      fontSize: 16,
                      cursor: "pointer",
                      padding: "0 4px",
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ⋯
                  </button>
                  <button
                    type="button"
                    aria-label="Åpne øvelse"
                    onClick={() => setOpenExId(ex.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--brand-muted)",
                      fontSize: 16,
                      cursor: "pointer",
                      padding: "0 4px",
                      lineHeight: 1,
                      flexShrink: 0,
                    }}
                  >
                    ›
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

      {openExId &&
        activeDay &&
        (() => {
          const ex = (activeDay.exercises ?? []).find((e) => e.id === openExId)
          if (!ex) return null
          return (
            <ExerciseSheet
              open={true}
              programId={program.id}
              dayId={activeDay.id}
              exercise={ex}
              workoutActive={workoutActive}
              completedSetIds={completedSetIds}
              onToggleSetCompleted={(setId) => {
                const set = (ex.sets ?? []).find((s) => s.id === setId)
                if (set) handleToggleSet(ex.exercise_id, set)
              }}
              onClose={() => setOpenExId(null)}
              onChanged={() => window.location.reload()}
            />
          )
        })()}

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

      {inProgress && activeDay && finishOpen && (
        <FinishWorkoutSheet
          open={true}
          workout={inProgress}
          programName={program.name}
          dayName={activeDay.name}
          onClose={() => setFinishOpen(false)}
          onCompleted={() => {
            setFinishOpen(false)
            setInProgress(null)
            window.location.reload()
          }}
        />
      )}

      {activeDay && (activeDay.exercises ?? []).length > 0 && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 56,
            padding: "12px 20px",
            background: "linear-gradient(to top, var(--brand-canvas) 70%, rgba(250,250,247,0))",
            zIndex: 40,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          {workoutActive && inProgress ? (
            <button
              type="button"
              onClick={() => setFinishOpen(true)}
              style={{
                pointerEvents: "auto",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 99,
                padding: "14px 32px",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 0.3,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(22,163,74,0.35)",
                minWidth: 200,
              }}
            >
              ✓ Fullfør økt
            </button>
          ) : (
            <button
              type="button"
              disabled={startingWorkout}
              onClick={async () => {
                if (!activeDay) return
                setStartingWorkout(true)
                try {
                  await startWorkout(activeDay.id)
                  const updated = await getInProgressWorkout()
                  setInProgress(updated)
                } catch {
                  alert("Kunne ikke starte økt. Prøv igjen.")
                } finally {
                  setStartingWorkout(false)
                }
              }}
              style={{
                pointerEvents: "auto",
                background: "var(--brand-orange)",
                color: "white",
                border: "none",
                borderRadius: 99,
                padding: "14px 32px",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 0.3,
                cursor: startingWorkout ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
                opacity: startingWorkout ? 0.6 : 1,
                minWidth: 200,
              }}
            >
              {startingWorkout ? "Starter…" : "▶ Start økt"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
