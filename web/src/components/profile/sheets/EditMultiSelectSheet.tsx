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
  initialValues: string[]
  onSave: (values: string[]) => void
}

export default function EditMultiSelectSheet({
  open,
  onClose,
  title,
  choices,
  initialValues,
  onSave,
}: Props) {
  const [values, setValues] = useState<string[]>(initialValues)

  const toggle = (v: string) =>
    setValues((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]))

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
          <div className="flex flex-wrap gap-2 mb-4">
            {choices.map((c) => {
              const active = values.includes(c.value)
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => toggle(c.value)}
                  className={`px-4 py-2 rounded-full border text-sm ${
                    active
                      ? "bg-orange-500/20 border-orange-500 text-white"
                      : "bg-neutral-800 border-neutral-700 text-neutral-300"
                  }`}
                >
                  {c.label}
                </button>
              )
            })}
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
                onSave(values)
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
