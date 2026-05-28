"use client"
import * as Dialog from "@radix-ui/react-dialog"
import VoiceSession from "./VoiceSession"

interface Props {
  open: boolean
  onClose: () => void
}

export default function VoiceSheet({ open, onClose }: Props) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black z-40" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-black">
          <Dialog.Title className="sr-only">Voice modus</Dialog.Title>
          <div className="flex items-center justify-end p-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Lukk voice"
              className="w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <VoiceSession />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
