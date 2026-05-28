# Profile-tab UI — Design Spec

**Status:** Draft for review
**Dato:** 2026-05-27
**Forfatter:** Trym (m/ Claude)

## Bakgrunn

Memory-arkitekturen ([2026-05-27-memory-architecture-design.md](./2026-05-27-memory-architecture-design.md)) la til Lag 1-tabeller for `user_injuries`, `user_preferences`, `user_equipment`, og `user_constraints`. I dag er disse tabellene tomme fordi det ikke finnes UI for å fylle dem. Coach er derfor "blind" på de viktigste tingene den lovet å respektere.

Denne spec-en gjør at brukeren kan:
1. Se og redigere alt coach vet om dem (Lag 1) via Profile-tab
2. Legge til 4 nye felt som finliner coach sin forståelse (activity_level, years_training, preferred_training_time, max_session_duration_min)

Når denne spec-en er implementert er Lag 1 levende data, og coach kan begynne å gi reelt personlig coaching.

## Struktur

Profile-tab er én scroll-bar side med **8 seksjoner**:

1. **Identitet** — read-only her (navn, email, fødselsdato, kjønn, avatar). Edit kommer i egen flow.
2. **Kropp** — vekt, høyde, aktivitetsnivå
3. **Treningsmål og erfaring** — mål, erfaringsnivå, antall år trent
4. **Treningsrutine** — frekvens, foretrukket tid, maks varighet per økt
5. **Utstyr** — liste av tilgjengelig utstyr
6. **Skader og begrensninger** — aktive skader + constraints
7. **Preferanser** — like/dislike-liste
8. **Konto** — logg ut

Brukeren scroll-er gjennom. Hver redigerbar verdi har en blyant-ikon (✏) eller hele raden er tappbar. Listene har "+ Legg til"-knapp og tappbare rader.

## Edit-mønster: Modal sheets everywhere

Tapp på enhver redigerbar verdi → bottom sheet glir opp med form → Save eller Avbryt.

- Bottom sheet bruker eksisterende `radix-ui` (allerede installert)
- Sheet dekker ~60% av skjermen, glir opp fra bunnen
- Header: tittel + close
- Body: skjema
- Footer: "Avbryt" + "Lagre"

Konsistent for alle felt — enkle (vekt), valg (segment-picker), multi-select (mål), og listeelementer (skader).

## Per-seksjon detaljer

### 1. Identitet (read-only)

Viser:
- Avatar + `first_name + last_name`
- Email

Ingen edit i denne spec'en. Edit-flow for identitet kommer senere.

### 2. Kropp

| Felt | Type | Edit |
|---|---|---|
| `weight_kg` | NUMERIC(5,2) | Sheet med number-input + "kg" suffiks |
| `height_cm` | INTEGER | Sheet med number-input + "cm" suffiks |
| `activity_level` (NY) | TEXT enum | Sheet med radio: `sedentary` / `light` / `moderate` / `very_active` |

### 3. Treningsmål og erfaring

| Felt | Type | Edit |
|---|---|---|
| `goals` | TEXT[] | Sheet med multi-select chips (5 valg fra eksisterende `GOAL_LABELS`) |
| `experience_level` | TEXT enum | Sheet med radio: `beginner` / `intermediate` / `advanced` |
| `years_training` (NY) | INTEGER | Sheet med number-input + "ikke sikker"-toggle (NULL) |

### 4. Treningsrutine

| Felt | Type | Edit |
|---|---|---|
| `training_days_per_week` | INTEGER (1-7) | Sheet med segment-picker for 1-7 |
| `preferred_training_time` (NY) | TEXT enum | Sheet med radio: `morning` / `lunch` / `evening` / `flexible` |
| `max_session_duration_min` (NY) | INTEGER | Sheet med segment: 30 / 45 / 60 / 75 / 90 / `no_limit` (NULL) |

### 5. Utstyr

- Liste av equipment-strings ("barbell", "dumbbells_20kg", ...)
- "+ Legg til" → sheet med:
  - Tekstinput for custom equipment
  - Preset-knapper: "Hjemmegym basic" / "Treningssenter" / "Bare bodyweight" — legger til et sett med vanlige verdier
- Tapp eksisterende rad → sheet med "Slett"

### 6. Skader og begrensninger

To separate lister i samme seksjon:

