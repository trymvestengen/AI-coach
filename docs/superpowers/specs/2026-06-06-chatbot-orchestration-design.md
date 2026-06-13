# Chatbot orkestrering

> **Status:** Design (godkjent 2026-06-06)
> **Scope:** Full orkestrering — coachen kan opprette, endre og slette alt relatert til trening via tool use, med confirm-flyt for destruktive handlinger og lesbare pills i chat-UI med lenker.

## Bakgrunn

Dagens coach har 14 tools definert (`api/app/tools/definitions.py`), men det er to fundamentale hull:

1. **TEST_USER_ID hardkodet** — alle handlers bruker en konstant testbruker i stedet for den innloggede. Coachen handler dermed på feil data i produksjonsflyt.
2. **Mangler edit/delete** — coachen kan kun opprette (`create_program`, `log_workout`, `log_set_with_note`, `write_observation`). Den kan ikke endre eller slette eksisterende programmer, mapper, dager eller øvelser. Den kan heller ikke oppdatere brukerens profil/skader/utstyr.

Denne specen lukker begge hullene og legger til 30 nye tools så coachen kan håndtere alt relatert til trening.

## Mål

1. Erstatt `TEST_USER_ID` med ekte innlogget user_id via dispatcher-pattern.
2. Utvid tool-biblioteket fra 14 til 42 tools — full CRUD på programmer, mapper, workouts, og profil-relaterte entiteter.
3. Confirm-flyt for destruktive tools via prompt-instruks (ingen ny stream-event-type).
4. Norske, lesbare pills i chat-UI med valgfri tappable lenke til affisert entitet.
5. Splitt `handlers.py` i domene-baserte filer for å holde komponenter mindre enn ~300 linjer.

## Ikke-mål

- **Custom exercises** — coachen kan ikke utvide øvelseslisten. Bare eksisterende `exercise_id`-er kan brukes.
- **Body-measurement-historikk** — ingen vekt/mål-tracking over tid.
- **Kosthold/nutrition.**
- **Søvn/recovery-tracking.**
- **Kalender/scheduling-features.**
- **Voice-first UI.**
- **Multi-bruker.**
- **Undo-stack.**
- **Audit-tabell.**
- **Endring av Anthropic-modell eller streaming-arkitektur** — beholdes som er.

## Tools-inventar (42 totalt)

### Eksisterende (12, beholdes med user_id-fix)

| Tool | Type |
|---|---|
| `get_user_profile` | read |
| `get_user_history` | read (alias for `get_workout_history` — behold for bakwardskompat) |
| `get_workout_history` | read |
| `get_progression` | read |
| `get_exercise_info` | read |
| `search_exercises` | read |
| `search_observations` | read (memory) |
| `get_recent_sessions` | read (memory) |
| `create_program` | write (refactores: setter ikke lenger `is_active=true` automatisk) |
| `log_workout` | write |
| `log_set_with_note` | write |
| `write_observation` | write (memory) |

### Nye program-CRUD (9)

| Tool | Args |
|---|---|
| `update_program` | program_id, name? (str), is_active? (bool), folder_id? (str/null) |
| `delete_program` | program_id |
| `add_program_day` | program_id, day_number (int), name (str) |
| `remove_program_day` | program_id, day_id |
| `rename_program_day` | program_id, day_id, name |
| `add_exercise_to_day` | program_id, day_id, exercise_id, sets (int), reps (int), weight_kg? |
| `remove_exercise_from_day` | program_id, day_id, exercise_id |
| `swap_exercise_in_day` | program_id, day_id, old_exercise_id, new_exercise_id (beholder sets/reps/kg) |
| `update_exercise_sets` | program_id, day_id, exercise_id, sets? (int), reps? (int), weight_kg? |

### Nye folder-tools (4)

| Tool | Args |
|---|---|
| `create_folder` | name |
| `rename_folder` | folder_id, name |
| `delete_folder` | folder_id (programmer flyttes til rot via ON DELETE SET NULL) |
| `list_folders` | (read) returnerer brukerens mapper |

### Nye workout-lifecycle (6)

