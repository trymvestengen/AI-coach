#!/usr/bin/env npx tsx
/**
 * Engangsscript — henter øvelser fra wger.de og genererer web/src/lib/exercises.ts
 * Kjør: npx tsx scripts/fetch-exercises.ts
 */
import { writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = "https://wger.de/api/v2"

// wger muscle ID → vår MuscleKey
const MUSCLE_KEY: Record<number, string> = {
  1:  "biceps",    // Biceps brachii
  2:  "shoulders", // Anterior deltoid
  3:  "chest",     // Serratus anterior
  4:  "chest",     // Pectoralis major
  5:  "hamstrings",// Biceps femoris
  6:  "calves",    // Gastrocnemius
  7:  "glutes",    // Gluteus maximus
  8:  "upperBack", // Trapezius
  9:  "quads",     // Quadriceps femoris
  10: "abs",       // Rectus abdominis
  11: "biceps",    // Brachialis
  12: "triceps",   // Triceps brachii
  13: "shoulders", // Posterior deltoid
  14: "calves",    // Soleus
  15: "lats",      // Latissimus dorsi
  16: "lowerBack", // Erector spinae
  17: "forearms",  // Brachioradialis
}

// wger equipment ID → displaynavn
const EQUIP: Record<number, string> = {
  1:  "Barbell",
  2:  "Barbell",
  3:  "Dumbbell",
  4:  "Bodyweight",
  5:  "Machine",
  6:  "Bodyweight",
  7:  "Bodyweight",
  8:  "Bodyweight",
  9:  "Machine",
  10: "Cable",
  11: "Machine",
  12: "Barbell",
  13: "Cable",
  14: "Dumbbell",
}

// wger category ID → primary display name (fallback if no muscle data)
const CATEGORY_PRIMARY: Record<number, string> = {
  8:  "Arms",
  9:  "Legs",
  10: "Abs",
  11: "Chest",
  12: "Back",
  13: "Shoulders",
  14: "Calves",
  15: "Glutes",
}

// Muscles on the front of the body
const FRONT_KEYS = new Set(["chest", "shoulders", "abs", "quads", "biceps", "forearms"])

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
}

async function fetchAll(url: string): Promise<any[]> {
  const results: any[] = []
  let next: string | null = url
  while (next) {
    const res = await fetch(next)
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${next}`)
    const data = await res.json()
    results.push(...(data.results ?? []))
    next = data.next ?? null
    if (next) await new Promise(r => setTimeout(r, 300))
    process.stdout.write(`\r  Hentet ${results.length} øvelser...`)
  }
  console.log()
  return results
}

async function main() {
  console.log("Henter øvelser fra wger.de...")

  const raw = await fetchAll(
    `${BASE}/exerciseinfo/?format=json&language=2&limit=100`
  )
  console.log(`Totalt hentet: ${raw.length} oppføringer`)

  const seen = new Set<string>()
  const exercises: any[] = []

  for (const e of raw) {
    const enTranslation = (e.translations ?? []).find((t: any) => t.language === 2)
    const name = enTranslation?.name?.trim()
    if (!name) continue

    const id = slugify(name)
    if (!id || seen.has(id)) continue
    seen.add(id)

    const primaryMuscle = (e.muscles ?? [])[0]
    const primaryKey = primaryMuscle ? (MUSCLE_KEY[primaryMuscle.id] ?? null) : null
    const primaryName = primaryMuscle?.name_en
      ?? CATEGORY_PRIMARY[e.category?.id]
      ?? "General"

    const secondaryMuscles = e.muscles_secondary ?? []
    const secondaryKeys = secondaryMuscles
      .map((m: any) => MUSCLE_KEY[m.id])
      .filter(Boolean)
    const secondaryNames = secondaryMuscles
      .map((m: any) => m.name_en)
      .filter(Boolean)

    const highlight = [...new Set([
      ...(primaryKey ? [primaryKey] : []),
      ...secondaryKeys,
    ])]

    const view = primaryKey && FRONT_KEYS.has(primaryKey) ? "front" : "back"

    const equipObj = (e.equipment ?? [])[0]
    const equipment = equipObj ? (EQUIP[equipObj.id] ?? "Bodyweight") : "Bodyweight"

    const description = enTranslation?.description
      ? stripHtml(enTranslation.description)
      : ""

    exercises.push({
      id,
      name,
      equipment,
      primary: primaryName,
      secondary: secondaryNames,
      highlight,
      view,
      description,
      tips: [],
      pr: "",
      lastUsed: "",
      lastWeight: "",
    })
  }

  console.log(`Behandlet ${exercises.length} unike øvelser`)

  const ts = `// AUTO-GENERATED av scripts/fetch-exercises.ts — ikke rediger manuelt
// Kjør: npx tsx scripts/fetch-exercises.ts for å regenerere

export type MuscleKey =
  | "chest" | "shoulders" | "triceps" | "biceps" | "forearms"
  | "upperBack" | "lats" | "lowerBack"
  | "abs" | "glutes" | "quads" | "hamstrings" | "calves"

export interface Exercise {
  id: string
  name: string
  equipment: string
  primary: string
  secondary: string[]
  highlight: MuscleKey[]
  view: "front" | "back"
  description: string
  tips: string[]
  pr: string
  lastUsed: string
  lastWeight: string
}

export const EXERCISES: Exercise[] = ${JSON.stringify(exercises, null, 2)} as Exercise[]

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id)
}

export const MUSCLE_GROUPS = [
  "Alle",
  "Bryst",
  "Rygg",
  "Skuldre",
  "Biceps",
  "Triceps",
  "Bein",
  "Glutes",
  "Mage",
] as const

export type MuscleGroup = typeof MUSCLE_GROUPS[number]

const MUSCLE_GROUP_MAP: Record<MuscleGroup, string[]> = {
  "Alle": [],
  "Bryst": ["Chest", "Pectoralis major", "Serratus anterior"],
  "Rygg": ["Upper Back", "Lats", "Lower Back", "Trapezius", "Latissimus dorsi", "Erector spinae"],
  "Skuldre": ["Shoulders", "Anterior deltoid", "Posterior deltoid"],
  "Biceps": ["Biceps", "Biceps brachii", "Brachialis"],
  "Triceps": ["Triceps", "Triceps brachii"],
  "Bein": ["Quads", "Hamstrings", "Calves", "Quadriceps femoris", "Biceps femoris", "Gastrocnemius", "Soleus"],
  "Glutes": ["Glutes", "Gluteus maximus"],
  "Mage": ["Abs", "Rectus abdominis"],
}

export function filterExercises(group: MuscleGroup, query: string): Exercise[] {
  const q = query.toLowerCase().trim()
  return EXERCISES.filter(e => {
    const matchesGroup = group === "Alle" || MUSCLE_GROUP_MAP[group].some(m =>
      e.primary.toLowerCase().includes(m.toLowerCase())
    )
    const matchesQuery =
      q === "" ||
      e.name.toLowerCase().includes(q) ||
      e.primary.toLowerCase().includes(q)
    return matchesGroup && matchesQuery
  })
}
`

  const outPath = join(__dirname, "../web/src/lib/exercises.ts")
  writeFileSync(outPath, ts, "utf-8")
  console.log(`Skrevet til ${outPath}`)
  console.log("Ferdig!")
}

main().catch(e => { console.error(e); process.exit(1) })
