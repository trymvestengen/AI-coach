"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  startWorkoutFromTemplate,
  type TemplateDetail as TemplateDetailType,
  type TemplateExercise,
  type TemplateFolder,
} from "@/lib/api"
import ThemeToggle from "@/components/theme/ThemeToggle"
import TemplateMenuSheet, { type TemplateMenuTarget } from "./TemplateMenuSheet"

interface Props {
  template: TemplateDetailType
  exerciseNames: Record<string, string>
  folders: TemplateFolder[]
}

function setSpec(exercise: TemplateExercise): string {
  const sets = exercise.sets
  if (sets.length === 0) return "Ingen sett"
  const first = sets[0]
  const reps = first.reps != null ? `${sets.length} × ${first.reps}` : `${sets.length} sett`
  const weight = first.weight_kg != null ? ` @ ${first.weight_kg} kg` : ""
  return reps + weight
}

export default function TemplateDetail({ template, exerciseNames, folders }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [starting, setStarting] = useState(false)

  const start = async () => {
    if (starting) return
    setStarting(true)
    try {
      const { workout_id } = await startWorkoutFromTemplate(template.id)
      router.push(`/program/workout/${workout_id}`)
    } catch {
      setStarting(false)
    }
  }

  const menuTarget: TemplateMenuTarget | null = menuOpen
    ? { id: template.id, name: template.name, folder_id: template.folder_id }
    : null

  return (
    <div
      className="screen forge"
      style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
    >
      <div className="app-topbar" style={{ padding: "16px 20px 4px" }}>
        <Link href="/program" className="section-link" style={{ fontSize: 13 }}>
          ‹ Trening
        </Link>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <h1 className="display-title" style={{ fontSize: 30 }}>
            {template.name}
          </h1>
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

        {template.exercises.length === 0 ? (
          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px dashed var(--brand-border)",
              borderRadius: 12,
              padding: "16px 12px",
              textAlign: "center",
              color: "var(--brand-muted)",
              fontSize: 12,
              marginBottom: 20,
            }}
          >
            Ingen øvelser i denne malen enda. Start en økt og lagre den som mal for å fylle den.
          </div>
        ) : (
          <div className="panel-list" style={{ marginBottom: 20 }}>
            {template.exercises.map((ex) => (
              <div key={ex.id} className="list-row">
                <span className="row-main row-name">
                  {exerciseNames[ex.exercise_id] ?? "Ukjent øvelse"}
                </span>
                <span className="row-trail tnum">{setSpec(ex)}</span>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={start}
          disabled={starting}
          className="btn btn-primary btn-block"
          style={{ opacity: starting ? 0.7 : 1 }}
        >
          Start denne økta <span className="arrow">→</span>
        </button>
      </div>

      <TemplateMenuSheet
        template={menuTarget}
        folders={folders}
        onClose={() => setMenuOpen(false)}
        onChanged={() => router.refresh()}
        onDeleted={() => router.push("/program")}
      />
    </div>
  )
}
