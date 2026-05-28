"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import type { UserInjury } from "@/lib/profile"

const SEVERITY: { value: "lett" | "moderat" | "alvorlig"; label: string }[] = [
  { value: "lett", label: "Lett" },
  { value: "moderat", label: "Moderat" },
  { value: "alvorlig", label: "Alvorlig" },
]

interface Props {
  open: boolean
  onClose: () => void
  injury: UserInjury | null
  onSave: (data: Partial<UserInjury>) => void
  onDelete: (id: string) => void
}

export default function EditInjurySheet({ open, onClose, injury, onSave, onDelete }: Props) {
  const [bodyPart, setBodyPart] = useState(injury?.body_part ?? "")
  const [description, setDescription] = useState(injury?.description ?? "")
  const [severity, setSeverity] = useState<string | null>(injury?.severity ?? null)
  const [startedAt, setStartedAt] = useState(injury?.started_at ?? "")

  const isEditing = injury !== null
  const canSave = bodyPart.trim().length > 0

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
            {isEditing ? "Rediger skade" : "Ny skade"}
          </Dialog.Title>

          <label className="block mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Kroppsdel</span>
            <input
              aria-label="Kroppsdel"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700"
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
              placeholder="f.eks. venstre kne"
            />
          </label>

          <label className="block mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Beskrivelse</span>
            <textarea
              aria-label="Beskrivelse"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="f.eks. vondt ved dyp bøyning"
            />
          </label>

          <div className="mb-3">
            <span className="block text-neutral-400 text-sm mb-1">Alvorlighet</span>
            <div className="flex gap-2">
              {SEVERITY.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSeverity(s.value)}
                  className={`flex-1 py-2 rounded-md border ${
                    severity === s.value
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block mb-4">
            <span className="block text-neutral-400 text-sm mb-1">Startdato (valgfri)</span>
            <input
              type="date"
              aria-label="Startdato"
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700"
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
            />
          </label>

          <div className="flex gap-2 justify-between">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  onDelete(injury!.id)
                  onClose()
                }}
                className="px-4 py-2 text-red-400 hover:text-red-300"
              >
                Markér som leget
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
                  onSave({
                    body_part: bodyPart,
                    description: description || null,
                    severity: severity || null,
                    started_at: startedAt || null,
                  })
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
