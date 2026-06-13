export interface ToolLabel {
  in_progress: string
  done: string
  emoji: string
}

export const TOOL_LABELS: Record<string, ToolLabel> = {
  create_program: { in_progress: "Lager program", done: "Laget program", emoji: "💪" },
  update_program: { in_progress: "Oppdaterer program", done: "Oppdatert", emoji: "✏️" },
  delete_program: { in_progress: "Sletter program", done: "Slettet", emoji: "🗑" },
  add_program_day: { in_progress: "Legger til dag", done: "Lagt til dag", emoji: "➕" },
  remove_program_day: { in_progress: "Fjerner dag", done: "Fjernet dag", emoji: "➖" },
  rename_program_day: { in_progress: "Endrer navn", done: "Endret navn", emoji: "✏️" },
  add_exercise_to_day: { in_progress: "Legger til øvelse", done: "Lagt til øvelse", emoji: "➕" },
  remove_exercise_from_day: { in_progress: "Fjerner øvelse", done: "Fjernet øvelse", emoji: "➖" },
  swap_exercise_in_day: { in_progress: "Bytter øvelse", done: "Byttet øvelse", emoji: "🔄" },
  update_exercise_sets: { in_progress: "Oppdaterer sett", done: "Oppdatert", emoji: "✏️" },
  create_folder: { in_progress: "Lager mappe", done: "Laget mappe", emoji: "📁" },
  rename_folder: { in_progress: "Endrer mappenavn", done: "Endret", emoji: "📁" },
  delete_folder: { in_progress: "Sletter mappe", done: "Slettet mappe", emoji: "🗑" },
  list_folders: { in_progress: "Henter mapper", done: "Mapper hentet", emoji: "📁" },
  log_workout: { in_progress: "Logger økt", done: "Logget økt", emoji: "📝" },
  log_set_with_note: { in_progress: "Logger sett", done: "Logget sett", emoji: "📝" },
  start_workout_from_day: { in_progress: "Starter økt", done: "Startet økt", emoji: "▶️" },
  complete_workout: { in_progress: "Fullfører økt", done: "Fullført", emoji: "✓" },
  discard_workout: { in_progress: "Forkaster økt", done: "Forkastet", emoji: "🗑" },
  swap_active_workout_exercise: { in_progress: "Bytter øvelse", done: "Byttet", emoji: "🔄" },
  add_active_workout_exercise: { in_progress: "Legger til", done: "Lagt til", emoji: "➕" },
  update_user_profile: { in_progress: "Lagrer profil", done: "Lagret profil", emoji: "👤" },
  set_persona_mode: {
    in_progress: "Bytter personlighet",
    done: "Byttet personlighet",
    emoji: "🎭",
  },
  add_injury: { in_progress: "Lagrer skade", done: "Lagret skade", emoji: "🩹" },
  update_injury: { in_progress: "Oppdaterer skade", done: "Oppdatert", emoji: "🩹" },
  remove_injury: { in_progress: "Fjerner skade", done: "Markert som leget", emoji: "✓" },
  add_equipment: { in_progress: "Lagrer utstyr", done: "Lagt til utstyr", emoji: "🏋️" },
  remove_equipment: { in_progress: "Fjerner utstyr", done: "Fjernet", emoji: "🏋️" },
  add_preference: { in_progress: "Lagrer preferanse", done: "Lagret", emoji: "⭐" },
  remove_preference: { in_progress: "Fjerner", done: "Fjernet", emoji: "⭐" },
  add_constraint: { in_progress: "Lagrer begrensning", done: "Lagret", emoji: "🚧" },
  remove_constraint: { in_progress: "Fjerner", done: "Fjernet", emoji: "🚧" },
  share_workout: { in_progress: "Deler økt", done: "Delt", emoji: "📣" },
}

const SILENT_TOOLS = new Set([
  "get_user_profile",
  "get_workout_history",
  "get_progression",
  "get_recent_sessions",
  "get_exercise_info",
  "search_exercises",
  "search_observations",
  "get_user_history",
  "suggest_progression",
  "write_observation", // memory tool — quiet
])

export function shouldShowPill(name: string): boolean {
  return !SILENT_TOOLS.has(name) && name in TOOL_LABELS
}