**Skader (`user_injuries`):**
- Hver rad: body_part + beskrivelse-snippet + severity-badge
- "+ Legg til skade" → sheet med:
  - Body part (text-input med autocomplete fra vanlige: "venstre kne", "høyre skulder", etc.)
  - Beskrivelse (textarea, valgfri)
  - Alvorlighetsgrad: radio (`lett` / `moderat` / `alvorlig`)
  - `started_at`: date-picker
- Tapp eksisterende → sheet med edit-felter + "Markér som leget"-knapp (sett `is_active=false`)

**Begrensninger (`user_constraints`):**
- Hver rad: type-badge + description
- "+ Legg til begrensning" → sheet med:
  - Type (radio: `schedule` / `duration` / `frequency`)
  - Beskrivelse (textarea)
- Tapp eksisterende → sheet med edit + slett

### 7. Preferanser

- Hver rad: kategori-badge + preference-tekst
- "+ Legg til preferanse" → sheet med:
  - Kategori (radio: `exercise` / `time` / `intensity` / `other`)
  - Beskrivelse (textarea)
- Tapp eksisterende → sheet med edit + slett

### 8. Konto

- Logg ut (eksisterende `LogoutButton`)
- "Slett konto" og "Eksport data" — deferred

## DB-migrasjon

`api/db/migrations/008_profile_fields.sql`:

```sql
-- api/db/migrations/008_profile_fields.sql
-- Add 4 new fields to users for finer-grained coach context.

ALTER TABLE users
  ADD COLUMN activity_level             TEXT,
  ADD COLUMN years_training             INTEGER,
  ADD COLUMN preferred_training_time    TEXT,
  ADD COLUMN max_session_duration_min   INTEGER;
```

Alle 4 nullable. Backwards-kompatibelt med eksisterende data.

## Backend-API-kontrakt

### Utvidet: `GET /api/users/profile`

Eksisterende endpoint utvides til å returnere alle Lag 1-data i én response:

```json
{
  "id": "...",
  "first_name": "Trym",
  "last_name": "Vestengen",
  "email": "...",
  "goals": ["build_muscle"],
  "experience_level": "intermediate",
  "training_days_per_week": 4,
  "gender": "male",
  "birth_date": "1995-...",
  "height_cm": 180,
  "weight_kg": 75.5,
  "avatar_url": null,

  "activity_level": "moderate",
  "years_training": 3,
  "preferred_training_time": "evening",
  "max_session_duration_min": 60,

  "injuries": [
    {
      "id": "...",
      "body_part": "venstre kne",
      "description": "vondt ved dyp knebøy",
      "severity": "moderat",
      "started_at": "2019-03-01",
      "is_active": true
    }
  ],
  "preferences": [
    {"id": "...", "category": "exercise", "preference": "liker ikke beinpress"}
  ],
  "equipment": ["barbell", "dumbbells_20kg"],
  "constraints": [
    {"id": "...", "type": "schedule", "description": "kun tirs/tors/lør"}
  ]
}
```

### Ny: `PATCH /api/users/profile`

Partial update av users-tabellen. Body: `{ <field_name>: <new_value>, ... }`.

Whitelist av tillatte felt:
- `first_name`, `last_name` (når edit-identitet-flow er på plass — kan inkluderes nå men UI bruker det ikke)
- `goals`, `experience_level`, `training_days_per_week`
- `height_cm`, `weight_kg`
- `activity_level`, `years_training`, `preferred_training_time`, `max_session_duration_min`

Ikke tillatt: `id`, `email`, `created_at`, `persona_mode` (egen flow).

Response: oppdatert profil (full struktur som GET).

### Nye CRUD-endepunkter

```
POST   /api/users/injuries
       body: { body_part, description?, severity?, started_at?, is_active? }
       response: { id, ...full row }

PATCH  /api/users/injuries/{id}
       body: any subset of fields
       response: { id, ...full row }

DELETE /api/users/injuries/{id}
       response: { status: "deleted" }

POST   /api/users/preferences
       body: { category, preference }
       response: { id, ...full row }

PATCH  /api/users/preferences/{id}
DELETE /api/users/preferences/{id}

POST   /api/users/equipment
       body: { equipment: "barbell" }
       response: { equipment }

DELETE /api/users/equipment/{equipment}
       response: { status: "deleted" }

POST   /api/users/constraints
       body: { type, description }

PATCH  /api/users/constraints/{id}
DELETE /api/users/constraints/{id}
```

