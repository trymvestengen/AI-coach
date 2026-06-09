"use client"
import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"

interface Props {
  imageSrc: string
  onCancel: () => void
  onConfirm: (blob: Blob) => void | Promise<void>
}

async function getCroppedBlob(imageSrc: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = imageSrc
  })

  // Render at a fixed output size for predictable file weight.
  const OUT = 512
  const canvas = document.createElement("canvas")
  canvas.width = OUT
  canvas.height = OUT
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas context unavailable")
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, OUT, OUT)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Kunne ikke lage bilde"))),
      "image/jpeg",
      0.9
    )
  })
}

export default function AvatarCropModal({ imageSrc, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pixels, setPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  const onCropComplete = useCallback((_: Area, areaPx: Area) => {
    setPixels(areaPx)
  }, [])

  const handleConfirm = async () => {
    if (!pixels) return
    setBusy(true)
    try {
      const blob = await getCroppedBlob(imageSrc, pixels)
      await onConfirm(blob)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          position: "relative",
          background: "#000",
        }}
      >
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div
        style={{
          background: "var(--brand-canvas)",
          padding: "16px 20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>−</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--brand-orange)" }}
          />
          <span style={{ fontSize: 18 }}>+</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid var(--brand-border)",
              color: "var(--brand-ink)",
              borderRadius: 12,
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 600,
              cursor: busy ? "default" : "pointer",
            }}
          >
            Avbryt
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !pixels}
            style={{
              flex: 1,
              background: "var(--brand-orange)",
              border: "none",
              color: "#fff",
              borderRadius: 12,
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 600,
              cursor: busy || !pixels ? "default" : "pointer",
              opacity: busy || !pixels ? 0.6 : 1,
            }}
          >
            {busy ? "Lagrer…" : "Bruk"}
          </button>
        </div>
      </div>
    </div>
  )
}
