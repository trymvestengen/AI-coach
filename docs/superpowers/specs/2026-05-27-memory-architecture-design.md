# Coach Memory-arkitektur — Design Spec

**Status:** Draft for review
**Dato:** 2026-05-27
**Forfatter:** Trym (m/ Claude)

Denne spec-en definerer hvordan AI-coachen lagrer, henter, og oppdaterer kunnskap om brukeren. Den er den foundational sub-prosjekt-spec-en etter [produkt-visjonen](./2026-05-27-product-vision-design.md) — alle andre features (coach-tab UX, logging-flyt, onboarding) bygger på det som defineres her.

## Bakgrunn

Visjonen lovet en coach som "lærer deg å kjenne over tid og blir smartere — ikke bare større". Det krever en hukommelses-arkitektur som:

- Lagrer brukerens egne fakta (skader, preferanser, mål) — autoritativt og bruker-styrt
- Lagrer coach sine observasjoner og sammendrag — AI-styrt, vokser over tid
- Lar coach hente relevant kontekst raskt for hvert svar
- Skalerer fra dag 1 (få data) til år 3 (mange tusen observasjoner per bruker)

Denne spec-en låser DB-schema, write/read-strategier, og brukerkontroll.

## Arkitektur i én tegning

```
┌─────────────────────────────────────────────────────────────────┐
│                         COACH (LLM)                              │
│  Får kontekst, bruker tools, skriver tilbake til DB              │
└────────────┬────────────────────────────────┬───────────────────┘
             │ leser fra                       │ skriver til
             ▼                                 ▼
┌─────────────────────────┐        ┌─────────────────────────┐
│  LAG 1: PROFIL          │        │  LAG 2: COACH MEMORY    │
│  (bruker-styrt)         │        │  (AI-styrt)             │
├─────────────────────────┤        ├─────────────────────────┤
│ • users (utvidet)       │        │ • workout_sets          │
│ • user_injuries         │        │   .coach_note (NY)      │
│ • user_preferences      │        │ • workouts              │
│ • user_equipment        │        │   .coach_summary (NY)   │
│ • user_constraints      │        │ • coach_sessions        │
│                         │        │ • coach_messages        │
│ Liten, strukturert      │        │ • coach_observations    │
│ UI: Profile-tab         │        │ Stor, fri tekst         │
│                         │        │ UI: usynlig (MVP)       │
└─────────────────────────┘        └─────────────────────────┘
```

**Lag 1** er autoritativt for "hva brukeren har sagt om seg selv". Coach leser fra og respekterer alltid disse. Coach kan FORESLÅ endringer (via observasjon med category="injury_hint"), men aldri endre Lag 1 uten brukerens samtykke.

**Lag 2** er coach sine egne observasjoner og sammendrag. Coach skriver hit. Bruker ser dem ikke direkte i MVP, men eier dataen (kan eksportere/slette).

## Schema-detaljer

### Lag 1: Profil-utvidelser

Eksisterende `users`-tabell beholdes som er. Fire nye tabeller:

```sql
-- Brukerens skader (kan ha flere, aktive og passive)
CREATE TABLE user_injuries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body_part    TEXT NOT NULL,
  description  TEXT,
  severity     TEXT,
  started_at   DATE,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Brukerens preferanser
CREATE TABLE user_preferences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,
  preference   TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Brukerens tilgjengelige utstyr
CREATE TABLE user_equipment (
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  equipment    TEXT NOT NULL,
  PRIMARY KEY (user_id, equipment)
);

-- Brukerens begrensninger
CREATE TABLE user_constraints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  description  TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

### Lag 2: Coach memory

To kolonne-utvidelser på eksisterende tabeller (backwards-kompatibelt):

```sql
ALTER TABLE workout_sets ADD COLUMN coach_note TEXT;
ALTER TABLE workouts ADD COLUMN coach_summary TEXT;
```

Tre nye tabeller:

```sql
-- Logisk gruppering av meldinger til en "samtale"
CREATE TABLE coach_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  summary         TEXT,
  workout_id      UUID REFERENCES workouts(id)
);

