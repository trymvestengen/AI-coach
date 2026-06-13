"use client"

import { useState, useEffect } from "react"
import { getExercises, type Exercise } from "@/lib/api"
import ExerciseDetailModal from "@/components/exercises/ExerciseDetailModal"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { SearchIcon } from "@/components/ui/icons"

const MUSCLE_GROUPS = ["Alle", "Chest", "Back", "Shoulders", "Arms", "Legs", "Core"]

export default function ExercisesPage() {
  const [group, setGroup] = useState("Alle")
  const [query, setQuery] = useState("")
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    // TODO(frontend-lint-debt): setState calls inside effect are intentional here (async data fetch)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const mg = group === "Alle" ? undefined : group
    getExercises(mg)
      .then(setExercises)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [group])

  const filtered = query.trim()
    ? exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query.toLowerCase()) ||
          ex.primary_muscles.some((m) => m.toLowerCase().includes(query.toLowerCase()))
      )
    : exercises

  function handleSelect(ex: Exercise) {
    setSelectedId(ex.id)
  }

  const today = new Date().toLocaleDateString("no-NO", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div
      className="screen forge"
      style={{ background: "var(--brand-canvas)", color: "var(--brand-ink)" }}
    >
      <div className="app-topbar" style={{ padding: "16px 20px 4px" }}>
        <div className="datebar">
          <span className="tick" />
          {today}
        </div>
        <ThemeToggle />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "6px 20px 24px" }}>
        {/* Header */}
        <div className="section-head" style={{ margin: "8px 0 14px" }}>
          <div className="section-label">
            <span className="display-title" style={{ display: "block", fontSize: 36 }}>
              Øvelser
            </span>
            <span
              className="meta"
              style={{ display: "block", marginTop: 8, textTransform: "none", letterSpacing: 0 }}
            >
              {loading ? (
                "Laster…"
              ) : (
                <>
                  <span className="tnum">{filtered.length}</span> øvelser
                </>
              )}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="input-row" style={{ marginBottom: 14 }}>
          <SearchIcon size={16} />
          <input
            className="field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk etter øvelse…"
            aria-label="Søk etter øvelse"
          />
        </div>

        {/* Muscle group filter */}
        <div
          className="chip-row"
          style={{ flexWrap: "nowrap", overflowX: "auto", marginBottom: 18 }}
        >
          {MUSCLE_GROUPS.map((g) => {
            const active = group === g
            return (
              <button
                key={g}
                onClick={() => setGroup(g)}
                aria-pressed={active}
                aria-label={`Filter: ${g}`}
                className={`chip${active ? " active" : ""}`}
                style={{ flexShrink: 0 }}
              >
                {g}
              </button>
            )
          })}
        </div>

        {/* Exercise list */}
        {loading ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--brand-faint)",
              fontSize: 14,
            }}
          >
            Laster øvelser…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: "32px 16px",
              textAlign: "center",
              color: "var(--brand-faint)",
              fontSize: 14,
            }}
          >
            Ingen øvelser funnet
          </div>
        ) : (
          <div className="panel-list">
            {filtered.map((ex) => {
              const cat = ex.primary_muscles[0] ?? ex.muscle_groups[0] ?? ""
              return (
                <button
                  key={ex.id}
                  onClick={() => handleSelect(ex)}
                  aria-label={`Se detaljer for ${ex.name}`}
                  className="list-row"
                  style={{ cursor: "pointer", textAlign: "left", width: "100%" }}
                >
                  <div className="row-main">
                    <div className="row-name">{ex.name}</div>
                    <div className="row-meta">
                      {cat}
                      {ex.equipment[0] ? ` · ${ex.equipment[0]}` : ""}
                    </div>
                  </div>
                  {cat && <span className="pr-badge">{cat}</span>}
                </button>
              )
            })}
          </div>
        )}

        <div className="footnote">AI Coach · Øvelsesbibliotek</div>
      </div>

      {/* Detail modal */}
      <ExerciseDetailModal exerciseId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}
