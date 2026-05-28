"use client"
import { ReactNode } from "react"

interface Props {
  label: string
  value: ReactNode
  onClick?: () => void
  isLast?: boolean
}

export default function ProfileField({ label, value, onClick, isLast = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-800 transition-colors ${
        isLast ? "" : "border-b border-neutral-800"
      }`}
    >
      <span className="text-neutral-400 text-sm">{label}</span>
      <span className="flex items-center gap-2 text-neutral-100 text-sm">
        <span>{value ?? <span className="text-neutral-600">—</span>}</span>
        <span className="text-neutral-500">›</span>
      </span>
    </button>
  )
}