-- Faktiske chat-meldinger (kilde-til-sannhet for samtale-historikk)
CREATE TABLE coach_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,            -- "user", "assistant", "tool_use", "tool_result"
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Coach observasjoner (real-time skriving, kategorisert)
CREATE TABLE coach_observations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category           TEXT NOT NULL,
  observation        TEXT NOT NULL,
  confidence         TEXT,
  source_session_id  UUID REFERENCES coach_sessions(id),
  source_workout_id  UUID REFERENCES workouts(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_confirmed_at  TIMESTAMPTZ,
  is_promoted        BOOLEAN DEFAULT false
);
```

`coach_observations.category` enum-verdier (foreløpig, kan utvides):
- `pattern` — observert mønster i atferd ("trener bedre om morgenen")
- `injury_hint` — coach mistenker skade, men ikke bekreftet av bruker
- `preference_hint` — coach mistenker preferanse
- `energy_level` — observasjoner om dagsform
- `form_issue` — teknikk-relaterte observasjoner
- `milestone` — fremgang-merkesteiner
- `other` — annet

### Indekser (kommer i implementeringsplan)

Forventet read-mønster gir disse indeksene:
- `coach_observations(user_id, category, created_at DESC)` — for filtrering på kategori og tid
- `coach_observations(user_id, source_workout_id)` — for å hente observasjoner knyttet til en spesifikk økt
- `coach_sessions(user_id, last_activity_at DESC)` — for "siste samtaler"
- `coach_messages(session_id, created_at)` — for å hente meldinger i en sesjon kronologisk
- `user_injuries(user_id, is_active)` — for aktive skader

## Read-strategi

Coach henter kontekst på tre nivåer:

### 1. Always-on base context

Injectes ved hver coach-request. Liten nok til å alltid være med:

- Brukerens profil (navn, locale, persona, mål)
- Aktive skader (`user_injuries WHERE is_active = true`)
- Alle preferanser
- Tilgjengelig utstyr
- Alle constraints
- Aktivt program (struktur og målsetninger)
- Siste 3 økter — kort sammendrag av hver

Estimert størrelse: ~500–1500 tokens.

### 2. Tool-callable context

Coach har tools for å hente mer på etterspørsel:

```
get_workout_history(exercise_id, limit=10)
get_recent_sessions(days=30)
search_observations(category=None, days=90, limit=20)
get_full_workout_detail(workout_id)
get_progression(exercise_id, weeks=12)
```

Coach kaller disse når den trenger dypere innsikt. Spart kontekst per request.

### 3. Semantic search (FREMTID, ikke MVP)

Når Lag 2 vokser stort:
- Embedding-kolonner på `coach_observations`, `workouts.coach_summary`, `coach_sessions.summary`
- pgvector i Supabase
- Ny tool: `semantic_search(query, n=10)`

Schema designet slik at embedding-kolonner kan legges til senere uten data-migrasjon-trøbbel.

## Write-strategi

Hybrid: real-time tool calls for observasjoner og logging, batch jobs for sammendrag.

### Real-time (tool calls fra coach midt i samtale)

```
write_observation(category, observation, confidence, related_workout_id=None)
log_set_with_note(workout_id, exercise_id, set_number, reps, weight, rpe, coach_note)
suggest_profile_update(category, value, reason)
  → Aldri direkte skriv til Lag 1. Lager observation med category="injury_hint"
    eller "preference_hint" og spør brukeren.
```

### Batch (event-triggered eller cron)

```
generate_workout_summary(workout_id)
  → Triggered når workouts.completed_at settes
  → LLM-call: alle sett + notes + chat → UPDATE workouts SET coach_summary

summarize_session(session_id)
  → Triggered når sesjon idle > 30 min
  → LLM-call: alle meldinger → UPDATE coach_sessions SET summary, ended_at

compress_old_memory()  -- FREMTID
  → Lifecycle management for memory > 6 mnd
```

### Hvorfor hybrid

- Per-økt og per-samtale-sammendrag krever at noe er ferdig å oppsummere — batch er naturlig.
- Observasjoner og per-sett-notes må skje i øyeblikket for å fange konteksten. Real-time er nødvendig.

## Brukerkontroll og GDPR

**Lag 1 (Profil):** Full bruker-kontroll via Profile-tab. Bruker legger til, redigerer, sletter.

**Lag 2 (Coach memory):** Lagres på brukerens egen rad — full eierskap, men ikke synlig i UI i MVP.

**Hva må være på plass i MVP:**

- [ ] Slett-konto-funksjon cascade-er til alle Lag 1 og Lag 2 tabeller via `ON DELETE CASCADE` på `user_id`
- [ ] Eksport-endpoint som returnerer alle data om brukeren som JSON

**Hva utsettes til senere:**

- "Hva husker du om meg?"-UI (read-only liste av observations på Profile-tab)
- "Promote observation → profile fact"-flow
- "Glem dette"-knapp på individuelle observations

**Hva vi IKKE gjør:**

- La coach skrive til Lag 1 uten samtykke
- Slette eller redigere `workout_sets`/`workouts` (historiske fakta er immutable)

## Tool-interface for coach

Coach trenger disse tool-ene definert i `api/app/tools/definitions.py` og implementert i `api/app/tools/handlers.py`. Eksisterende tools beholdes (get_exercise_info, search_exercises, create_program, log_workout) — vi utvider listen.

### Read-tools (nye)

```python
get_user_profile()
  # Returnerer full Lag 1 inkludert skader, preferanser, utstyr, constraints

