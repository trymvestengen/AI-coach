"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserPreference } from "@/lib/profile"

const CATEGORIES: { value: "exercise" | "time" | "intensity" | "other"; label: string }[] = [
  { value: "exercise", label: "Øvelse" },
  { value: "time", label: "Tid" },
  { value: "intensity", label: "Intensitet" },
  { value: "other", label: "Annet" },
]

interface Props {
  open: boolean
  onClose: () => void
  preference: UserPreference | null
  onSave: (data: Partial<UserPreference>) => void
  onDelete: (id: string) => void
}

export default function EditPreferenceSheet({
  open,
  onClose,
  preference,
  onSave,
  onDelete,
}: Props) {
  const [category, setCategory] = useState<string | null>(preference?.category ?? null)
  const [text, setText] = useState(preference?.preference ?? "")
  const isEditing = preference !== null
  const canSave = category !== null && text.trim().length > 0

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">
            {isEditing ? "Rediger preferanse" : "Ny preferanse"}
          </Dialog.Title>

          <div className="mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Kategori</span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    category === c.value
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block mb-4">
            <span className="block text-neutral-400 text-sm mb-1">Beskrivelse</span>
            <textarea
              aria-label="Beskrivelse"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 min-h-[80px]"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="f.eks. liker ikke beinpress"
            />
          </label>

          <div className="flex gap-2 justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  onDelete(preference!.id)
                  onClose()
                }}
                className="px-4 py-2 text-red-400 hover:text-red-300"
              >
                Slett
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-400 hover:text-white"
              >
                Avbryt
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => {
                  onSave({ category: category!, preference: text })
                  onClose()
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
              >
                Lagre
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
