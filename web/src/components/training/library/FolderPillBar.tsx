"use client"
import { useRef } from "react"
import type { TemplateFolder } from "@/lib/api"

const LONG_PRESS_MS = 500

interface Props {
  folders: TemplateFolder[]
  totalTemplateCount: number
  selectedFolderId: string | null
  onSelect: (folderId: string | null) => void
  onAddFolder: () => void
  onFolderLongPress: (folder: TemplateFolder) => void
}

export default function FolderPillBar({
  folders,
  totalTemplateCount,
  selectedFolderId,
  onSelect,
  onAddFolder,
  onFolderLongPress,
}: Props) {
  // Track active long-press timer per folder, plus whether the timer fired so
  // that we suppress the subsequent click event.
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFiredRef = useRef(false)

  const startLongPress = (folder: TemplateFolder) => {
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
  const handleClickFolder = (folder: TemplateFolder) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    onSelect(folder.id)
  }

  return (
    <nav
      aria-label="Mappefilter"
      style={{
        display: "flex",
        gap: 6,
        marginBottom: 14,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      <PillButton active={selectedFolderId === null} onClick={() => onSelect(null)}>
        Alle ({totalTemplateCount})
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
    </nav>
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
  const classes = ["lib-pill", active ? "lib-pill-active" : "", isAdd ? "lib-pill-add" : ""]
    .filter(Boolean)
    .join(" ")

  return (
    <button
      type="button"
      onClick={onClick}
      {...handlers}
      className={classes}
      style={{
        userSelect: "none",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  )
}
