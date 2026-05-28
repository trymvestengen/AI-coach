"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

const PRESETS: Record<string, string[]> = {
  "Hjemmegym basic": ["barbell", "plates", "bench", "dumbbells_pair"],
  Treningssenter: [
    "barbell",
    "dumbbells_full_range",
    "cable_machine",
    "leg_press",
    "smith_machine",
    "pull_up_bar",
  ],
  "Bare bodyweight": ["pull_up_bar"],
}

interface Props {
  open: boolean
  onClose: () => void
  mode: "add" | "edit"
  existing: string[]
  item: string | null
  onAdd: (equipment: string) => void
  onDelete: (equipment: string) => void
}

export default function EquipmentSheet({
  open,
  onClose,
  mode,
  existing,
  item,
  onAdd,
  onDelete,
}: Props) {
  const [value, setValue] = useState("")

  const applyPreset = (preset: string) => {
    for (const eq of PRESETS[preset]) {
      if (!existing.includes(eq)) onAdd(eq)
    }
    onClose()
  }

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
            {mode === "edit" ? `Utstyr: ${item}` : "Legg til utstyr"}
          </Dialog.Title>

          {mode === "add" && (
            <>
              <label className="block mb-3">
                <span className="block text-neutral-400 text-sm mb-1">Utstyr</span>
                <input
                  aria-label="Utstyr"
                  className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="f.eks. barbell"
                />
              </label>

              <div className="mb-4">
                <span className="block text-neutral-400 text-sm mb-2">Eller velg en preset:</span>
                <div className="flex flex-col gap-2">
                  {Object.keys(PRESETS).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-left text-neutral-300 hover:bg-neutral-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-between">
            {mode === "edit" && item && (
              <button
                type="button"
                onClick={() => {
                  onDelete(item)
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
              {mode === "add" && (
                <button
                  type="button"
                  disabled={value.trim().length === 0}
                  onClick={() => {
                    onAdd(value.trim())
                    onClose()
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 disabled:bg-neutral-700 disabled:text-neutral-500"
                >
                  Lagre
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
