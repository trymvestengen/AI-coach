"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserConstraint } from "@/lib/profile"

const TYPES: { value: "schedule" | "duration" | "frequency"; label: string }[] = [
  { value: "schedule", label: "Tidsplan" },
  { value: "duration", label: "Varighet" },
  { value: "frequency", label: "Frekvens" },
]

interface Props {
  open: boolean
  onClose: () => void
  constraint: UserConstraint | null
  onSave: (data: Partial<UserConstraint>) => void
  onDelete: (id: string) => void
}

export default function EditConstraintSheet({
  open,
  onClose,
  constraint,
  onSave,
  onDelete,
}: Props) {
  const [type, setType] = useState<string | null>(constraint?.type ?? null)
  const [description, setDescription] = useState(constraint?.description ?? "")
  const isEditing = constraint !== null
  const canSave = type !== null && description.trim().length > 0

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
            {isEditing ? "Rediger begrensning" : "Ny begrensning"}
          </Dialog.Title>

          <div className="mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Type</span>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    type === t.value
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block mb-4">
            <span className="block text-neutral-400 text-sm mb-1">Beskrivelse</span>
            <textarea
              aria-label="Beskrivelse"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="f.eks. maks 45 min per økt"
            />
          </label>

          <div className="flex gap-2 justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  onDelete(constraint!.id)
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
                  onSave({ type: type!, description })
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
