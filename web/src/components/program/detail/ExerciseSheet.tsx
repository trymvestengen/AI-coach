"use client"
import { useState, useEffect } from "react"
import {
  type ProgramExercise,
  addSet,
  updateSet,
  deleteSet,
  updateProgramExercise,
} from "@/lib/api"
import EditSetSheet from "./EditSetSheet"
import ExerciseDetailModal from "@/components/exercises/ExerciseDetailModal"

interface Props {
  open: boolean
  programId: string
  dayId: string
  exercise: ProgramExercise
  completedSetIds: Set<string>
  onToggleSetCompleted: (setId: string) => void
  onClose: () => void
  onChanged: () => void
}

export default function ExerciseSheet({
  open,
  programId,
  dayId,
  exercise,
  completedSetIds,
  onToggleSetCompleted,
  onClose,
  onChanged,
}: Props) {
  const [notes, setNotes] = useState(exercise.notes ?? "")
  const [savingNotes, setSavingNotes] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [editSet, setEditSet] = useState<{
    setId: string
    initial: { reps: number; weight_kg: number | null; notes: string }
  } | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (open) setNotes(exercise.notes ?? "")
  }, [open, exercise.notes])
  /* eslint-enable */

  if (!open) return null

  const handleSaveNotes = async () => {
    if (notes === (exercise.notes ?? "")) return
    setSavingNotes(true)
    try {
      await updateProgramExercise(programId, dayId, exercise.id, { notes })
      onChanged()
    } catch {
      // ignore — value reverts on next load
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
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
            height: "92vh",
            background: "var(--brand-canvas)",
            borderRadius: "20px 20px 0 0",
            padding: "14px 20px 24px",
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

          {/* Top bar: back + info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <button
              type="button"
              aria-label="Tilbake"
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--brand-orange)",
                fontSize: 22,
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
              }}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Info om øvelsen"
              onClick={() => setShowInfo(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "transparent",
                border: "1px solid var(--brand-border)",
                color: "var(--brand-muted)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                fontStyle: "italic",
                fontFamily: "Georgia, serif",
              }}
            >
              i
            </button>
          </div>

          {/* Exercise title */}
          <h2
            style={{
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 4,
            }}
          >
            {exercise.name}
          </h2>
          <p
            style={{
              fontSize: 12,
              color: "var(--brand-muted)",
              margin: 0,
              marginBottom: 18,
            }}
          >
            Trykk på et sett for å redigere
          </p>

          {/* Scrollable content area */}
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            {/* Set table header */}
            <div
              style={{
                display: "flex",
                gap: 10,
                fontSize: 9,
                fontWeight: 700,
                color: "var(--brand-muted)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: 4,
                padding: "0 4px",
              }}
            >
              <div style={{ width: 28 }} />
              <div style={{ width: 20 }}>#</div>
              <div style={{ flex: 1, textAlign: "center" }}>Kg</div>
              <div style={{ flex: 1, textAlign: "center" }}>Reps</div>
              <div style={{ width: 20 }} />
            </div>

            {(exercise.sets ?? []).map((set) => {
              const isDone = completedSetIds.has(set.id)
              return (
                <div
                  key={set.id}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 4px",
                    opacity: isDone ? 0.6 : 1,
                    transition: "opacity 150ms",
                  }}
                >
                  <button
                    type="button"
                    aria-label={isDone ? "Fjern fullført" : "Marker som fullført"}
                    onClick={() => onToggleSetCompleted(set.id)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      border: isDone ? "none" : "1.5px solid var(--brand-border)",
                      background: isDone ? "#16a34a" : "transparent",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      padding: 0,
                    }}
                  >
                    {isDone ? "✓" : ""}
                  </button>
                  <div
                    style={{
                      width: 20,
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--brand-muted)",
                    }}
                  >
                    {set.set_number}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setEditSet({
                        setId: set.id,
                        initial: {
                          reps: set.reps,
                          weight_kg: set.weight_kg,
                          notes: set.notes ?? "",
                        },
                      })
                    }
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: set.weight_kg != null ? "var(--brand-ink)" : "var(--brand-muted)",
                      background: "var(--brand-surface)",
                      border: "1px solid var(--brand-border)",
                      borderRadius: 99,
                      padding: "6px 0",
                      cursor: "pointer",
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {set.weight_kg != null ? `${set.weight_kg} kg` : "—"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setEditSet({
                        setId: set.id,
                        initial: {
                          reps: set.reps,
                          weight_kg: set.weight_kg,
                          notes: set.notes ?? "",
                        },
                      })
                    }
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--brand-ink)",
                      background: "var(--brand-surface)",
                      border: "1px solid var(--brand-border)",
                      borderRadius: 99,
                      padding: "6px 0",
                      cursor: "pointer",
                      textDecoration: isDone ? "line-through" : "none",
                    }}
                  >
                    {set.reps} reps
                  </button>
                  <div style={{ width: 20, display: "grid", placeItems: "center" }}>
                    {set.notes && (
                      <span title={set.notes} style={{ fontSize: 12 }}>
                        📝
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            <button
              type="button"
              onClick={async () => {
                const lastSet = (exercise.sets ?? [])[(exercise.sets?.length ?? 1) - 1]
                await addSet(programId, dayId, exercise.id, {
                  reps: lastSet?.reps ?? 10,
                  weight_kg: lastSet?.weight_kg ?? null,
                })
                onChanged()
              }}
              style={{
                width: "100%",
                background: "none",
                border: "1px dashed var(--brand-border)",
                color: "var(--brand-orange)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                padding: "10px 0",
                cursor: "pointer",
                borderRadius: 10,
                marginTop: 8,
              }}
            >
              + Legg til sett
            </button>
          </div>

          {/* Notes textarea */}
          <div style={{ borderTop: "1px solid var(--brand-border)", paddingTop: 10 }}>
            <label style={{ display: "block" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--brand-muted)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Notater
              </span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleSaveNotes}
                maxLength={500}
                placeholder="F.eks. fokuser på form, øk vekt neste uke…"
                rows={2}
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: "8px 10px",
                  fontSize: 13,
                  border: "1px solid var(--brand-border)",
                  borderRadius: 8,
                  background: "white",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: 50,
                  fontFamily: "inherit",
                }}
              />
              {savingNotes && (
                <span style={{ fontSize: 10, color: "var(--brand-muted)" }}>Lagrer…</span>
              )}
            </label>
          </div>
        </div>
      </div>

      {editSet && (
        <EditSetSheet
          open={true}
          initial={editSet.initial}
          onClose={() => setEditSet(null)}
          onSave={async (body) => {
            await updateSet(programId, dayId, exercise.id, editSet.setId, body)
            setEditSet(null)
            onChanged()
          }}
          onDelete={async () => {
            await deleteSet(programId, dayId, exercise.id, editSet.setId)
            setEditSet(null)
            onChanged()
          }}
        />
      )}

      <ExerciseDetailModal
        exerciseId={showInfo ? exercise.exercise_id : null}
        onClose={() => setShowInfo(false)}
      />
    </>
  )
}