| Tool | Args |
|---|---|
| `start_workout_from_day` | program_day_id |
| `complete_workout` | workout_id, rpe? (int 1-10), notes? |
| `discard_workout` | workout_id |
| `swap_active_workout_exercise` | workout_id, old_exercise_id, new_exercise_id |
| `add_active_workout_exercise` | workout_id, exercise_id (legger til på live workout) |

### Nye profil/persona (2)

| Tool | Args |
|---|---|
| `update_user_profile` | first_name?, last_name?, goals? (list[str]), experience_level?, training_days_per_week?, height_cm?, weight_kg?, activity_level?, years_training?, preferred_training_time?, max_session_duration_min? |
| `set_persona_mode` | mode ("friend" \| "sergeant" \| "analyst") |

### Nye skader (3)

| Tool | Args |
|---|---|
| `add_injury` | body_part (str), description?, severity? ("low"/"moderate"/"high"), started_at? (date) |
| `update_injury` | injury_id, severity?, description?, is_active? (bool) |
| `remove_injury` | injury_id (markeres is_active=false) |

### Nye utstyr/preferanser/begrensninger (6)

| Tool | Args |
|---|---|
| `add_equipment` | equipment (str) |
| `remove_equipment` | equipment (str) |
| `add_preference` | category, preference |
| `remove_preference` | preference_id |
| `add_constraint` | type, description |
| `remove_constraint` | constraint_id |

### Nye sosialt (1)

| Tool | Args |
|---|---|
| `share_workout` | workout_id |

**Totalt: 12 eksisterende + 30 nye = 42 tools.**

## Arkitektur — backend

### Ny filstruktur

```
api/app/tools/
├── __init__.py
├── definitions.py                  # alle 42 tool-schema-er (utvides)
├── dispatcher.py                   # NY — handle_tool(user_id, name, input) router → handler
├── result_links.py                 # NY — bygger result_link per tool-navn
└── handlers/
    ├── __init__.py                 # re-eksporter alle handler-funksjoner
    ├── program_handlers.py         # 15 tools (eksisterende + nye CRUD)
    ├── folder_handlers.py          # 4 tools
    ├── workout_handlers.py         # 8 tools (lifecycle + active edits)
    ├── profile_handlers.py         # 2 tools
    ├── injury_handlers.py          # 3 tools
    ├── equipment_handlers.py       # 2 tools
    ├── preference_handlers.py      # 2 tools
    ├── constraint_handlers.py      # 2 tools
    ├── read_handlers.py            # 6 read-only (profile, exercise, history, progression)
    ├── memory_handlers.py          # 4 tools (eksisterende, beholdes)
    └── social_handlers.py          # 1 tool
```

### Handler-signatur (uniform)

```python
async def x_tool(user_id: str, **kwargs) -> dict:
    """Utfør tool-handling for user_id.

    Returnerer:
      - { "ok": True, ...data, "_link": { "label": "Se PPL", "href": "/program/abc" } } ved suksess
      - { "ok": False, "error": "..." } ved feil
    """
```

`_link`-felt er valgfritt og brukes av `result_links.py` til å bygge `result_link` til streamen.

### Dispatcher

```python
# api/app/tools/dispatcher.py
from app.tools.handlers import (
    program_handlers, folder_handlers, workout_handlers,
    profile_handlers, injury_handlers, equipment_handlers,
    preference_handlers, constraint_handlers, read_handlers,
    memory_handlers, social_handlers,
)

HANDLERS: dict[str, callable] = {
    "create_program": program_handlers.create_program,
    "update_program": program_handlers.update_program,
    "delete_program": program_handlers.delete_program,
    # ... etc, alle 42
}

async def handle_tool(user_id: str, name: str, tool_input: dict) -> dict:
    handler = HANDLERS.get(name)
    if not handler:
        return {"ok": False, "error": f"Unknown tool: {name}"}
    try:
        return await handler(user_id, **tool_input)
    except TypeError as e:
        return {"ok": False, "error": f"Invalid arguments: {e}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
```

### Endringer i `coach.py`

To endringer:

1. Erstatt `from app.constants import TEST_USER_ID` med `user_id` parameter på `chat()` og `chat_stream()`.
2. Etter `tool_result`, hent `_link` fra handler-output og inkluder i stream-eventen.

### `TEST_USER_ID`-konstanten

Beholdes BARE for tester:

