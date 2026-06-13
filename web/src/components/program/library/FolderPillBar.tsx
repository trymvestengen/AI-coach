"use client"
import { useRef } from "react"
import type { ProgramFolder } from "@/lib/api"

const LONG_PRESS_MS = 500

interface Props {
  folders: ProgramFolder[]
  totalProgramCount: number
  selectedFolderId: string | null
  onSelect: (folderId: string | null) => void
  onAddFolder: () => void
  onFolderLongPress: (folder: ProgramFolder) => void
}

export default function FolderPillBar({
  folders,
  totalProgramCount,
  selectedFolderId,
  onSelect,
  onAddFolder,
  onFolderLongPress,
}: Props) {
  // Track active long-press timer per folder, plus whether the timer fired so
  // that we suppress the subsequent click event.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFiredRef = useRef(false)

  const startLongPress = (folder: ProgramFolder) => {
    longPressFiredRef.current = false
    longPressTimer.current = setTimeout(() => {
      longPressFiredRef.current = true
      onFolderLongPress(folder)
    }, LONG_PRESS_MS)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }
  const handleClickFolder = (folder: ProgramFolder) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    onSelect(folder.id)
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 14,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      <PillButton active={selectedFolderId === null} onClick={() => onSelect(null)}>
        Alle ({totalProgramCount})
      </PillButton>

      {folders.map((f) => (
        <PillButton
          key={f.id}
          active={selectedFolderId === f.id}
          onClick={() => handleClickFolder(f)}
          onMouseDown={() => startLongPress(f)}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={() => startLongPress(f)}
          onTouchEnd={cancelLongPress}
          onContextMenu={(e) => {
            e.preventDefault()
            onFolderLongPress(f)
          }}
        >
          {f.name}
        </PillButton>
      ))}

      <PillButton variant="add" onClick={onAddFolder}>
        + Mappe
      </PillButton>
    </div>
  )
}

interface PillButtonProps {
  children: React.ReactNode
  active?: boolean
  variant?: "default" | "add"
  onClick: () => void
  onMouseDown?: () => void
  onMouseUp?: () => void
  onMouseLeave?: () => void
  onTouchStart?: () => void
  onTouchEnd?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

function PillButton({ children, active, variant, onClick, ...handlers }: PillButtonProps) {
  const isAdd = variant === "add"
  const baseBg = active
    ? "var(--brand-orange)"
    : isAdd
      ? "var(--brand-subtle)"
      : "var(--brand-surface)"
  const baseColor = active ? "#fff" : isAdd ? "var(--brand-orange)" : "var(--brand-ink)"
  const baseBorder = active
    ? "var(--brand-orange)"
    : isAdd
      ? "var(--brand-orange)"
      : "var(--brand-border)"
  return (
    <button
      type="button"
      onClick={onClick}
      {...handlers}
      style={{
        flexShrink: 0,
        padding: "6px 12px",
        borderRadius: 999,
        background: baseBg,
        border: isAdd ? `1px dashed ${baseBorder}` : `1px solid ${baseBorder}`,
        fontSize: 12,
        fontWeight: 600,
        color: baseColor,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {children}
    </button>
  )
}
