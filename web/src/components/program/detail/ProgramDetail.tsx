"use client"
import { useState } from "react"
import type { Program, ProgramFolder } from "@/lib/api"
import ProgramDetailHeader from "./ProgramDetailHeader"
import DayCard from "./DayCard"
import ProgramMenuSheet from "./ProgramMenuSheet"
import MoveToFolderSheet from "./MoveToFolderSheet"

interface Props {
  program: Program
  folders: ProgramFolder[]
  todayDayNumber: number
}

export default function ProgramDetail({ program, folders, todayDayNumber }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)

  const subtitle = `${program.days?.length ?? 0} dager`

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <ProgramDetailHeader
        programName={program.name}
        isActive={program.is_active}
        subtitle={subtitle}
        onOpenMenu={() => setMenuOpen(true)}
      />

      <div
        style={{
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "var(--brand-muted)",
          fontWeight: 600,
          margin: "8px 4px",
        }}
      >
        Uken
      </div>

      {(program.days ?? []).map((day) => (
        <DayCard
          key={day.id}
          day={{
            id: day.id,
            day_number: day.day_number,
            name: day.name,
            exercise_count: day.exercises.length,
          }}
          isToday={day.day_number === todayDayNumber && day.exercises.length > 0}
          onOpen={() => {
            /* day exercise expansion in future iteration */
          }}
        />
      ))}

      <ProgramMenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        programId={program.id}
        programName={program.name}
        isActive={program.is_active}
        onOpenMoveSheet={() => setMoveOpen(true)}
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
