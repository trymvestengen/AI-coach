"use client"
import { useCallback, useEffect, useState } from "react"
import {
  getTemplate,
  getExercises,
  addExerciseToTemplate,
  removeExerciseFromTemplate,
  updateTemplateExercise,
  type TemplateDetail,
  type TemplateExercise,
  type Exercise,
  type TemplateFolder,
} from "@/lib/api"
import TemplateMenuSheet, { type TemplateMenuTarget } from "./TemplateMenuSheet"
import ExercisePicker from "../../exercises/ExercisePicker"

interface Props {
  templateId: string | null
  folders: TemplateFolder[]
  onClose: () => void
  /** Kalt etter navne-/mappe-/slett-endring så biblioteket kan refreshe. */
  onChanged: () => void
  /** Starter en økt fra denne malen (eier navigasjonen). */
  onStart: (templateId: string) => void
}

function repsOf(ex: TemplateExercise): number | null {
  return ex.sets[0]?.reps ?? null
}
function weightOf(ex: TemplateExercise): number | null {
  return ex.sets[0]?.weight_kg ?? null
}

export default function TemplateSheet({ templateId, folders, onClose, onChanged, onStart }: Props) {
  // Komponenten remountes per templateId (key i parent), så initial-tilstand
  // representerer «åpner, laster» — da slipper vi synkron setState i effekten.
  const [detail, setDetail] = useState<TemplateDetail | null>(null)
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const reload = useCallback(async (id: string) => {
    const t = await getTemplate(id)
    setDetail(t)
  }, [])

  useEffect(() => {
    if (!templateId) return
    let cancelled = false
    Promise.all([getTemplate(templateId), getExercises()])
      .then(([t, ex]) => {
        if (cancelled) return
        setDetail(t)
        setAllExercises(ex)
      })
      .catch(() => {
        if (!cancelled) setError("Kunne ikke laste malen.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [templateId])

  if (!templateId) return null

  const exerciseNames: Record<string, string> = Object.fromEntries(
    allExercises.map((e) => [e.id, e.name])
  )
  const nameOf = (exerciseId: string) => exerciseNames[exerciseId] ?? exerciseId

  const run = async (fn: () => Promise<void>) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await fn()
      await reload(templateId)
    } catch {
      setError("Noe gikk galt. Prøv igjen.")
    } finally {
      setBusy(false)
    }
  }

  const setCount = (ex: TemplateExercise) => ex.sets.length

  const changeSets = (ex: TemplateExercise, next: number) =>
    run(() =>
      updateTemplateExercise(templateId, ex.exercise_id, { sets: Math.max(1, next) }).then(
        () => undefined
      )
    )

  const changeReps = (ex: TemplateExercise, reps: number) =>
    run(() => updateTemplateExercise(templateId, ex.exercise_id, { reps }).then(() => undefined))

  const changeWeight = (ex: TemplateExercise, weight: number | null) =>
    run(() =>
      updateTemplateExercise(templateId, ex.exercise_id, { weight_kg: weight }).then(
        () => undefined
      )
    )

  const remove = (ex: TemplateExercise) =>
    run(() => removeExerciseFromTemplate(templateId, ex.exercise_id))

  const menuTarget: TemplateMenuTarget | null =
    menuOpen && detail ? { id: detail.id, name: detail.name, folder_id: detail.folder_id } : null

  return (
    <div
      data-testid="sheet-overlay"
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        className="forge"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          maxHeight: "88%",
          overflowY: "auto",
          background: "var(--brand-canvas)",
          color: "var(--brand-ink)",
          borderRadius: "20px 20px 0 0",
          padding: "14px 20px 28px",
        }}
      >
        <div
          style={{
            width: 32,
            height: 4,
            background: "var(--brand-border)",
            borderRadius: 999,
            margin: "0 auto 16px",
          }}
        />

        {loading && !detail ? (
          <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 24 }}>
            Laster…
          </div>
        ) : !detail ? (
          <div style={{ textAlign: "center", color: "var(--danger)", padding: 24 }}>
            {error ?? "Fant ikke malen."}
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <h2 className="display-title" style={{ fontSize: 26 }}>
                {detail.name}
              </h2>
              <button
                type="button"
                aria-label="Mal-valg"
                onClick={() => setMenuOpen(true)}
                style={{
                  flex: "none",
                  background: "var(--brand-subtle)",
                  border: "none",
                  color: "var(--brand-ink)",
                  borderRadius: 10,
                  width: 36,
                  height: 36,
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ⋯
              </button>
            </div>

            <div className="panel-list" style={{ marginBottom: 14 }}>
              {detail.exercises.map((ex) => (
                <div
                  key={ex.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--brand-border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span className="row-name" style={{ fontWeight: 700 }}>
                      {nameOf(ex.exercise_id)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Fjern ${nameOf(ex.exercise_id)}`}
                      onClick={() => remove(ex)}
                      disabled={busy}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--danger)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: busy ? "default" : "pointer",
                      }}
                    >
                      Fjern
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        type="button"
                        aria-label="Færre sett"
                        onClick={() => changeSets(ex, setCount(ex) - 1)}
                        disabled={busy || setCount(ex) <= 1}
                        className="set-step"
                        style={stepStyle}
                      >
                        −
                      </button>
                      <span
                        className="tnum"
                        style={{ minWidth: 54, textAlign: "center", fontSize: 13 }}
                      >
                        {setCount(ex)} sett
                      </span>
                      <button
                        type="button"
                        aria-label="Flere sett"
                        onClick={() => changeSets(ex, setCount(ex) + 1)}
                        disabled={busy}
                        className="set-step"
                        style={stepStyle}
                      >
                        +
                      </button>
                    </div>
                    <label style={fieldLabel}>
                      Reps
                      <input
                        aria-label={`Reps for ${nameOf(ex.exercise_id)}`}
                        type="number"
                        min={1}
                        defaultValue={repsOf(ex) ?? ""}
                        onBlur={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (!Number.isNaN(v) && v !== repsOf(ex)) changeReps(ex, v)
                        }}
                        style={numInput}
                      />
                    </label>
                    <label style={fieldLabel}>
                      Kg
                      <input
                        aria-label={`Vekt for ${nameOf(ex.exercise_id)}`}
                        type="number"
                        min={0}
                        step="0.5"
                        defaultValue={weightOf(ex) ?? ""}
                        onBlur={(e) => {
                          const raw = e.target.value.trim()
                          const v = raw === "" ? null : parseFloat(raw)
                          if (v !== weightOf(ex)) changeWeight(ex, v)
                        }}
                        style={numInput}
                      />
                    </label>
                  </div>
                </div>
              ))}
              {detail.exercises.length === 0 && (
                <div style={{ color: "var(--brand-muted)", fontSize: 12, padding: "8px 0" }}>
                  Ingen øvelser enda. Legg til en under.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              style={{
                width: "100%",
                background: "none",
                border: "1px dashed var(--brand-border)",
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--brand-orange)",
                cursor: "pointer",
                marginBottom: 16,
              }}
            >
              + Legg til øvelse
            </button>

            {error && (
              <div style={{ color: "var(--danger)", fontSize: 12, marginBottom: 10 }}>{error}</div>
            )}

            <button
              type="button"
              onClick={() => onStart(templateId)}
              className="btn btn-primary btn-block"
            >
              Start økta <span className="arrow">→</span>
            </button>
          </>
        )}
      </div>

      <TemplateMenuSheet
        template={menuTarget}
        folders={folders}
        onClose={() => setMenuOpen(false)}
        onChanged={() => {
          onChanged()
          reload(templateId)
        }}
        onDeleted={() => {
          setMenuOpen(false)
          onChanged()
          onClose()
        }}
      />

      <ExercisePicker
        open={pickerOpen}
        excludeIds={(detail?.exercises ?? []).map((e) => e.exercise_id)}
        onClose={() => setPickerOpen(false)}
        onConfirm={(ids) =>
          run(async () => {
            for (const id of ids) {
              await addExerciseToTemplate(templateId, { exercise_id: id })
            }
            setPickerOpen(false)
          })
        }
      />
    </div>
  )
}

const stepStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: "1px solid var(--brand-border)",
  background: "var(--brand-surface)",
  color: "var(--brand-ink)",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
}
const fieldLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  color: "var(--brand-muted)",
}
const numInput: React.CSSProperties = {
  width: 54,
  background: "var(--brand-surface)",
  border: "1px solid var(--brand-border)",
  borderRadius: 8,
  padding: "6px 8px",
  fontSize: 13,
  color: "var(--brand-ink)",
}