get_workout_history(exercise_id=None, limit=10)
  # Returnerer siste N workouts (med eller uten filter på øvelse)
  # Inkluderer workout_sets med coach_note og workouts.coach_summary

get_recent_sessions(days=30, limit=10)
  # Returnerer coach_sessions.summary for siste N dager

search_observations(category=None, days=90, limit=20)
  # Filtrerer coach_observations på kategori og tid

get_progression(exercise_id, weeks=12)
  # Returnerer tidsserie: maks vekt, total volume, snitt RPE per uke
```

### Write-tools (nye)

```python
write_observation(category, observation, confidence="medium", related_workout_id=None)
  # INSERT INTO coach_observations

log_set_with_note(workout_id, exercise_id, set_number, reps, weight_kg, rpe=None, coach_note=None)
  # INSERT INTO workout_sets med coach_note utfylt
  # Hvis coach skal logge sett under aktiv økt

suggest_profile_update(category, value, reason)
  # IKKE direkte update — lager observation med hint-category
  # Bruker må eksplisitt godkjenne for at det skal flyttes til Lag 1
```

### Write-tools (oppdatert)

```python
log_workout (eksisterende)
  # Utvides slik at coach kan inkludere coach_note per sett og coach_summary
  # på selve workout-en, ikke kun strukturert data
```

## Out of scope

Disse er IKKE en del av denne spec-en:

1. Embeddings / pgvector / semantic search
2. UI for å se/redigere coach memory (Profile-tab forblir Lag 1-only)
3. Lifecycle management (compress_old_memory og liknende)
4. Profile-tab UI design (hvordan skader/preferanser legges inn i UI — egen spec)
5. Coach-tab UI design (chat-interaksjon med tool-use-visualisering — egen spec)
6. Voice integration
7. Konkrete coach system-prompts (hvordan vi instruerer coach om å bruke tools)
8. Performance/scale-testing

## Suksesskriterier

Når denne spec-en er implementert, skal:

- [ ] Coach kunne logge et sett med både strukturert data OG fri-tekst coach_note i én tool call
- [ ] Coach kunne skrive en observation midt i samtale uten å bryte flyten
- [ ] Per-økt-sammendrag genereres automatisk innen 30 sek etter `workouts.completed_at` settes
- [ ] Per-samtale-sammendrag genereres for sesjoner som har vært idle > 30 min
- [ ] Coach base context (profil + skader + preferanser + utstyr + siste 3 økter) skal være < 2000 tokens
- [ ] Coach skal kunne svare på "hvordan har knebøy utviklet seg?" ved å kalle `get_progression`-tool og få korrekt data
- [ ] Sletting av bruker-konto cascader til alle Lag 1 og Lag 2-data (ingen waisenrader)
- [ ] Eksisterende workouts og workout_sets fortsetter å funke (kun ADD COLUMN, ikke endre eksisterende)
- [ ] Pytest-dekning for alle nye tool-handlers + DB-migrasjoner

## Avhengigheter og rekkefølge for implementering

For at denne spec-en kan implementeres, må:

1. **DB-migrasjon** kommer først — én ny migrasjonsfil (`007_memory_architecture.sql`) som inneholder alle CREATE TABLE og ALTER TABLE
2. **Tool definitions + handlers** for nye read-tools (deretter write-tools)
3. **Base-context-builder** — funksjon som setter sammen always-on context for hver coach-request
4. **Batch jobs** for summaries — kan implementeres som API-endpoint trigger først, FastAPI background task. Cron senere.
5. **System-prompt-oppdatering** for coach — fortelle den når den bør bruke hvilke tools

Implementeringsplanen brytes ned i bite-sized tasks for hver av disse.
