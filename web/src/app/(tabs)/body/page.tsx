"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getBodyMetrics, createBodyMetric, deleteBodyMetric, type BodyMetric } from "@/lib/api"

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("no-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function MiniChart({ points }: { points: number[] }) {
  if (points.length < 2) return null
  const w = 300
  const h = 80
  const padding = 8
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = Math.max(max - min, 0.5)
  const xStep = (w - 2 * padding) / (points.length - 1)
  const path = points
    .map((v, i) => {
      const x = padding + i * xStep
      const y = padding + (h - 2 * padding) * (1 - (v - min) / range)
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(" ")
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 80, marginTop: 6 }}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--brand-orange)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((v, i) => {
        const x = padding + i * xStep
        const y = padding + (h - 2 * padding) * (1 - (v - min) / range)
        return <circle key={i} cx={x} cy={y} r={2.5} fill="var(--brand-orange)" />
      })}
    </svg>
  )
}

export default function BodyMetricsPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [weight, setWeight] = useState("")
  const [bf, setBf] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBodyMetrics()
      .then(setMetrics)
      .catch(() => setMetrics([]))
  }, [])

  const handleSave = async () => {
    setError(null)
    const w = weight.trim() === "" ? null : Number(weight)
    const b = bf.trim() === "" ? null : Number(bf)
    if (w === null && b === null) {
      setError("Skriv inn vekt eller fettprosent")
      return
    }
    setSaving(true)
    try {
      const created = await createBodyMetric({
        weight_kg: w,
        body_fat_pct: b,
        notes: notes.trim() || null,
      })
      setMetrics([created, ...metrics])
      setWeight("")
      setBf("")
      setNotes("")
    } catch {
      setError("Kunne ikke lagre")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Slett denne målingen?")) return
    try {
      await deleteBodyMetric(id)
      setMetrics(metrics.filter((m) => m.id !== id))
    } catch {
      setError("Kunne ikke slette")
    }
  }

  // Build chart of weights (chronological)
  const chartWeights = metrics
    .filter((m) => m.weight_kg !== null)
    .map((m) => m.weight_kg as number)
    .reverse()

  return (
    <div style={{ padding: 20, background: "var(--brand-canvas)", minHeight: "100%" }}>
      <Link
        href="/profile"
        style={{
          color: "var(--brand-orange)",
          fontSize: 13,
          textDecoration: "none",
          display: "inline-block",
          marginBottom: 14,
        }}
      >
        ← Profil
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>
        Kropp
      </h1>

      {/* Quick-add form */}
      <div
        style={{
          background: "var(--brand-surface)",
          border: "1px solid var(--brand-border)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--brand-muted)",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Logg ny måling
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <label style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Vekt (kg)
            </span>
            <input
              type="number"
              inputMode="decimal"
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="82.5"
              style={inputStyle}
            />
          </label>
          <label style={{ flex: 1 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Fett % <span style={{ fontWeight: 400, opacity: 0.7 }}>(valgfri)</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              step={0.1}
              value={bf}
              onChange={(e) => setBf(e.target.value)}
              placeholder="18.5"
              style={inputStyle}
            />
          </label>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notat (valgfri)"
          rows={2}
          maxLength={500}
          style={{ ...inputStyle, resize: "vertical", minHeight: 50 }}
        />
        {error && <div style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}>{error}</div>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            marginTop: 10,
            background: "var(--brand-orange)",
            color: "white",
            border: "none",
            borderRadius: 10,
            padding: "10px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Lagrer…" : "Lagre"}
        </button>
      </div>

      {/* Chart */}
      {chartWeights.length >= 2 && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--brand-muted)",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            Vekt over tid
          </div>
          <MiniChart points={chartWeights} />
        </div>
      )}

      {/* List */}
      {metrics.length === 0 ? (
        <div
          style={{ textAlign: "center", color: "var(--brand-muted)", marginTop: 40, fontSize: 14 }}
        >
          Ingen målinger enda. Logg den første over.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {metrics.map((m) => (
            <div
              key={m.id}
              style={{
                background: "var(--brand-surface)",
                border: "1px solid var(--brand-border)",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {m.weight_kg !== null && `${m.weight_kg} kg`}
                  {m.weight_kg !== null && m.body_fat_pct !== null && " · "}
                  {m.body_fat_pct !== null && `${m.body_fat_pct}% fett`}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--brand-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {fmtDate(m.recorded_at)}
                </div>
                {m.notes && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--brand-muted)",
                      marginTop: 4,
                      fontStyle: "italic",
                    }}
                  >
                    {m.notes}
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label="Slett"
                onClick={() => handleDelete(m.id)}
                style={{
                  background: "transparent",
                  border: "1px solid var(--brand-border)",
                  borderRadius: 6,
                  color: "var(--brand-muted)",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid var(--brand-border)",
  borderRadius: 8,
  background: "white",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
}
