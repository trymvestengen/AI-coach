# Kode-review — feat/onboarding-redesign (2026-06-11)

Read-only kvalitets-review av branchen (utover security-auditen, som dekket auth).
Tre parallelle agenter over backend-tools, backend-routere/services og frontend.
Status oppdateres etter hvert som funn fikses.

## 🔴 Kritisk

| # | Funn | Fil | Status |
|---|---|---|---|
| C1 | `/log` krasjer for alle med fullført økt — itererer `raw.sets` men `/api/workouts` returnerer ingen `sets`/`date` (kun summary). `undefined is not iterable` → white-screen. `Workout`-typen i `api.ts` lyver om formen. | `web/src/components/log/WorkoutLog.tsx:42`, `web/src/lib/api.ts:18` | ✅ Fikset |
| C2 | `log_set_with_note` skriver til vilkårlig `workout_id` uten eierskapssjekk (LLM-levert id, backend forbigår RLS). De andre write-handlerne sjekker eierskap; denne ble glemt. | `api/app/tools/handlers/workout_handlers.py:45` | ✅ Fikset |

## 🟠 Høy

| # | Funn | Fil | Status |
|---|---|---|---|
| H1 | `chat/stream` lekker `str(e)` til klient (intern feildetalj). Branchen mangler M1-fiksen main har. | `api/app/routers/chat.py:55`, `api/app/services/coach.py:347` | ✅ Fikset |
| H2 | `swap_active_workout_exercise` melder `{"ok": True}` selv når 0 rader endret. | `api/app/tools/handlers/workout_handlers.py:139` | ✅ Fikset |
| H3 | `login/page.tsx` kjører `setState` + `router.replace` under render (React anti-pattern). | `web/src/app/login/page.tsx:18` | ✅ Fikset |
| H4 | `update_program` setter `folder_id` uten å sjekke at mappa tilhører brukeren. | `api/app/tools/handlers/program_handlers.py:92` | ⏳ Åpen (ta i split) |
| H5 | `patch_user_profile` fanger `HTTPException` og returnerer 204 → maskerer 404 som suksess. | `api/app/routers/users.py:143` | ⏳ Åpen |
| H6 | `profile.py` POST-creates (injury/preference/equipment/constraint) tar utypet `dict` uten lengde/type-validering. | `api/app/routers/profile.py` | ⏳ Åpen |

## 🟡 Medium

| # | Funn | Status |
|---|---|---|
| M1 | OnboardingWizard: `error` settes ~10 steder men **rendres aldri** → bruker sitter fast uten feedback. | ⏳ Åpen |
| M2 | Død "swap exercise"-flyt: `pendingSwap` skrives (`exercises/page.tsx`, `ExerciseLibrary.tsx`) men leses aldri. | ⏳ Åpen |
| M3 | HomeScreen viser hardkodet `MOCK_FRIENDS`/`MOCK_SUGGESTIONS` som ekte data på prod-home. | ⏳ Åpen |
| M4 | Duplikat død kode: `components/workout/WorkoutLog.tsx` (aldri importert, broken); `get_progression`/`get_workout_history` definert identisk i både `read_handlers.py` og `memory_handlers.py` (sistnevnte døde). | ⏳ Åpen |
| M5 | To ulike "dagens økt"-definisjoner: `home` (weekdays) vs `program` (day_number). | ⏳ Åpen |
| M6 | `coach.chat()` (non-stream) mangler tool-loop-tak (stream-varianten har MAX_TOOL_TURNS=6). | ⏳ Åpen |
| M7 | Inkonsistent feilhåndtering: noen handlere/routere mangler `try/except` (rå 500 m/intern detalj); `print()` i stedet for logger. | ⏳ Åpen |
| M8 | Brzycki-1RM gir absurde verdier ved reps > ~12 (`programs.py:539`); PR-deteksjon på float-likhet (`social.py:179`). | ⏳ Åpen |

## ⚪ Lav
- `coach-stream.ts:52` uguardet `JSON.parse` per SSE-frame → én korrupt frame dreper hele streamen.
- OnboardingWizard equipment-POST sjekker ikke `res.ok`.
- Touch targets < 44px (WorkoutRun-checkmark, body-slett); sheets trapper ikke fokus/Escape.
- Forretningslogikk i routere (`get_user_stats`, `get_feed`) — jf. CLAUDE.md "routere = HTTP only".
- `main.py` prefix-inkonsistens (noen routere setter egen `/api`-prefix).
- `WorkoutRun.tsx`: ubrukt `folders`-prop, `handleAddSet` persisterer ikke til API.
- `get_exercises`/`get_exercise_by_id` uten auth (trolig bevisst — delt bibliotek; legg kommentar).

## Akseptert / ikke-bug
- **Leaderboard viser alle brukere globalt** (`social.py:259`): bevisst designvalg (Trym, jf. security-audit M4). Ikke en bug.

## ✅ Gjort bra
Parametriserte queries overalt · mutasjoner user-scopet med `RETURNING id`→404 · SSR-sider (utenom `/log`) guarder `.ok` riktig · `profile.ts` sentraliserer fetch-feil · PgBouncer-aware db-pool · god Pydantic-validering i programs/workouts/body_metrics · streaming-coach har runaway-tak · dispatcher er en ren, defensiv router.
