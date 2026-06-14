"use client"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  type WorkoutDetail,
  type TemplateDetail,
  type TemplateFolder,
  type PreviousSets,
} from "@/lib/api"

/* ── Types ────────────────────────────────────────────────── */

export interface Props {
  mode: "planning" | "active"
  template?: TemplateDetail
  workout?: WorkoutDetail
  exerciseNames: Record<string, string>
  folders: TemplateFolder[]
}

interface SetState {
  id: string
  set_number: number
  reps: number
  weight_kg: number | null
  done: boolean
}

/* ── Component ────────────────────────────────────────────── */

export default function WorkoutPage({ mode, template, workout, exerciseNames }: Props) {
  const router = useRouter()
  const tempIdRef = useRef(0)

  /* Active-mode set state */
  const [setsByExercise, setSetsByExercise] = useState<Record<string, SetState[]>>(() => {
    if (mode !== "active" || !workout) return {}
    const initial: Record<string, SetState[]> = {}
    for (const ex of workout.exercises) {
      initial[ex.id] = (ex.sets ?? []).map((s) => {
        const logged = workout.logged_sets.find(
          (ls) => ls.exercise_id === ex.exercise_id && ls.set_number === s.set_number
        )
        return {
          id: s.id,
          set_number: s.set_number,
          reps: logged?.reps ?? s.reps,
          weight_kg: logged?.weight_kg ?? s.weight_kg,
          done: !!logged,
        }
      })
    }
    return initial
  })

  /* Previous sets placeholder */
  const previous: PreviousSets = {}

  /* ── Derived ──────────────────────────────────────────────── */

  const isPlanning = mode === "planning"
  const title = isPlanning ? (template?.name ?? "Mal") : (workout?.day_name ?? "Økt")

  const exercises = isPlanning
    ? (template?.exercises ?? []).map((ex) => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        name: exerciseNames[ex.exercise_id] ?? ex.exercise_id,
      }))
    : (workout?.exercises ?? []).map((ex) => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        name: exerciseNames[ex.exercise_id] ?? ex.name,
      }))

  // Suppress unused during scaffold
  void tempIdRef
  void setSetsByExercise
  void previous
  void router

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div
      className="forge"
      style={{
        background: "var(--brand-canvas)",
        minHeight: "100%",
        color: "var(--brand-ink)",
        padding: "16px 18px 32px",
        position: "relative",
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isPlanning && (
            <button type="button" aria-label="Forkast økt" style={iconBtnStyle}>
              ✕
            </button>
          )}
        </div>

        {isPlanning ? (
          <button type="button" style={primaryBtnStyle}>
            Start økt
          </button>
        ) : (
          <button type="button" style={primaryBtnStyle}>
            Fullfør
          </button>
        )}
      </div>

      {/* ── Title ───────────────────────────────────────────── */}
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 20px" }}>
        {title}
      </h1>

      {/* ── Exercise list ───────────────────────────────────── */}
      {exercises.map((ex) => {
        if (isPlanning) {
          const templateEx = (template?.exercises ?? []).find((e) => e.id === ex.id)
          const sets = templateEx?.sets ?? []

          return (
            <div key={ex.id} style={{ marginBottom: 28 }}>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--brand-orange)",
                  margin: "0 0 10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {ex.name}
              </h2>

              {/* Column headers — no ✓ in planning */}
              <div style={gridStyle(false)}>
                <div>SETT</div>
                <div>FORRIGE</div>
                <div style={{ textAlign: "center" }}>KG</div>
                <div style={{ textAlign: "center" }}>REPS</div>
              </div>

              {sets.map((set) => (
                <div key={set.id} style={rowStyle(false)}>
                  <div style={setBadge}>{set.set_number}</div>
                  <span style={{ fontSize: 12, color: "var(--brand-muted)" }}>—</span>
                  <input
                    type="number"
                    aria-label={`Vekt for ${ex.name} sett ${set.set_number}`}
                    defaultValue={set.weight_kg ?? ""}
                    style={inputStyle}
                    readOnly
                  />
                  <input
                    type="number"
                    aria-label={`Reps for ${ex.name} sett ${set.set_number}`}
                    defaultValue={set.reps ?? ""}
                    style={inputStyle}
                    readOnly
                  />
                </div>
              ))}
            </div>
          )
        } else {
          const sets = setsByExercise[ex.id] ?? []

          return (
            <div key={ex.id} style={{ marginBottom: 28 }}>
              <h2
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--brand-orange)",
                  margin: "0 0 10px",
                  letterSpacing: "-0.01em",
                }}
              >
                {ex.name}
              </h2>

              {/* Column headers — with ✓ in active */}
              <div style={gridStyle(true)}>
                <div>SETT</div>
                <div>FORRIGE</div>
                <div style={{ textAlign: "center" }}>KG</div>
                <div style={{ textAlign: "center" }}>REPS</div>
                <div />
              </div>

              {sets.map((set) => (
                <div key={set.set_number} style={rowStyle(true)}>
                  <div style={setBadge}>{set.set_number}</div>
                  <span style={{ fontSize: 12, color: "var(--brand-muted)" }}>—</span>
                  <input
                    type="number"
                    aria-label={`Vekt for ${ex.name} sett ${set.set_number}`}
                    value={set.weight_kg ?? ""}
                    readOnly
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    aria-label={`Reps for ${ex.name} sett ${set.set_number}`}
                    value={set.reps}
                    readOnly
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    aria-label={set.done ? "Fjern fullført" : "Marker som fullført"}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: set.done ? "var(--success)" : "var(--brand-subtle)",
                      color: set.done ? "white" : "var(--brand-muted)",
                      border: set.done ? "none" : "1px solid var(--brand-border)",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          )
        }
      })}
    </div>
  )
}

/* ── Styles ───────────────────────────────────────────────── */

function gridStyle(withCheck: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: withCheck ? "32px 1fr 70px 70px 32px" : "32px 1fr 70px 70px",
    gap: 8,
    fontSize: 10,
    fontWeight: 700,
    color: "var(--brand-muted)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
    padding: "0 2px",
  }
}

function rowStyle(withCheck: boolean): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: withCheck ? "32px 1fr 70px 70px 32px" : "32px 1fr 70px 70px",
    gap: 8,
    alignItems: "center",
    padding: "6px 2px",
    borderRadius: 8,
    marginBottom: 2,
  }
}

const setBadge: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  background: "var(--brand-subtle)",
  color: "var(--brand-orange)",
  fontSize: 13,
  fontWeight: 800,
  display: "grid",
  placeItems: "center",
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--brand-subtle)",
  border: "1px solid var(--brand-border)",
  borderRadius: 8,
  color: "var(--brand-ink)",
  fontSize: 15,
  fontWeight: 700,
  textAlign: "center",
  padding: "8px 4px",
  outline: "none",
  boxSizing: "border-box",
}

const iconBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  background: "var(--brand-subtle)",
  border: "none",
  color: "var(--brand-muted)",
  cursor: "pointer",
  fontSize: 18,
  display: "grid",
  placeItems: "center",
}

const primaryBtnStyle: React.CSSProperties = {
  background: "var(--brand-orange)",
  color: "white",
  border: "none",
  borderRadius: 999,
  padding: "10px 22px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
}
