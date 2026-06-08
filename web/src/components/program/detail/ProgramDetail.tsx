"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { type Program, type ProgramFolder, type ProgramDay, patchProgram } from "@/lib/api"
import ProgramMenuSheet from "./ProgramMenuSheet"
import MoveToFolderSheet from "./MoveToFolderSheet"
import RenameDaySheet from "./RenameDaySheet"
import ManageDaysSheet from "./ManageDaysSheet"
import ExercisePickerSheet from "@/components/program/workout/ExercisePickerSheet"
import EditExerciseSheet from "./EditExerciseSheet"
import ExerciseActionsSheet from "./ExerciseActionsSheet"
import ExerciseSheet from "./ExerciseSheet"
import {
  addExerciseToDay,
  updateProgramExercise,
  deleteExercise,
  startWorkout,
  getInProgressWorkout,
  getLastLoggedSets,
  type LastLoggedSet,
} from "@/lib/api"

interface Props {
  program: Program
  folders: ProgramFolder[]
  todayDayNumber: number
}

export default function ProgramDetail({ program, folders }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [manageDaysOpen, setManageDaysOpen] = useState(false)
  const [renameProgOpen, setRenameProgOpen] = useState(false)
  const [activeDayIdx, setActiveDayIdx] = useState(0)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [lastLogged, setLastLogged] = useState<Record<string, LastLoggedSet>>({})
  const [startingWorkout, setStartingWorkout] = useState(false)

  // Load last-logged data once per program
  useEffect(() => {
    // TODO(frontend-lint-debt): see docs/follow-ups/frontend-lint-debt.md

    getLastLoggedSets(program.id)
      .then(setLastLogged)
      .catch(() => {
        // silently ignore — fallback to no data
      })
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
                      <div style={{ fontSize: 11, color: "var(--brand-muted)", marginTop: 1 }}>
                        {ex.sets?.length ?? 0} sett
                        {lastForEx && (
                          <>
                            {" · "}
                            Sist: {lastForEx.weight_kg ?? "—"} kg × {lastForEx.reps}
                          </>
                        )}
                      </div>
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
          <button
            type="button"
            disabled={startingWorkout}
            onClick={async () => {
              if (!activeDay) return
              setStartingWorkout(true)
              try {
                const inProgress = await getInProgressWorkout().catch(() => null)
                if (inProgress) {
                  router.push(`/program/workout/${inProgress.workout_id}`)
                  return
                }
                const { workout_id } = await startWorkout(activeDay.id)
                router.push(`/program/workout/${workout_id}`)
              } catch {
                setStartingWorkout(false)
                alert("Kunne ikke starte økt. Prøv igjen.")
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
        </div>
      )}
    </div>
  )
}
