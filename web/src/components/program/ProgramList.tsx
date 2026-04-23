"use client"

import { useEffect, useState } from "react"
import { getPrograms, deleteProgram, type Program } from "@/lib/api"
import ProgramDetail from "./ProgramDetail"

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
  </svg>
)

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

  async function handleDeleteProgram(programId: string) {
    try {
      await deleteProgram(programId)
      setPrograms((prev) => prev.filter((p) => p.id !== programId))
    } catch (err) {
      console.error("Failed to delete program:", err)
    }
  }

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
        <div key={p.id} className="bg-card border rounded-lg flex items-center overflow-hidden">
          <button
            onClick={() => setSelectedId(p.id)}
            className="flex-1 p-3 text-left hover:bg-accent transition-colors"
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
          <button
            onClick={() => handleDeleteProgram(p.id)}
            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            aria-label={`Slett ${p.name}`}
          >
            <TrashIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
