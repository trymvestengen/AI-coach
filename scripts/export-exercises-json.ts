#!/usr/bin/env npx tsx
import { writeFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { EXERCISES } from "../web/src/lib/exercises.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

const out = EXERCISES.map(e => ({
  id: e.id,
  name: e.name,
  muscle_groups: [e.primary, ...e.secondary],
  equipment: [e.equipment],
  difficulty: "intermediate",
  instructions: e.description || null,
}))

const outPath = join(__dirname, "../api/db/exercises_wger.json")
writeFileSync(outPath, JSON.stringify(out, null, 2), "utf-8")
console.log(`Written ${out.length} exercises to ${outPath}`)
