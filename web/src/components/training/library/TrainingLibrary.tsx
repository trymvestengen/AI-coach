"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  startWorkoutFromTemplate,
  type Template,
  type TemplateFolder,
  type NextWorkout,
  type InProgressWorkout,
} from "@/lib/api"
import CoachSuggestionCard from "./CoachSuggestionCard"
import FolderPillBar from "./FolderPillBar"
import TemplateCard from "./TemplateCard"
import NewTemplateSheet from "./NewTemplateSheet"
import NewFolderSheet from "./NewFolderSheet"
import ActiveWorkoutBar from "./ActiveWorkoutBar"
import TemplateMenuSheet, { type TemplateMenuTarget } from "../detail/TemplateMenuSheet"
import ThemeToggle from "@/components/theme/ThemeToggle"

interface Props {
  templates: Template[]
  folders: TemplateFolder[]
  nextWorkout: NextWorkout | null
  inProgress: InProgressWorkout | null
}

export default function TrainingLibrary({ templates, folders, nextWorkout, inProgress }: Props) {
  const router = useRouter()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [newTemplateOpen, setNewTemplateOpen] = useState(false)
  const [newFolderOpen, setNewFolderOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState<TemplateMenuTarget | null>(null)
  const [starting, setStarting] = useState(false)

  const visibleTemplates = useMemo(
    () =>
      selectedFolderId === null
        ? templates
        : templates.filter((t) => t.folder_id === selectedFolderId),
    [templates, selectedFolderId]
  )

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
      <div style={{ padding: 20, background: "var(--brand-canvas)", flex: 1 }}>
        {/* Topbar: title + theme toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <span className="lib-topbar-title" style={{ fontSize: 26 }}>
            Trening
          </span>
          <ThemeToggle />
        </div>

        {/* Hero / Coach suggestion */}
        {suggestion ? (
          <CoachSuggestionCard
            suggestion={suggestion}
            onStart={(id) => start(id)}
            onSwap={() => {
              /* B-3: åpne mal-velger. For nå er malene rett under. */
            }}
          />
        ) : (
          /* Fallback hero: quick start card */
          <div className="lib-hero" style={{ marginBottom: 4 }}>
            <div className="lib-hero-eyebrow">Hurtigstart</div>
            <div className="lib-hero-title">Klar til å trene?</div>
            <div className="lib-hero-sub">Start en tom økt og bygg den underveis.</div>
            <div className="lib-gauge-row">
              <div className="lib-gauge-bar">
                <div className="lib-gauge-fill" style={{ width: "0%" }} />
              </div>
              <div className="lib-gauge-label">Velg mal under</div>
            </div>
          </div>
        )}

        {/* Quick start button */}
        <button
          type="button"
          onClick={() => start(undefined)}
          disabled={starting}
          className="lib-quickstart-btn"
          style={{
            cursor: starting ? "default" : "pointer",
            opacity: starting ? 0.7 : 1,
            marginBottom: 18,
          }}
        >
          + Start tom økt
        </button>

        {/* Folder pills */}
        <div style={{ marginTop: 4 }}>
          <FolderPillBar
            folders={folders}
            totalTemplateCount={templates.length}
            selectedFolderId={selectedFolderId}
            onSelect={setSelectedFolderId}
            onAddFolder={() => setNewFolderOpen(true)}
            onFolderLongPress={() => {
              /* B-3: mappe-handlinger (gi nytt navn / slett mappe) */
            }}
          />
        </div>

        {/* Maler section header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "4px 0 12px",
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

        {visibleTemplates.length === 0 ? (
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
            {selectedFolderId === null
              ? "Ingen maler enda. Lag en med «+ Ny mal», eller lagre en fullført økt som mal."
              : "Ingen maler i denne mappen."}
          </div>
        ) : (
          <div className="lib-mal-grid">
            {visibleTemplates.map((t) => (
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
        folderId={selectedFolderId}
        onClose={() => setNewTemplateOpen(false)}
        onCreated={() => {
          setNewTemplateOpen(false)
          router.refresh()
        }}
      />
      <NewFolderSheet
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onCreated={() => router.refresh()}
      />
      <TemplateMenuSheet
        template={menuTarget}
        folders={folders}
        onClose={() => setMenuTarget(null)}
        onChanged={() => router.refresh()}
        onDeleted={() => router.refresh()}
      />
    </div>
  )
}
