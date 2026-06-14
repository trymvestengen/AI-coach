"use client"
import { useEffect, useMemo, useState } from "react"
import { getExercises, setExerciseFavorite, type Exercise } from "@/lib/api"
import NewExerciseSheet from "./NewExerciseSheet"

interface Props {
  open: boolean
  excludeIds?: string[]
  onClose: () => void
  onConfirm: (exerciseIds: string[]) => void
}

const MUSCLES = ["Alle", "chest", "back", "legs", "shoulders", "arms", "core"]
const MUSCLE_NO: Record<string, string> = {
  chest: "Bryst",
  back: "Rygg",
  legs: "Bein",
  shoulders: "Skuldre",
  arms: "Armer",
  core: "Core",
}
type Sort = "az" | "recent" | "fav"

export default function ExercisePicker({ open, excludeIds = [], onClose, onConfirm }: Props) {
  const [all, setAll] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [muscle, setMuscle] = useState("Alle")
  const [sort, setSort] = useState<Sort>("az")
  const [selected, setSelected] = useState<string[]>([])
  const [favs, setFavs] = useState<Record<string, boolean>>({})
  const [newOpen, setNewOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    getExercises()
      .then((ex) => {
        if (cancelled) return
        setAll(ex)
        setFavs(Object.fromEntries(ex.map((e) => [e.id, !!e.is_favorite])))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const visible = useMemo(() => {
    let list = all
    if (muscle !== "Alle") list = list.filter((e) => e.primary_muscles.includes(muscle))
    if (q.trim()) {
      const needle = q.toLowerCase()
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(needle) ||
          e.primary_muscles.some((m) => m.toLowerCase().includes(needle))
      )
    }
    const sorted = [...list]
    if (sort === "az") sorted.sort((a, b) => a.name.localeCompare(b.name, "no"))
    if (sort === "recent")
      sorted.sort((a, b) => (b.last_used ?? "").localeCompare(a.last_used ?? ""))
    if (sort === "fav") sorted.sort((a, b) => Number(favs[b.id]) - Number(favs[a.id]))
    return sorted
  }, [all, muscle, q, sort, favs])

  if (!open) return null

  const toggle = (id: string) => {
    if (excludeIds.includes(id)) return
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  const toggleFav = async (e: Exercise) => {
    const next = !favs[e.id]
    setFavs((f) => ({ ...f, [e.id]: next }))
    try {
      await setExerciseFavorite(e.id, next)
    } catch {
      setFavs((f) => ({ ...f, [e.id]: !next }))
    }
  }

  return (
    <div
      data-testid="picker-overlay"
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="forge"
        onClick={(e) => e.stopPropagation()}
        style={{
          marginTop: "auto",
          height: "92%",
          background: "var(--brand-canvas)",
          color: "var(--brand-ink)",
          borderRadius: "20px 20px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span className="display-title" style={{ fontSize: 18 }}>
            Legg til øvelse
          </span>
          <button
            type="button"
            aria-label="Lukk"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--brand-muted)",
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "0 18px 8px" }}>
          <input
            aria-label="Søk øvelse"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Søk øvelse…"
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "var(--brand-subtle)",
              border: "1px solid var(--brand-border)",
              borderRadius: 12,
              padding: "11px 13px",
              color: "var(--brand-ink)",
              fontSize: 14,
            }}
          />
          <div style={{ display: "flex", gap: 7, overflowX: "auto", marginTop: 10 }}>
            {MUSCLES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMuscle(m)}
                className={`chip${muscle === m ? " active" : ""}`}
                style={{
                  flex: "none",
                  padding: "7px 12px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: muscle === m ? "var(--brand-orange)" : "var(--brand-subtle)",
                  color: muscle === m ? "#fff" : "var(--brand-ink)",
                  border: `1px solid ${muscle === m ? "var(--brand-orange)" : "var(--brand-border)"}`,
                }}
              >
                {m === "Alle" ? "Alle" : (MUSCLE_NO[m] ?? m)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {(["az", "recent", "fav"] as Sort[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  color: sort === s ? "var(--brand-orange)" : "var(--brand-muted)",
                }}
              >
                {s === "az" ? "A–Å" : s === "recent" ? "Nylig" : "Favoritter"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 18px 12px" }}>
          {loading ? (
            <div style={{ textAlign: "center", color: "var(--brand-muted)", padding: 24 }}>
              Laster…
            </div>
          ) : (
            visible.map((e) => {
              const sel = selected.includes(e.id)
              const already = excludeIds.includes(e.id)
              return (
                <div
                  key={e.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 2px",
                    borderBottom: "1px solid var(--brand-border)",
                  }}
                >
                  <button
                    type="button"
                    aria-label={`Velg ${e.name}`}
                    disabled={already}
                    onClick={() => toggle(e.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 7,
                      flex: "none",
                      cursor: already ? "default" : "pointer",
                      opacity: already ? 0.4 : 1,
                      border: `1.5px solid ${sel ? "var(--brand-orange)" : "var(--brand-border)"}`,
                      background: sel ? "var(--brand-orange)" : "var(--brand-subtle)",
                      color: "#fff",
                      fontSize: 13,
                    }}
                  >
                    {sel ? "✓" : ""}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{e.name}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color: e.is_custom ? "var(--brand-orange)" : "var(--brand-muted)",
                      }}
                    >
                      {e.is_custom
                        ? "Egen øvelse"
                        : `${MUSCLE_NO[e.primary_muscles[0]] ?? e.primary_muscles[0] ?? ""}${e.equipment[0] ? ` · ${e.equipment[0]}` : ""}`}
                      {already ? " · lagt til" : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Favoritt ${e.name}`}
                    onClick={() => toggleFav(e)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 15,
                      color: favs[e.id] ? "var(--brand-orange)" : "var(--brand-faint)",
                    }}
                  >
                    {favs[e.id] ? "★" : "☆"}
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div style={{ padding: "12px 18px 16px", borderTop: "1px solid var(--brand-border)" }}>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            style={{
              width: "100%",
              background: "none",
              border: "1px dashed var(--brand-border)",
              borderRadius: 12,
              padding: 12,
              fontSize: 13,
              fontWeight: 700,
              color: "var(--brand-orange)",
              cursor: "pointer",
              marginBottom: 8,
            }}
          >
            + Lag ny øvelse
          </button>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onConfirm(selected)}
            className="btn btn-primary btn-block"
            style={{ opacity: selected.length === 0 ? 0.5 : 1 }}
          >
            Legg til {selected.length || ""} {selected.length === 1 ? "valgt" : "valgte"}{" "}
            <span className="arrow">→</span>
          </button>
        </div>
      </div>
      <NewExerciseSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => {
          setNewOpen(false)
          getExercises()
            .then((ex) => {
              setAll(ex)
              setFavs(Object.fromEntries(ex.map((e) => [e.id, !!e.is_favorite])))
              setSelected((s) => (s.includes(id) ? s : [...s, id]))
            })
            .catch(() => {})
        }}
      />
    </div>
  )
}
