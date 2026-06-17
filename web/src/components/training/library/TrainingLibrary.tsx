"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  startWorkoutFromTemplate,
  type Template,
  type TemplateFolder,
  type NextWorkout,
  type InProgressWorkout,
} from "@/lib/api"
import CoachSuggestionCard from "./CoachSuggestionCard"
import TemplateCard from "./TemplateCard"
import NewTemplateSheet from "./NewTemplateSheet"
import ActiveWorkoutBar from "./ActiveWorkoutBar"
import TemplateMenuSheet, { type TemplateMenuTarget } from "../detail/TemplateMenuSheet"
import ThemeToggle from "@/components/theme/ThemeToggle"

interface Props {
  templates: Template[]
  /** Kept for future revival — not rendered, do not remove from callers yet */
  folders?: TemplateFolder[]
  nextWorkout: NextWorkout | null
  inProgress: InProgressWorkout | null
}

export default function TrainingLibrary({ templates, nextWorkout, inProgress }: Props) {
  const router = useRouter()
  const [newTemplateOpen, setNewTemplateOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState<TemplateMenuTarget | null>(null)
  const [starting, setStarting] = useState(false)

  const start = async (templateId?: string) => {
    if (starting) return
    setStarting(true)
    try {
      const { workout_id } = await startWorkoutFromTemplate(templateId)
      router.push(`/program/workout/${workout_id}`)
    } catch {
      setStarting(false)
    }
  }

  const suggestion =
    nextWorkout && nextWorkout.template_id
      ? {
          template_id: nextWorkout.template_id,
          name: nextWorkout.name ?? "Neste økt",
          reason: nextWorkout.reason,
        }
      : null

  return (
    <div className="forge" style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ padding: "16px 20px 20px", background: "var(--brand-canvas)", flex: 1 }}>
        {/* Topbar: title + theme toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span className="lib-topbar-title" style={{ fontSize: 26 }}>
            Trening
          </span>
          <ThemeToggle />
        </div>

        {/* Neste økt / Coach suggestion */}
        {suggestion ? (
          <CoachSuggestionCard suggestion={suggestion} onStart={(id) => start(id)} />
        ) : null}

        {/* Secondary: start empty workout */}
        <button
          type="button"
          onClick={() => start(undefined)}
          disabled={starting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "1px solid var(--brand-border)",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--brand-muted)",
            cursor: starting ? "default" : "pointer",
            opacity: starting ? 0.6 : 1,
            marginBottom: 14,
            fontFamily: "inherit",
          }}
        >
          + Start tom økt
        </button>

        {/* Maler section header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "0 0 10px",
          }}
        >
          <span className="lib-section-title">Maler</span>
          <button
            type="button"
            onClick={() => setNewTemplateOpen(true)}
            style={{
              color: "var(--brand-orange)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 6,
              border: "1px solid rgba(249,115,22,0.25)",
              background: "rgba(249,115,22,0.08)",
            }}
          >
            + Ny mal
          </button>
        </div>

        {templates.length === 0 ? (
          <div
            style={{
              background: "var(--brand-surface)",
              border: "1px dashed var(--brand-border)",
              borderRadius: 12,
              padding: "16px 12px",
              textAlign: "center",
              color: "var(--brand-muted)",
              fontSize: 12,
            }}
          >
            Ingen maler enda. Lag en med «+ Ny mal», eller lagre en fullført økt som mal.
          </div>
        ) : (
          <div className="lib-mal-grid">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onOpen={(id) => start(id)}
                onMenu={() =>
                  setMenuTarget({
                    id: t.id,
                    name: t.name,
                    folder_id: t.folder_id,
                    scheduled_days: t.scheduled_days ?? [],
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {inProgress && (
        <ActiveWorkoutBar
          label={inProgress.day_name ?? "Pågående økt"}
          onContinue={() => router.push(`/program/workout/${inProgress.workout_id}`)}
        />
      )}

      <NewTemplateSheet
        open={newTemplateOpen}
        folderId={null}
        onClose={() => setNewTemplateOpen(false)}
        onCreated={() => {
          setNewTemplateOpen(false)
          router.refresh()
        }}
      />
      <TemplateMenuSheet
        template={menuTarget}
        onClose={() => setMenuTarget(null)}
        onChanged={() => router.refresh()}
        onDeleted={() => router.refresh()}
      />
    </div>
  )
}
