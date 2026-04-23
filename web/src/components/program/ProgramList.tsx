"use client"

import { useEffect, useState } from "react"
import { getPrograms, type Program } from "@/lib/api"
import ProgramDetail from "./ProgramDetail"

export default function ProgramList() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    getPrograms()
      .then(setPrograms)
      .catch((err) => console.error("Failed to fetch programs:", err))
      .finally(() => setLoading(false))
  }, [])

  if (selectedId) {
    return <ProgramDetail programId={selectedId} onBack={() => setSelectedId(null)} />
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm p-4">Laster programmer...</p>
  }

  if (programs.length === 0) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground text-sm">
          Ingen programmer enda. Be coachen lage et program for deg!
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {programs.map((p) => (
        <button
          key={p.id}
          onClick={() => setSelectedId(p.id)}
          className="bg-card border rounded-lg p-3 text-left hover:bg-accent transition-colors"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.days_count} dager</p>
            </div>
            {p.is_active && (
              <span className="text-xs text-green-500 font-medium">Aktiv</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}
