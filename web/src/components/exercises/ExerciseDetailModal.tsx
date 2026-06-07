"use client"
import { useEffect, useState } from "react"
import { getExerciseDetail, type ExerciseDetail } from "@/lib/api"

interface Props {
  exerciseId: string | null
  onClose: () => void
  onPick?: (exerciseId: string) => void
}

export default function ExerciseDetailModal({ exerciseId, onClose, onPick }: Props) {
  const [detail, setDetail] = useState<ExerciseDetail | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TODO(frontend-lint-debt): setState calls inside effect are intentional here (async data fetch)
  useEffect(() => {
    if (!exerciseId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetail(null)
      return
    }
    setLoading(true)
    setError(null)
    setActiveImage(0)
    getExerciseDetail(exerciseId)
      .then((d) => setDetail(d))
      .catch((e) => setError(e instanceof Error ? e.message : "Kunne ikke laste"))
      .finally(() => setLoading(false))
  }, [exerciseId])

  if (!exerciseId) return null

  return (
    <div
      role="dialog"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--brand-canvas)",
          borderRadius: "20px 20px 0 0",
          padding: "16px 20px 28px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          type="button"
          aria-label="Lukk"
          onClick={onClose}
          style={{
            background: "var(--brand-surface)",
            border: "1px solid var(--brand-border)",
            borderRadius: 999,
            width: 32,
            height: 32,
            color: "var(--brand-muted)",
            fontSize: 16,
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        {loading && (
          <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 40 }}>
            Laster…
          </div>
        )}

        {error && (
          <div style={{ color: "var(--danger)", textAlign: "center", padding: 20 }}>{error}</div>
        )}

        {detail && (
          <>
            {detail.image_urls.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveImage((i) => (i + 1) % detail.image_urls.length)}
                aria-label={`Bytt bilde (${activeImage + 1} av ${detail.image_urls.length})`}
                style={{
                  width: "100%",
                  border: "none",
                  background: "var(--brand-surface)",
                  borderRadius: 14,
                  padding: 0,
                  cursor: detail.image_urls.length > 1 ? "pointer" : "default",
                  overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={detail.image_urls[activeImage]}
                  alt={detail.name}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = "none"
                  }}
                  style={{
                    width: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "contain",
                    background: "var(--brand-subtle)",
                  }}
                />
              </button>
            )}

            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "var(--brand-ink)",
                letterSpacing: "-0.02em",
                marginBottom: 8,
              }}
            >
              {detail.name}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {detail.primary_muscles.map((m) => (
                <span
                  key={m}
                  style={{
                    background: "var(--brand-subtle)",
                    color: "var(--brand-orange-deep)",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {m}
                </span>
              ))}
              {detail.secondary_muscles.map((m) => (
                <span
                  key={m}
                  style={{
                    background: "var(--brand-surface)",
                    color: "var(--brand-muted)",
                    border: "1px solid var(--brand-border)",
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {m}
                </span>
              ))}
            </div>

            {detail.equipment.length > 0 && (
              <div style={{ fontSize: 12, color: "var(--brand-muted)", marginBottom: 14 }}>
                Utstyr: {detail.equipment.join(", ")}
              </div>
            )}

            {detail.instructions && (
              <div
                style={{
                  fontSize: 14,
                  color: "var(--brand-ink)",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  marginBottom: 18,
                }}
              >
                {detail.instructions}
              </div>
            )}

            {onPick && (
              <button
                type="button"
                onClick={() => onPick(detail.id)}
                style={{
                  width: "100%",
                  background: "var(--brand-orange)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: 14,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Legg til denne
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
