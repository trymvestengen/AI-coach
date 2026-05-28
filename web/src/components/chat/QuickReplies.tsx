"use client"

interface Props {
  options: string[]
  onSelect: (option: string) => void
  disabled?: boolean
}

export default function QuickReplies({ options, onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-2 ml-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
