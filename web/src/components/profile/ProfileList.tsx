"use client"
import { ReactNode } from "react"

interface Item {
  id: string
  primary: string
  secondary?: ReactNode
}

interface Props {
  items: Item[]
  onAdd: () => void
  onItemClick: (id: string) => void
  addLabel: string
}

export default function ProfileList({ items, onAdd, onItemClick, addLabel }: Props) {
  return (
    <div>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onItemClick(it.id)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-neutral-800 transition-colors border-b border-neutral-800"
        >
          <div className="flex flex-col">
            <span className="text-neutral-100 text-sm">{it.primary}</span>
            {it.secondary && (
              <span className="text-neutral-500 text-xs mt-0.5">{it.secondary}</span>
            )}
          </div>
          <span className="text-neutral-500">›</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full px-4 py-3 text-left text-orange-400 hover:bg-neutral-800 transition-colors"
      >
        + {addLabel}
      </button>
    </div>
  )
}
