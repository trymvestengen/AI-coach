const TOOL_LABELS: Record<string, string> = {
  get_user_profile: "👤 Sjekker profilen din",
  get_workout_history: "🔍 Henter treningshistorikk",
  get_recent_sessions: "💬 Sjekker tidligere samtaler",
  get_progression: "📈 Henter progresjon",
  search_observations: "🧠 Søker i tidligere observasjoner",
  write_observation: "📝 Noterer observasjon",
  log_set_with_note: "💾 Logger sett",
  log_workout: "💾 Logger økten",
  create_program: "🏋️ Lager program",
  get_exercise_info: "ℹ️ Slår opp øvelse",
  search_exercises: "🔎 Søker etter øvelser",
}

interface Props {
  toolName: string
  state: "running" | "done" | "error"
}

export default function ToolUsePill({ toolName, state }: Props) {
  const label = TOOL_LABELS[toolName] ?? `🔧 ${toolName}`
  return (
    <div
      role="status"
      className="self-center text-xs my-2 flex items-center gap-2 w-fit mx-auto px-3 py-1 rounded-full"
      style={{
        background: "var(--brand-subtle)",
        border: "1px solid var(--brand-border)",
        color: "var(--brand-muted)",
      }}
    >
      <span>{label}</span>
      {state === "running" && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "var(--brand-orange)" }}
        />
      )}
      {state === "done" && <span style={{ color: "var(--success)" }}>✓</span>}
      {state === "error" && <span style={{ color: "var(--danger)" }}>✗</span>}
    </div>
  )
}
