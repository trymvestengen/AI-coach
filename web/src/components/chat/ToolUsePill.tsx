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
      className="self-center text-xs text-neutral-400 bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1 my-2 flex items-center gap-2 w-fit mx-auto"
    >
      <span>{label}</span>
      {state === "running" && (
        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
      )}
      {state === "done" && <span className="text-green-400">✓</span>}
      {state === "error" && <span className="text-red-400">✗</span>}
    </div>
  )
}
