# Exercise library upgrade

> **Status:** Design (godkjent 2026-06-06)
> **Scope:** Bytt ut dagens øvelses-bibliotek (15 lokale + 855 WGER uten bilder) med Free Exercise DB (yuhonas/free-exercise-db) — 870 øvelser med 2 statiske JPG-er per øvelse, lenket direkte til GitHub raw URLs. Coach leser fra DB i stedet for lokal JSON. Frontend får bilder i 3 flater: picker, program-detalj, og ny ExerciseDetailModal.

## Bakgrunn

Coachen kunne ikke bygge meningsfulle programmer fordi øvelses-biblioteket var for tynt:

- `api/app/data/exercises.json` — 15 øvelser. Coach reads from this.
- `api/db/exercises_wger.json` — 855 øvelser i DB. Ingen bilder. Ikke synlig for coach.
- `web/src/lib/exercises.ts` — 15428 linjer hardkodet frontend-data. Stale.

Dagens orkestrering feiler delvis fordi modellen ikke har nok øvelser å lage realistiske programmer fra. Bedre data + bilder gjør appen umiddelbart mer nyttig.

Free Exercise DB (MIT-lisens) er valgt som datakilde fordi den dekker 870 øvelser med konsistent struktur, har 2 statiske JPG-er per øvelse (start + slutt-posisjon), og er kuratert. Vi referer GitHub raw URLs direkte i denne første runden — kan mirrores til Supabase Storage senere hvis nødvendig. Animerte GIF-er (ExerciseDB via RapidAPI) er køet som follow-up i [memory/exercise-library-followup.md](../../../.claude/projects/-Users-trymvestengen-Desktop-ai-coach/memory/exercise-library-followup.md).

## Mål

1. Coach har 870 øvelser å velge mellom når den bygger programmer.
2. Hver øvelse i appen har thumbnail-bilde der det er relevant (picker, program-detalj).
3. Bruker kan tappe en øvelse hvor som helst og få opp en detalj-modal med begge bilder, instruksjoner og muskel-info.
4. Ingen duplikat-datakilder: lokal JSON + 15k-linjers frontend-fil slettes.

## Ikke-mål

- Animerte GIF-er — kommer i ExerciseDB-follow-up senere.
- Bilder i kjør-økt-skjermen — utelatt fra første runde for å holde fokus (vurderes i workout-redesign senere).
- Egendefinerte øvelser — bruker kan ikke legge til egne. Bare biblioteket.
- Mirror til Supabase Storage — beholder GitHub raw URLs så lenge det fungerer.
- Egne treningsvideoer eller form-cues — kun det Free Exercise DB leverer.
- Migrering av eksisterende test-programmer — vi wiper og setter brukerens programmer/workouts opp på nytt hvis de finnes.

## Arkitektur

```
Free Exercise DB (yuhonas/free-exercise-db @ GitHub)
              │
              ▼  one-time seed_free_exercise_db.py
       Supabase exercises-tabellen
              │
              ▼  GET /api/exercises, GET /api/exercises/{id},
                  search_exercises tool, get_exercise_info tool
       Coach + Frontend leser herfra
              │
              ▼
ExercisePickerSheet — Program-detalj — ExerciseDetailModal
```

Database er sannhetskilden. Verken coach eller frontend har hardkodet øvelses-data.

## Schema

Migration `api/db/migrations/013_exercises_v2.sql`:

```sql
ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS force            TEXT,
    ADD COLUMN IF NOT EXISTS mechanic         TEXT,
    ADD COLUMN IF NOT EXISTS category         TEXT,
    ADD COLUMN IF NOT EXISTS primary_muscles  TEXT[],
    ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[],
    ADD COLUMN IF NOT EXISTS image_urls       TEXT[];
```

Eksisterende kolonner beholdes: `id` (TEXT PK), `name`, `muscle_groups`, `equipment`, `difficulty`, `instructions`. De nye kolonnene speiler Free Exercise DB sin JSON-struktur.

`muscle_groups` beholdes for bakwards-kompat med eksisterende kode som leser fra det feltet. Det fylles fra `primary_muscles` ved import.

## Import-script

`api/db/seed_free_exercise_db.py`:

