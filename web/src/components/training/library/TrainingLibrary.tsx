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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ padding: 20, background: "var(--brand-canvas)", flex: 1 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: "var(--brand-ink)",
            letterSpacing: "-0.03em",
            marginBottom: 14,
          }}
        >
          Start økt
        </div>

        {suggestion && (
          <CoachSuggestionCard
            suggestion={suggestion}
            onStart={(id) => start(id)}
            onSwap={() => {
              /* B-3: åpne mal-velger. For nå er malene rett under. */
            }}
          />
        )}

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--brand-muted)",
            margin: "18px 0 10px",
          }}
        >
          Hurtigstart
        </div>
        <button
          type="button"
          onClick={() => start(undefined)}
          disabled={starting}
          style={{
            width: "100%",
            background: "var(--brand-orange)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "13px 16px",
            fontSize: 15,
            fontWeight: 700,
            cursor: starting ? "default" : "pointer",
            opacity: starting ? 0.7 : 1,
          }}
        >
          + Start tom økt
        </button>

        <div style={{ marginTop: 22 }}>
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "4px 4px 12px",
          }}
        >
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--brand-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            Maler
          </span>
          <button
            type="button"
            onClick={() => setNewTemplateOpen(true)}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-orange)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {visibleTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onOpen={(id) => router.push(`/program/template/${id}`)}
                onMenu={() => setMenuTarget({ id: t.id, name: t.name, folder_id: t.folder_id })}
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
        onCreated={(tpl) => router.push(`/program/template/${tpl.id}`)}
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