```python
# api/app/constants.py
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
# Note: ONLY for tests. Production code uses the authenticated user_id from
# the request via get_current_user_id().
```

Alle imports av denne i `app/tools/handlers.py`, `services/coach.py`, etc. fjernes.

## Confirm-flyt for destruktive handlinger

Ingen ny stream-event-type. Confirm håndteres KUN via prompt-instruks i `BASE_PROMPT`:

```
CONFIRM-REGEL FOR DESTRUKTIVE HANDLINGER
Før du kaller noen av disse:
- delete_program, delete_folder
- remove_program_day, remove_exercise_from_day
- swap_exercise_in_day
- discard_workout
- remove_injury

Du MÅ:
1. I første tur, IKKE kalle tool-en. Svar i stedet med en kort bekreftelses-spørsmål:
   "Er du sikker på at jeg skal slette {X}? Det er ikke reversibelt."
2. Vent på brukerens svar.
3. Hvis svaret bekrefter (ja/yes/ok/gjør det/slett), kall tool-en.
4. Hvis svaret avviser eller er uklart, ikke kall tool-en. Bekreft "OK, lar det stå."

Aldri kall confirm-pliktige tools i samme tur som brukerens første forespørsel.
```

Dette legges til som en egen blokk i `BASE_PROMPT` i `services/coach.py`.

## Tool-handlinger overflates i UI

### Stream-event utvidet

```ts
// web/src/lib/coach-stream.ts
| { type: "tool_result"; tool_use_id: string; name: string; ok: boolean; result_link?: { label: string; href: string } }
```

### TOOL_LABELS-mapping

Frontend-konstant for å gi hvert tool en lesbar label + emoji:

```ts
// web/src/lib/tool-labels.ts (NY)
export const TOOL_LABELS: Record<string, { in_progress: string; done: string; emoji: string }> = {
  create_program:           { in_progress: "Lager program",      done: "Laget program",     emoji: "💪" },
  update_program:           { in_progress: "Oppdaterer program", done: "Oppdatert",          emoji: "✏️" },
  delete_program:           { in_progress: "Sletter program",    done: "Slettet",            emoji: "🗑" },
  add_program_day:          { in_progress: "Legger til dag",     done: "Lagt til dag",       emoji: "➕" },
  remove_program_day:       { in_progress: "Fjerner dag",        done: "Fjernet dag",        emoji: "➖" },
  rename_program_day:       { in_progress: "Endrer navn",        done: "Endret navn",        emoji: "✏️" },
  add_exercise_to_day:      { in_progress: "Legger til øvelse",  done: "Lagt til øvelse",    emoji: "➕" },
  remove_exercise_from_day: { in_progress: "Fjerner øvelse",     done: "Fjernet øvelse",     emoji: "➖" },
  swap_exercise_in_day:     { in_progress: "Bytter øvelse",      done: "Byttet øvelse",      emoji: "🔄" },
  update_exercise_sets:     { in_progress: "Oppdaterer sett",    done: "Oppdatert",          emoji: "✏️" },
  create_folder:            { in_progress: "Lager mappe",        done: "Laget mappe",        emoji: "📁" },
  rename_folder:            { in_progress: "Endrer mappenavn",   done: "Endret",             emoji: "📁" },
  delete_folder:            { in_progress: "Sletter mappe",      done: "Slettet mappe",      emoji: "🗑" },
  list_folders:             { in_progress: "Henter mapper",      done: "Mapper hentet",      emoji: "📁" },
  log_workout:              { in_progress: "Logger økt",         done: "Logget økt",         emoji: "📝" },
  log_set_with_note:        { in_progress: "Logger sett",        done: "Logget sett",        emoji: "📝" },
  start_workout_from_day:   { in_progress: "Starter økt",        done: "Startet økt",        emoji: "▶️" },
  complete_workout:         { in_progress: "Fullfører økt",      done: "Fullført",           emoji: "✓" },
  discard_workout:          { in_progress: "Forkaster økt",      done: "Forkastet",          emoji: "🗑" },
  swap_active_workout_exercise: { in_progress: "Bytter øvelse",  done: "Byttet",             emoji: "🔄" },
  add_active_workout_exercise:  { in_progress: "Legger til",     done: "Lagt til",           emoji: "➕" },
  update_user_profile:      { in_progress: "Lagrer profil",      done: "Lagret profil",      emoji: "👤" },
  set_persona_mode:         { in_progress: "Bytter personlighet", done: "Byttet personlighet", emoji: "🎭" },
  add_injury:               { in_progress: "Lagrer skade",       done: "Lagret skade",       emoji: "🩹" },
  update_injury:            { in_progress: "Oppdaterer skade",   done: "Oppdatert",          emoji: "🩹" },
  remove_injury:            { in_progress: "Fjerner skade",      done: "Markert som leget",  emoji: "✓" },
  add_equipment:            { in_progress: "Lagrer utstyr",      done: "Lagt til utstyr",    emoji: "🏋️" },
  remove_equipment:         { in_progress: "Fjerner utstyr",     done: "Fjernet",            emoji: "🏋️" },
  add_preference:           { in_progress: "Lagrer preferanse",  done: "Lagret",             emoji: "⭐" },
  remove_preference:        { in_progress: "Fjerner",            done: "Fjernet",            emoji: "⭐" },
  add_constraint:           { in_progress: "Lagrer begrensning", done: "Lagret",             emoji: "🚧" },
  remove_constraint:        { in_progress: "Fjerner",            done: "Fjernet",            emoji: "🚧" },
  share_workout:            { in_progress: "Deler økt",          done: "Delt",               emoji: "📣" },
  // Read-only tools får ingen pill, kun lydløs handling
}
```