```python
"""Wipe and reimport the exercises table from yuhonas/free-exercise-db."""
import asyncio
import json
import urllib.request
from app.db import get_conn

JSON_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"


def fetch_json() -> list:
    with urllib.request.urlopen(JSON_URL) as r:
        return json.loads(r.read())


async def main():
    data = fetch_json()
    print(f"Fetched {len(data)} exercises")

    async with get_conn() as conn:
        # FK constraints: program_exercises and workout_sets reference exercises(id).
        # We delete dependent rows first to avoid FK violations.
        await conn.execute("DELETE FROM program_exercise_sets")
        await conn.execute("DELETE FROM program_exercises")
        await conn.execute("DELETE FROM workout_sets")
        await conn.execute("DELETE FROM exercises")

        for ex in data:
            image_urls = [f"{IMAGE_BASE}/{img}" for img in ex.get("images", [])]
            await conn.execute(
                """
                INSERT INTO exercises (
                    id, name, muscle_groups, equipment, difficulty, instructions,
                    force, mechanic, category,
                    primary_muscles, secondary_muscles, image_urls
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    ex["id"],
                    ex["name"],
                    ex.get("primaryMuscles", []),
                    [ex["equipment"]] if ex.get("equipment") else [],
                    ex.get("level"),
                    "\n\n".join(ex.get("instructions", [])),
                    ex.get("force"),
                    ex.get("mechanic"),
                    ex.get("category"),
                    ex.get("primaryMuscles", []),
                    ex.get("secondaryMuscles", []),
                    image_urls,
                ),
            )
        await conn.commit()
    print("Import complete")


if __name__ == "__main__":
    asyncio.run(main())
```

Kjøres én gang manuelt:
```bash
cd api && .venv/bin/python db/seed_free_exercise_db.py
```

`DELETE FROM program_exercises` + `workout_sets` rydder eksisterende FK-avhengigheter. Akseptabelt fordi vi ikke har ekte brukerdata enda.

## Coach-tools (read_handlers.py)

To handlers oppdateres:

**`_load_exercises()` — slettes.** Filbasert cache går ut.

**`search_exercises(user_id, muscle_group=None, equipment=None, difficulty=None)`** — query DB:

```python
async def search_exercises(
    user_id: str,
    muscle_group: str | None = None,
    equipment: str | None = None,
    difficulty: str | None = None,
) -> dict:
    sql = "SELECT id, name, primary_muscles, equipment, difficulty FROM exercises WHERE 1=1"
    params: list = []
    if muscle_group:
        sql += " AND %s = ANY(primary_muscles)"
        params.append(muscle_group)
    if equipment:
        sql += " AND %s = ANY(equipment)"
        params.append(equipment)
    if difficulty:
        sql += " AND difficulty = %s"
        params.append(difficulty)
    sql += " ORDER BY name LIMIT 50"

    async with get_conn() as conn:
        cur = await conn.execute(sql, params)
        rows = await cur.fetchall()
    return {
        "ok": True,
        "exercises": [
            {"id": r[0], "name": r[1], "primary_muscles": r[2], "equipment": r[3], "difficulty": r[4]}
            for r in rows
        ],
    }
```

**`get_exercise_info(user_id, exercise_id)`** — query DB, returnerer alle felter inkludert `image_urls` og `instructions`.

## Backend-endepunkter

Eksisterende `GET /api/exercises` (i `programs.py` router) eksisterer allerede og returnerer liste. Utvides til å returnere de nye feltene (`force`, `mechanic`, `category`, `primary_muscles`, `secondary_muscles`, `image_urls`).

**NY:** `GET /api/exercises/{exercise_id}` — returnerer enkelt-øvelse med alle felter. Brukes av `ExerciseDetailModal`.

## Frontend

### Lib

`web/src/lib/api.ts` — utvid `Exercise` type og legg til ny `getExerciseDetail`:

```ts
export type Exercise = {
  id: string
  name: string
  primary_muscles: string[]
  equipment: string[]
  difficulty: string
  image_urls: string[]
}

export type ExerciseDetail = Exercise & {
  secondary_muscles: string[]
  force: string | null
  mechanic: string | null
  category: string | null
  instructions: string
  muscle_groups: string[]
}

export async function getExerciseDetail(id: string): Promise<ExerciseDetail> {
  const res = await fetch(`${API_BASE}/api/exercises/${id}`, {
    headers: await getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<ExerciseDetail>
}
```

### Komponenter

**`ExercisePickerSheet`** (eksisterer i `web/src/components/program/workout/`):
- Item-rendering utvides med thumbnail (img tag, `image_urls[0]`, lazy loaded).
- Item-tap: åpner `ExerciseDetailModal` med valgt øvelses ID, IKKE legger til i workout direkte.
- Modal-en har en «Legg til denne»-knapp som kaller eksisterende `onPick`-callback.

**Program-detalj-skjermen (`DayCard` eller liknende)** — finn der øvelser listes per dag:
- Hver øvelse-rad får liten thumbnail venstre side.
- Tap på øvelse-rad → åpner `ExerciseDetailModal`.

**`ExerciseDetailModal.tsx`** (NY) i `web/src/components/exercises/`:
- Slide-up bottom sheet (samme stil som andre sheets i appen).
- Slideshow av begge bilder: tap én side for å bytte (CSS-toggle, ikke library).
- Navn, primary_muscles (chips), secondary_muscles (mindre chips), equipment.
- Instructions som lesbar prose.
- Hvis caller har passet en `programId`+`dayId`+`onPick`-prop, vis «Legg til denne»-knapp nederst.
- Lukk-knapp øverst.

