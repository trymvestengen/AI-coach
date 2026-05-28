"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

interface Props {
  open: boolean
  onClose: () => void
  title: string
  initialValue: string
  unit?: string
  type?: "text" | "number" | "textarea"
  onSave: (value: string) => void
}

export default function EditTextSheet({
  open,
  onClose,
  title,
  initialValue,
  unit,
  type = "text",
  onSave,
}: Props) {
  const [value, setValue] = useState(initialValue)

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Dialog.Content className="fixed bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl p-5 z-50 max-h-[70vh] overflow-y-auto">
          <Dialog.Title className="text-white text-lg font-semibold mb-4">{title}</Dialog.Title>
          {type === "textarea" ? (
            <textarea
              className="w-full bg-neutral-800 text-white rounded-md p-3 border border-neutral-700 mb-4 min-h-[100px]"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          ) : (
            <div className="flex items-center gap-2 mb-4">
              <input
                type={type}
                className="flex-1 bg-neutral-800 text-white rounded-md p-3 border border-neutral-700"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              {unit && <span className="text-neutral-400">{unit}</span>}
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(value)
                onClose()
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600"
            >
              Lagre
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
