"use client"
import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"

interface Choice {
  value: string
  label: string
}

interface Props {
  open: boolean
  onClose: () => void
  title: string
  choices: Choice[]
  initialValue: string
  onSave: (value: string) => void
}

export default function EditChoiceSheet({
  open,
  onClose,
  title,
  choices,
  initialValue,
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
          <div className="flex flex-col gap-2 mb-4">
            {choices.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setValue(c.value)}
                className={`w-full px-4 py-3 rounded-md text-left border ${
                  value === c.value
                    ? "bg-orange-500/20 border-orange-500 text-white"
                    : "bg-neutral-800 border-neutral-700 text-neutral-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
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