Layout:

```
┌─────────────────────────┐
│ ×                       │
│ ┌─────────────────────┐ │
│ │      [BILDE 1]      │ │  ← tap bytter til bilde 2
│ └─────────────────────┘ │
│ Barbell Squat           │
│ [Quadriceps][Glutes]    │
│ Sekundær: Hamstrings    │
│ Utstyr: Barbell         │
│                         │
│ Instructions…           │
│                         │
│ [ Legg til denne ]      │  ← bare hvis caller spør om det
└─────────────────────────┘
```

### Sletting

| Fil | Status |
|---|---|
| `api/app/data/exercises.json` | **slettes** |
| `api/db/exercises_wger.json` | **slettes** |
| `api/db/seed_wger.py` | **slettes** |
| `web/src/lib/exercises.ts` (~15k linjer) | **slettes** |
| `web/src/components/exercises/ExerciseLibrary.tsx` | sjekkes mot bruk, slettes hvis dødt |
| `web/src/components/exercises/ExerciseDetail.tsx` (gammel) | erstattes av ExerciseDetailModal |

## Dataflyt

```
Bruker tapper øvelse i picker eller program-detalj
              │
              ▼
ExerciseDetailModal mounted med exercise_id
              │
              ▼  getExerciseDetail(id)
GET /api/exercises/{id}
              │
              ▼
Backend leser fra exercises-tabellen
              │
              ▼
Frontend renderer modal med image_urls + alt metadata
```

## Edge cases

| Scenario | Hva skjer |
|---|---|
| GitHub raw URLs er nede | `<img>` får `onError` som viser grå placeholder med øvelsesnavn. Modal forblir brukbar. |
| Bilde-CDN throttles oss (sjeldent) | Samme som over. Vi vurderer Supabase-mirroring hvis det blir tilbakevendende. |
| Coach kaller `create_program` med `exercise_id` som ikke finnes etter import | FK constraint på `program_exercises.exercise_id` → INSERT feiler → tool returnerer `{ok: False, error}` → coach kan korrigere på neste tur. |
| User åpner ExerciseDetailModal mens GET feiler | Vis loading skeleton, så feilmelding med «Prøv igjen»-knapp. |
| Bruker har eksisterende programmer som refererer til gamle exercise_ids | `seed_free_exercise_db.py` DELETER alt fra `program_exercises` og `workout_sets` først. Bruker må lage programmer på nytt etter import. |
| ExerciseDetailModal åpnes uten `onPick`-prop | «Legg til denne»-knapp vises ikke. Modal er kun lese-visning. |
| Frontend bygger ny program-detalj-skjerm før de gamle Strong-stil komponentene er rebrand | Vi mounter modal-en i begge skjermer uavhengig — den er en selvstendig komponent. |

## Testing

**Backend (pytest):**
- `test_seed_free_exercise_db.py` — sjekk at fetch_json parser et mocked input + bygger riktig `image_urls` array. Ikke treff GitHub i CI.
- `test_tools.py` — utvid for nye `search_exercises` og `get_exercise_info` implementasjoner (DB-mocking pattern).
- `test_programs_router.py` — utvid med test for nytt `GET /api/exercises/{id}` endepunkt + 404 case.

**Frontend (Vitest):**
- `ExerciseDetailModal.test.tsx` — rendrer begge bilder, tap bytter aktiv, viser muskel-chips, «Legg til»-knapp vises kun når onPick prop satt.
- `ExercisePickerSheet.test.tsx` — utvid: item-tap åpner detalj-modal (ikke direkte onPick).

**Manuell verifisering:**
1. Kjør `seed_free_exercise_db.py` — verifiser 870 øvelser i DB.
2. Åpne `/program/workout/<id>` → «+ Legg til øvelse» → picker viser thumbnails → tap én → modal viser bilder + info → «Legg til denne» legger til.
3. Åpne `/program/<id>` → tap øvelse-rad → samme modal åpnes (uten Legg-til-knapp).
4. Be coachen lage 3-dagers program. Verifiser at den nå klarer det (siden den har 870 alternativer + et komplett schema).

## Migreringsplan

1. Skriv migration 013 + applies via SQL Editor.
2. Implementer `seed_free_exercise_db.py` + tester.
3. Kjør seeden manuelt → verifiser DB-state.
4. Oppdater `read_handlers.py` (search_exercises + get_exercise_info → DB).
5. Legg til `GET /api/exercises/{id}` endepunkt.
6. Frontend: ny `getExerciseDetail`, ny `ExerciseDetailModal`, utvid `ExercisePickerSheet` + program-detalj.
7. Slett gamle filer.
8. Test alle 4 scenariene i «Manuell verifisering»-listen.
