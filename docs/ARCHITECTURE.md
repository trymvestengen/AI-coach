# Arkitektur

## Overordnet flyt

```
[Bruker]
   ↕ (mikrofon / høyttaler / skjerm)
[Frontend: Next.js]
   ↕ WebSocket (voice streaming) + REST (data)
[Backend: FastAPI]
   ├─→ STT (Deepgram Nova-2 streaming)
   ├─→ LLM (Claude Sonnet 4.5 + tool use)
   ├─→ TTS (ElevenLabs Flash / Cartesia Sonic)
   ├─→ Postgres (brukere, økter, programmer)
   └─→ pgvector (samtaleminne, valgfritt i MVP)
```

Alt i voice-flyten streamer. Ikke request/response — ventetiden blir da 3-5 sekunder, som dreper følelsen.

## Voice pipeline (det kritiske laget)

Mål: **under 800ms** fra bruker slutter å snakke til coachen begynner å svare.

```
Bruker snakker
   ↓ audio chunks 100ms via WebSocket
STT streaming (Deepgram)
   ↓ partial transcripts løpende
VAD (voice activity detection)
   ↓ utløses når bruker er ferdig å snakke
LLM streaming (Claude Sonnet)
   ↓ tokens token-for-token
Sentence chunker
   ↓ samler til hele setninger (punktum/komma)
TTS streaming (Cartesia/ElevenLabs)
   ↓ audio chunks tilbake via WebSocket
Frontend AudioBufferSourceNode
   ↓
Bruker hører svar mens resten genereres
```

**Viktigste detalj:** ikke vent på hele LLM-responsen før dere sender til TTS. Samle tokens til dere har en hel setning, send den, og begynn avspilling mens resten genereres. Dette alene kutter ventetiden fra 3-5 sekunder til under 1 sekund.

## Tool use-design

Coachen bruker Claude sine tools til å slå opp fakta, lagre data, og hente historikk. Dette reduserer hallusinasjoner og gir strukturert data inn i Postgres som frontend kan visualisere.

Planlagte tools (MVP):

| Tool | Beskrivelse |
|---|---|
| `get_exercise_info` | Henter detaljer om en øvelse (muskelgrupper, utstyr, vanskelighetsgrad). |
| `search_exercises` | Søker i øvelseskatalogen på filter. |
| `create_program` | Genererer strukturert treningsprogram basert på brukerens mål. |
| `log_workout` | Logger fullført økt med sett/reps/vekt. |
| `get_user_history` | Henter brukerens siste N økter. |
| `suggest_progression` | Foreslår neste vekt/reps basert på historikk og RPE. |
| `log_nutrition` | Logger måltid (enkel versjon; kan utvides). |

Senere tools (post-MVP): `analyze_form_video`, `schedule_workout`, `send_reminder`.

## Database-skjema (første utkast)

```sql
users (
  id uuid pk,
  email text unique,
  name text,
  locale text,         -- 'no' | 'en'
  persona_mode text,   -- 'friend' | 'sergeant' | 'analyst'
  goals jsonb,
  created_at timestamptz
)

exercises (
  id uuid pk,
  name text,
  muscle_groups text[],
  equipment text[],
  difficulty text,
  instructions text,
  source text          -- 'wger' | 'exercisedb' | 'custom'
)

programs (
  id uuid pk,
  user_id uuid fk,
  name text,
  generated_by text,   -- 'ai' | 'user'
  schedule jsonb,      -- dager, øvelser, rekkefølge
  created_at timestamptz
)

workouts (
  id uuid pk,
  user_id uuid fk,
  program_id uuid fk nullable,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  rpe int              -- 1-10
)

workout_sets (
  id uuid pk,
  workout_id uuid fk,
  exercise_id uuid fk,
  set_number int,
  reps int,
  weight_kg numeric,
  rpe int
)

conversations (
  id uuid pk,
  user_id uuid fk,
  created_at timestamptz
)

messages (
  id uuid pk,
  conversation_id uuid fk,
  role text,           -- 'user' | 'assistant' | 'tool'
  content jsonb,
  created_at timestamptz
)
```

pgvector-tabell for semantisk minne kommer hvis dere trenger det — i MVP holder det å sende siste N meldinger + siste N økter som kontekst.

## Frontend

**Next.js 15 (App Router)** gir SSR for landing page, god client-side realtime-støtte, og enkelt deploy til Vercel.

Viktige klient-komponenter:
- `<CoachSession>` — WebSocket-kobling til backend, audio capture/playback, state machine for samtalen.
- `<VoiceOrb>` — Canvas-basert visualisering som reagerer på amplitude via `AnalyserNode`.
- `<WorkoutLog>` — viser siste økter, lar bruker redigere logging.
- `<ProgramView>` — viser aktivt program og dagens økt.

Audio i nettleser:
- Capture: `MediaRecorder` eller `AudioWorkletNode` for raw PCM.
- Playback: `AudioContext` + `AudioBufferSourceNode` for streaming avspilling.

## Backend

**FastAPI** (Python 3.11+, async). Viktige endepunkter:

```
WS   /ws/voice           Voice-stream full loop
POST /api/chat           Fallback tekst-chat
POST /api/programs       Generer/oppdater program
GET  /api/workouts       Hent treningslogg
POST /api/workouts       Logg ny økt
GET  /api/exercises      Søk i katalog
POST /api/auth/login     Supabase Auth proxy
```

Async er ikke-valgfritt. Dere vil ha STT + LLM + TTS i parallell og streame data mellom dem. `asyncio.TaskGroup` + async generators.

## Tjenestevalg

| Lag | Tjeneste | Grunn |
|---|---|---|
| STT | Deepgram Nova-2 | Raskeste streaming, god norsk støtte. |
| LLM | Claude Sonnet 4.5 | God balanse kvalitet/hastighet/pris. Ikke Opus — for tregt til voice. |
| TTS (no) | ElevenLabs Flash | Beste norske stemmer. Dyrere. |
| TTS (en) | Cartesia Sonic | Raskest (~90ms), billigere. |
| DB | Supabase | Postgres + Auth + realtime i én tjeneste. |
| Frontend host | Vercel | Laget for Next.js. |
| Backend host | Railway/Fly.io | Enkel deploy av FastAPI. |

Abstraher TTS bak et interface slik at dere kan bytte per språk eller helt ut.

## Ikke-mål for MVP

For å unngå scope creep, eksplisitt IKKE i MVP:
- Ingen animert 3D-avatar (orb/waveform holder).
- Ingen form-sjekk fra video (pose estimation).
- Ingen integrasjon med Apple Health / Garmin / Strava.
- Ingen sosial feature (venner, leaderboards).
- Ingen kostholdsgjenkjenning fra bilde.

Alle disse er realistiske post-MVP, men hvert av dem er et ukeslangt prosjekt for seg.
