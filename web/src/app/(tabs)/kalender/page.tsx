import { redirect } from "next/navigation"

// Kalender er skjult i mal-modellen (ingen ukeplan ennå). Ruta omdirigeres til
// Hjem til vi designer et ekte plan-/mal-kalender-konsept. Den gamle program-
// baserte kalenderen ligger i git-historikk (commit før B-3.4).
export default function CalendarPage() {
  redirect("/home")
}