Alle endepunkter:
- Krever Supabase JWT (eksisterende auth-pattern via `get_current_user_id`)
- Bruker `user_id` fra token, aldri fra body
- 401 hvis ikke autentisert
- 404 hvis ressurs ikke tilhører brukeren

## Frontend-komponenter

### Filstruktur

```
web/src/app/(tabs)/profile/
  page.tsx                          # Server-rendered hovedside

web/src/components/profile/
  ProfileSection.tsx                # Wrapper: tittel + barn
  ProfileField.tsx                  # Én rad: label + value + chevron
  ProfileList.tsx                   # Liste med "+ Legg til" + tappbare rader
  LogoutButton.tsx                  # eksisterende, beholdes
  sheets/
    EditTextSheet.tsx               # Generisk: edit én tekst-/number-/textarea-verdi
    EditChoiceSheet.tsx             # Generisk: radio/segment pick
    EditMultiSelectSheet.tsx        # Multi-select chips (mål)
    EditInjurySheet.tsx             # Skjemaspesifikt: skader
    EditConstraintSheet.tsx         # Skjemaspesifikt: constraints
    EditPreferenceSheet.tsx         # Skjemaspesifikt: preferanser
    EquipmentSheet.tsx              # Utstyr med presets + custom

web/src/lib/profile.ts              # API-klienter for alle nye endepunkter
```

### Komponent-prinsipper

- **Server-rendered hovedside** (`page.tsx`) henter `GET /api/users/profile` og rendrer alle seksjoner.
- **Client-wrappers per seksjon** håndterer sheet-state og kaller API.
- **Optimistisk update er IKKE MVP** — etter Save: kall API → `router.refresh()` → server-side re-render. Litt mer latency, mye enklere kode.
- **Tailwind v4 + shadcn-stil** for styling. Gjenbruker eksisterende fargepalett.
- **Hvert sheet er en separat fil** så de er lette å forstå og endre.

## Validering og feilhåndtering

**Frontend:**
- HTML5-validering (required, min, max, pattern) på inputs
- Disable Save-knapp hvis form er invalid
- Ingen toast/snackbar i MVP — silent success via refresh, error via inline melding under save-knappen

**Backend:**
- Validering på alle PATCH/POST endpoints (whitelist av felt, enum-sjekk på severity/category/type, etc.)
- 400 med JSON-error hvis input invalid
- 401 hvis auth feiler
- 404 hvis ressurs ikke finnes eller ikke tilhører brukeren

## Suksesskriterier

- [ ] Brukeren kan åpne Profile og se alle 8 seksjoner
- [ ] Brukeren kan tappe et redigerbart felt → endre verdi i sheet → save → seksjonen oppdateres
- [ ] Brukeren kan legge til, redigere, og slette skader, preferanser, utstyr, constraints
- [ ] Coach (via `get_user_profile`-tool) får automatisk de nye dataene i base context fra første samtale etter brukerens edit
- [ ] Migrasjon `008_profile_fields.sql` legger til 4 nye kolonner uten å bryte eksisterende profiler
- [ ] Alle nye endepunkter har pytest-tester (mocked DB)
- [ ] Alle nye sheet-komponenter har Vitest-smoketester
- [ ] `make check` passerer
- [ ] Cascade delete fortsetter å funke

## Out of scope

Disse er IKKE en del av denne spec'en:

1. "Hva husker du om meg?"-visning av Lag 2 coach memory
2. Edit av identitet (navn/email/birth_date/gender/avatar)
3. Slett konto + eksport data
4. Notification preferences
5. Body composition fields (body fat %)
6. Visuell polish / premium feel
7. Onboarding-flow oppdatering (de 4 nye feltene legges inn i Profile, ikke i onboarding)
8. Avatar-opplasting
9. i18n (engelsk-variant)
10. RLS-policies for de 4 Lag 1-tabellene

## Hva som blir neste spec etter denne

I prioritert rekkefølge:

1. **Coach-tab UX** — chat-interaksjon, tool-use-visualisering, voice-knapp. Det største løftet fra visjonen som fortsatt mangler.
2. **Onboarding-redesign** — inkluder de 4 nye feltene i onboarding (etter Profile er live)
3. **Logging-flyt redesign** — slå sammen Log + Program (en av visjonens beslutninger)
4. **Visuell design / premium feel** — design-system, farger, typografi