### Result-link-mapping

`api/app/tools/result_links.py` (NY):

```python
def build(tool_name: str, handler_output: dict) -> dict | None:
    """Bygger { 'label': str, 'href': str } basert på tool-navn og output.
    Returnerer None hvis ingen lenke skal vises."""
    if tool_name == "create_program" and handler_output.get("ok"):
        return {"label": f"Se {handler_output['name']}", "href": f"/program/{handler_output['program_id']}"}
    if tool_name == "start_workout_from_day" and handler_output.get("ok"):
        return {"label": "Åpne", "href": f"/program/workout/{handler_output['workout_id']}"}
    if tool_name == "log_workout" and handler_output.get("ok"):
        return {"label": "Se økt", "href": f"/program/workout/{handler_output['workout_id']}"}
    if tool_name == "share_workout" and handler_output.get("ok"):
        return {"label": "Se feed", "href": "/social"}
    return None
```

### Pill-rendering i `ChatBody.tsx`

Eksisterende `tool_use`/`tool_result`-rendering utvides:
- Bruk `TOOL_LABELS[name]` for label + emoji
- Hvis `result_link` er satt, render som tappable `<Link>`-element inni pillen
- Read-only tools (`get_*`, `search_*`) viser ingen pill (lydløs)

## Database-endringer

Ingen migrations — alle 30 nye tools bruker eksisterende skjema fra tidligere workstreams:
- `programs`, `program_days`, `program_exercises`, `program_exercise_sets`
- `program_folders` (med `folder_id` på `programs`)
- `workouts`, `workout_sets`
- `users`, `user_injuries`, `user_equipment`, `user_preferences`, `user_constraints`

## Dataflyt

```
User skriver i chat
  ↓
/api/chat/stream POST { messages, persona }
  ↓
get_current_user_id(request) → user_id
  ↓
services/coach.chat_stream(user_id, messages, persona)
  ↓
For hvert tool_use Claude emitter:
  ├─→ Stream tool_use-event til klient
  ├─→ Kall app.tools.dispatcher.handle_tool(user_id, name, input)
  │      └─→ Dispatcher router til riktig handler i handlers/
  │              └─→ Handler kjører SQL mot eksisterende DB-skjema
  ├─→ Bygg result_link via result_links.build(name, handler_output)
  └─→ Stream tool_result-event { ok, result_link? } til klient
```

## Edge cases

