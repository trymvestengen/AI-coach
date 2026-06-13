"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { getBodyMetrics, createBodyMetric, deleteBodyMetric, type BodyMetric } from "@/lib/api"
import ThemeToggle from "@/components/theme/ThemeToggle"

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

function todayDateInput(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export default function BodyMetricsPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [weight, setWeight] = useState("")
  const [bf, setBf] = useState("")
  const [notes, setNotes] = useState("")
  const [date, setDate] = useState(() => todayDateInput())
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
      // Send midnight of selected date so it sorts as that day
      const isoDate = date !== todayDateInput() ? new Date(`${date}T12:00:00`).toISOString() : null
      const created = await createBodyMetric({
        weight_kg: w,
        body_fat_pct: b,
        notes: notes.trim() || null,
        recorded_at: isoDate,
      })
      // Re-fetch so list is sorted by recorded_at DESC (the new row might not be newest)
      const fresh = await getBodyMetrics().catch(() => [created, ...metrics])
      setMetrics(fresh)
      setWeight("")
      setBf("")
      setNotes("")
      setDate(todayDateInput())
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
  const withWeight = metrics.filter((m) => m.weight_kg !== null)
  const chartWeights = withWeight.map((m) => m.weight_kg as number).reverse()
  const latestWeight = withWeight[0]?.weight_kg ?? null
  const latestBf = metrics.find((m) => m.body_fat_pct !== null)?.body_fat_pct ?? null
  // Month delta: newest weight minus the closest measurement ≥ ~28 days older.
  const monthDelta = (() => {
    if (latestWeight === null || withWeight.length < 2) return null
    const newest = new Date(withWeight[0].recorded_at ?? 0).getTime()
    const older = withWeight.find(
      (m) => newest - new Date(m.recorded_at ?? 0).getTime() >= 28 * 86_400_000
    )
    const ref = older ?? withWeight[withWeight.length - 1]
    if (ref.weight_kg === null || ref.id === withWeight[0].id) return null
    return latestWeight - ref.weight_kg
  })()

  return (
    <div
      className="screen forge"
      style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
    >
      <div className="app-topbar" style={{ padding: "16px 20px 4px" }}>
        <Link href="/profile" className="section-link" style={{ fontSize: 13 }}>
          ‹ Profil
        </Link>
        <div className="datebar">
          <span className="tick" />
          Kroppsdata
        </div>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px" }}>
        {/* Current weight */}
        <div className="eyebrow" style={{ marginTop: 8 }}>
          Nåværende vekt
        </div>
        <div className="display-title tnum" style={{ marginTop: 10, fontSize: 40 }}>
          {latestWeight !== null ? `${latestWeight} kg` : "—"}
        </div>
        {monthDelta !== null && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginTop: 10,
              fontSize: 13,
              color: monthDelta <= 0 ? "var(--success)" : "var(--brand-muted)",
            }}
          >
            <span className="tnum">
              {monthDelta > 0 ? "+" : "−"}
              {Math.abs(monthDelta).toFixed(1)} kg
            </span>
            <span style={{ color: "var(--brand-muted)" }}>siste måned</span>
          </div>
        )}

        {/* Trend */}
        {chartWeights.length >= 2 && (
          <div className="panel" style={{ marginTop: 18, padding: "16px 14px 12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span className="eyebrow" style={{ letterSpacing: "0.14em" }}>
                Vekt over tid
              </span>
              <span className="tnum" style={{ fontSize: 11, color: "var(--brand-muted)" }}>
                {chartWeights.length} målinger
              </span>
            </div>
            <MiniChart points={chartWeights} />
          </div>
        )}

        {/* Stat tiles */}
        <div className="stat-grid" style={{ marginTop: 14 }}>
          <div className="stat-tile">
            <div className="v tnum">{latestWeight ?? "—"}</div>
            <div className="l">Vekt (kg)</div>
          </div>
          <div className="stat-tile">
            <div className="v tnum">{latestBf !== null ? `${latestBf}%` : "—"}</div>
            <div className="l">Kroppsfett</div>
          </div>
          <div className="stat-tile accent">
            <div className="v tnum">
              {monthDelta !== null
                ? `${monthDelta > 0 ? "+" : "−"}${Math.abs(monthDelta).toFixed(1)}`
                : "—"}
            </div>
            <div className="l">Trend / md</div>
          </div>
        </div>

        {/* Quick-add form */}
        <div className="panel" style={{ marginTop: 18, marginBottom: 18 }}>
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
          <label style={{ display: "block", marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--brand-muted)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Dato
            </span>
            <input
              type="date"
              value={date}
              max={todayDateInput()}
              onChange={(e) => setDate(e.target.value)}
              style={inputStyle}
            />
          </label>
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

        {/* Recent registrations */}
        <div className="section-head">
          <span className="section-label">Siste registreringer</span>
        </div>
        {metrics.length === 0 ? (
          <div
            style={{ textAlign: "center", color: "var(--brand-muted)", marginTop: 8, fontSize: 14 }}
          >
            Ingen målinger enda. Logg den første over.
          </div>
        ) : (
          <div className="panel-list">
            {metrics.map((m) => (
              <div key={m.id} className="list-row">
                <div className="row-main">
                  <div className="row-name tnum">
                    {m.weight_kg !== null && `${m.weight_kg} kg`}
                    {m.weight_kg !== null && m.body_fat_pct !== null && " · "}
                    {m.body_fat_pct !== null && `${m.body_fat_pct}% fett`}
                  </div>
                  <div className="row-meta" style={{ textTransform: "capitalize" }}>
                    {fmtDate(m.recorded_at)}
                  </div>
                  {m.notes && (
                    <div className="row-meta" style={{ fontStyle: "italic" }}>
                      {m.notes}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Slett"
                  onClick={() => handleDelete(m.id)}
                  style={{
                    flex: "none",
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

        <div className="footnote">AI Coach · Kroppsdata</div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1px solid var(--brand-border)",
  borderRadius: 8,
  background: "var(--brand-surface)",
  color: "var(--brand-ink)",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
}