| Scenario | Hva skjer |
|---|---|
| Coach kaller tool på entitet som ikke tilhører user_id | Handler returnerer 404-error, dispatcher returnerer `{ ok: false }`, coach forteller brukeren at den ikke fant det |
| Coach kaller tool med ukjent navn | Dispatcher returnerer `{ ok: false, error: "Unknown tool" }`, coach beklager |
| Coach kaller destruktiv tool i samme tur som brukerens første forespørsel | Prompt-instruks forhindrer dette; hvis det skjer likevel, handlingen utføres (ingen backend-blokk) |
| Tool kaster runtime-exception | Dispatcher fanger og returnerer `{ ok: false, error: str(e) }`, coach beklager |
| `MAX_TOOL_TURNS = 6` nås | Eksisterende fallback fra `coach.py` — coach sier «Jeg kommer ikke lenger nå, prøv å være mer spesifikk» |
| Tool returnerer `_link` med ødelagt entity-id | Frontend rendrer lenken; tap fører til 404-side; ikke et stort problem |
| Bruker spør «Slett alle programmene mine» | Coach må kalle `delete_program` flere ganger; confirm-prompt gjelder for hver |
| `swap_exercise_in_day` mister logget data | Acceptable — ny øvelse har ingen historikk på den dagen; brukeren er advart via confirm |

## Testing

### Backend (pytest)

Tabell-drevet per domene:

```
api/tests/
├── test_tools_dispatcher.py         # routing, unknown-tool, error-catch (~5)
├── test_tools_result_links.py       # link-bygging per tool-navn (~5)
├── test_tools_program.py            # 15 tools × 1-2 cases (~25)
├── test_tools_folder.py             # 4 tools (~6)
├── test_tools_workout.py            # 8 tools (~12)
├── test_tools_profile.py            # 2 tools (~4)
├── test_tools_injury.py             # 3 tools (~5)
├── test_tools_equipment.py          # 2 tools (~3)
├── test_tools_preference.py         # 2 tools (~3)
├── test_tools_constraint.py         # 2 tools (~3)
└── test_tools_social.py             # 1 tool (~2)
```

Hver tool må minst ha:
- Happy path (mocked DB, ok=true, riktig SQL kalt)
- User-scoping (entity tilhører annen bruker → 404 / `{ ok: False }`)

### Frontend (Vitest)

- `web/src/lib/coach-stream.test.ts` — utvidet for `result_link`-event
- `web/src/lib/tool-labels.test.ts` — sanity-check: alle 42 tool-navn finnes (catches typos)
- `web/src/app/coach/ChatBody.test.tsx` — pill rendrer label + emoji, lenke rendres når `result_link` er satt

### Manuell verifisering (5 brukerscenarier)

1. «Lag et 3-dagers styrkeprogram» → pill «Laget program ✓ [Se 3-dagers styrkeprogram →]» → tap → /program/{id}
2. «Endre squat til hack squat i programmet mitt» → pill «Byttet øvelse ✓»
3. «Slett PPL» → coach spør «Er du sikker?» → svar «ja» → pill «Slettet ✓»
4. «Jeg har vondt i kneet» → pill «Lagret skade ✓» + verifiser i Profile-tab
5. «Start dagens økt» → pill «Startet økt ✓ [Åpne →]» → tap → workout-skjerm

## Migreringsplan (kort)

1. Refactor dispatcher først — `TEST_USER_ID` ut, `user_id` parameter inn. Eksisterende 14 tools fortsetter å funke.
2. Splitt handlers.py i domene-baserte filer (uten å endre tool-set ennå).
3. Legg til nye program-CRUD tools + tester.
4. Legg til folder-tools + tester.
5. Legg til workout-lifecycle-tools + tester.
6. Legg til profil/skade/utstyr/preferanse/begrensning-tools + tester.
7. Legg til share_workout.
8. Frontend: utvid stream-event, lag TOOL_LABELS, render lenker i pills.
9. Oppdater `BASE_PROMPT` med confirm-regelen og full tool-oversikt.
10. Verifiser manuelt med 5 brukerscenarier.

## Hva som leveres etter denne specen

En coach som kan:
- Lese og oppdatere brukerens profil, skader, utstyr, preferanser, begrensninger
- Lage, endre, slette programmer (med confirm) — inkludert dager og øvelser
- Lage, endre, slette mapper og flytte programmer mellom dem
- Starte, logge, fullføre, forkaste workouts — inkludert mid-økt bytte/legg til øvelse
- Dele økter til social feed
- Vise alle handlinger som lesbare pills i chat, med tappable lenker der det gir mening
- Confirm-spørre før destruktive handlinger
