# Onboarding Redesign — Design Spec

**Status:** Draft for review
**Dato:** 2026-05-28
**Forfatter:** Trym (m/ Claude)

## Bakgrunn

Dagens onboarding er en 11-stegs wizard (`/onboarding/page.tsx`, 535 linjer) som samler basale brukerdata via skjema-felt. Den fungerer, men matcher ikke visjonen om "coach er kompis fra første sekund". Med Memory-arkitekturen + Profile-tab på plass og Coach-tab live, er det riktig tid å redesigne onboarding som en samtale med coach.

Denne spec'en erstatter dagens skjema-flyt med en chat-basert onboarding: etter kontoopprettelse drop'er coach inn og blir kjent med brukeren gjennom 10-15 meldinger. Quick-reply-knapper brukes der svaret er fra et fast sett.

## Mål

Når denne spec'en er implementert:
- Ny bruker oppretter konto (navn, epost, passord) på et enkelt skjema
- Coach starter umiddelbart en samtale på `/onboarding`
- Coach samler 8 felt (Tier 1 + Tier 2) gjennom samtale med quick-reply hvor relevant
- Når alle felter er fylt, coach erklærer onboarding ferdig og bruker redirectes til `/home`
- Hele samtalen lagres i `coach_sessions` og er synlig som første historiske samtale i Coach-tab

## Scope

**Tier 1 (kritisk — coach krever før completion):**
1. `goals` (multi-select)
2. `experience_level` (enum)
3. `training_days_per_week` (int 1-7)
4. `equipment` (multi-select / fritekst)

**Tier 2 (sterkt anbefalt — coach kan akseptere skip på disse):**
5. `weight_kg` (number)
6. `height_cm` (number)
7. `birth_date` (date)
8. `gender` (enum)

**Tier 3 (out of scope):** aktivitetsnivå, antall år trent, foretrukket tid, max varighet, skader, preferanser, constraints. Coach plukker opp organisk eller bruker legger inn manuelt i Profile.

## Overordnet flyt

```
[Klassisk signup-skjerm: fornavn, etternavn, epost, passord]
        ↓
[Supabase oppretter bruker → users.onboarding_status = "in_progress"]
        ↓
[Redirect til /onboarding]
        ↓
[Coach-chat starter automatisk]
        ↓
[Coach stiller spørsmål 1 → quick-reply knapper]
        ↓
[Bruker svarer → coach kaller save_profile_field tool]
        ↓
[Coach stiller neste spørsmål → ... → ...]
        ↓
[Etter 8 felter samlet: coach kaller complete_onboarding tool]
        ↓
[Backend setter onboarding_status = "complete"]
        ↓
[Coach sender avsluttende velkomstmelding]
        ↓
[Frontend redirect til /home]
```

**Adaptive regler:**
- Hvis bruker volunteres info ahead of time (f.eks. "jeg trener 4 ganger i uka" i svar på spørsmål 1), coach lagrer det og hopper over det spørsmålet senere.
- Bruker kan svare "hopp over" på Tier 2-felter. Coach lagrer NULL og fortsetter.
- Bruker kan stille side-spørsmål ("hva betyr middels?") — coach svarer kort og fortsetter.

## Spørsmålsrekkefølge med quick-replies

| # | Felt | Spørsmål-eksempel | Quick-replies |
|---|---|---|---|
| 1 | goals (multi) | "Hva er hovedmålet ditt med trening?" | Bygg muskler / Gå ned i vekt / Bli sterkere / Bedre kondis / Holde formen |
| 2 | experience_level | "Hvor lenge har du trent strukturert?" | Nybegynner (<1 år) / Middels (1-3 år) / Erfaren (3+ år) |
| 3 | training_days_per_week | "Hvor mange dager i uka kan du trene?" | 1-2 / 3-4 / 5-6 / 7 |
| 4 | equipment | "Hvor trener du? Hvilket utstyr har du?" | Treningssenter / Hjemmegym basic / Bare bodyweight / Annet (fritekst) |
| 5 | weight_kg | "Hvor mye veier du omtrent?" | Number-input (free text) |
| 6 | height_cm | "Hvor høy er du?" | Number-input |
| 7 | birth_date | "Når er du født?" | Date-picker eller fritekst |
| 8 | gender | "Hvilket kjønn?" | Mann / Kvinne / Vil ikke si |

Eksempel-flow:

```
Coach: "Hei Trym! Hyggelig å møte deg. Jeg er coach-en din, og jeg vil bli kjent
       med deg så jeg kan tilpasse treningen. Tar bare 3-4 minutter."
       [QR: La oss begynne / Hopp til senere]

User: [tapper "La oss begynne"]

Coach: "Bra! Hva er hovedmålet ditt med trening?"
       [QR: Bygg muskler / Gå ned i vekt / Bli sterkere / Bedre kondis / Holde formen]

User: [tapper "Bygg muskler"]
        ↓
Coach kaller save_profile_field(goals, ["build_muscle"])
        ↓
Coach: "Klassiker. Hvor lenge har du trent strukturert?"
       [QR: <1 år / 1-3 år / 3+ år]

...
```

## Quick-reply mekanikk

### SSE-protokoll-utvidelse

Ny event-type i `chat_stream`:

```
data: {"type": "quick_replies", "options": ["Option 1", "Option 2", ...]}
```

Coach signaliserer dette ved å kalle en ny tool:

```python
{
    "name": "set_quick_replies",
    "description": "Attach quick-reply buttons to your next response. Max 5 options.",
    "input_schema": {
        "type": "object",
        "properties": {
            "options": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["options"]
    }
}
```

Backend mapper tool-call til `quick_replies`-event. Frontend kobler knappene til siste assistant-melding.

### Persistens

`coach_messages.content` for assistant-melding utvides:

```json
{
  "text": "Hva er hovedmålet ditt?",
  "quick_replies": ["Bygg muskler", "Gå ned i vekt", "Bli sterkere", "Bedre kondis", "Holde formen"]
}
```

Når bruker tapper en knapp, sendes knapp-teksten som user-melding (vanlig flyt). Knappene forsvinner etter respons (de tilhørte den spesifikke meldingen).

## Backend-infrastruktur

### Migrasjon `009_onboarding_status.sql`

```sql
ALTER TABLE users
  ADD COLUMN onboarding_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'complete'));

ALTER TABLE coach_sessions
  ADD COLUMN is_onboarding BOOLEAN NOT NULL DEFAULT false;
```

`onboarding_status` settes til `in_progress` ved første POST til `/api/users/profile` (etter Supabase signup). Settes til `complete` av `complete_onboarding`-tool.

### Nye coach tools (kun aktive i onboarding-modus)

```python
{
    "name": "save_profile_field",
    "description": "Save a single field to the user's profile during onboarding.",
    "input_schema": {
        "type": "object",
        "properties": {
            "field": {
                "type": "string",
                "enum": ["goals", "experience_level", "training_days_per_week",
                         "weight_kg", "height_cm", "birth_date", "gender"]
            },
            "value": {"description": "Field value — type varies by field"}
        },
        "required": ["field", "value"]
    }
}

{
    "name": "add_equipment_batch",
    "description": "Add one or more equipment items.",
    "input_schema": {
        "type": "object",
        "properties": {
            "items": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["items"]
    }
}

{
    "name": "set_quick_replies",
    "description": "Attach quick-reply buttons to your next response.",
    "input_schema": {
        "type": "object",
        "properties": {
            "options": {"type": "array", "items": {"type": "string"}}
        },
        "required": ["options"]
    }
}

{
    "name": "complete_onboarding",
    "description": "Call when all 8 required fields are collected. Marks onboarding done.",
    "input_schema": {"type": "object", "properties": {}}
}
```

Validering i `complete_onboarding`-handler: sjekker at alle 4 Tier 1-felt er satt. Hvis ikke, returnerer en error som coach kan reagere på ("Vent, jeg trenger fortsatt målene dine før jeg kan fortsette").

### Onboarding-system-prompt

```
You are AI Coach in ONBOARDING MODE. You're meeting {first_name} for the first time.

Your job: warmly collect 8 profile fields through natural conversation.
Use save_profile_field() as each piece of data is confirmed.
Use set_quick_replies() before asking questions with fixed answer sets.
When ALL 8 fields are saved, call complete_onboarding().

FIELDS (in order):
TIER 1 (required — must collect):
1. goals (multi-select)
2. experience_level
3. training_days_per_week
4. equipment (use add_equipment_batch)

TIER 2 (recommended — allow skip):
5. weight_kg
6. height_cm
7. birth_date
8. gender

ADAPTIVE RULES:
- If user volunteers info ahead, save it and skip that question.
- Tier 2: allow "skip" answers. Save NULL and move on.
- Answer side-questions briefly without losing thread.
- After complete_onboarding succeeds, send a warm goodbye message.

PERSONALITY: Friend mode — warm, knowledgeable, slightly humorous.
Keep messages 1-3 sentences. Norwegian.
```

Backend velger denne prompten når `POST /api/chat/stream` body inkluderer `{"mode": "onboarding"}`.

### Route og state-management

- **`/onboarding` route** (ny): chat-UI tilpasset onboarding (deler komponenter med `/coach`, men har egen header med fremgangs-indikator: "3 av 8" eller liknende; ingen voice-knapp).
- **Middleware** (`web/src/middleware.ts`): hvis innlogget bruker har `onboarding_status != "complete"`, redirect alle ruter (unntatt `/login`, `/onboarding`, statics) til `/onboarding`.
- **Backend**: `POST /api/chat/stream` med ny body-felt `mode: "onboarding"` aktiverer onboarding-prompt og onboarding-tools.
- **Completion**: `complete_onboarding` setter `users.onboarding_status = "complete"`. Frontend ser endring via en `/api/users/onboarding-status`-polling eller via stream-event. Når complete, redirect til `/home`.

### Eksisterende kode som slettes

- `web/src/app/onboarding/page.tsx` (535 linjer) — erstattes helt med ny chat-side
- Eventuelle deler av `/api/users/profile`-POST som ikke lenger trengs (onboarding bruker `save_profile_field`-tool, ikke gammel POST-flyt)

Selve signup-skjermen (navn/epost/passord) flyttes til `/signup` som egen mini-route — i dag er det blandet inn i onboarding/page.tsx steg 0-2.

## Frontend-komponenter

```
web/src/app/signup/
  page.tsx                            # NY: signup-form (navn, epost, passord) — separat fra chat

web/src/app/onboarding/
  page.tsx                            # OMSKREVET: chat-basert
  OnboardingClient.tsx                # NY: chat-state for onboarding (deler logikk med CoachClient)

web/src/components/chat/
  QuickReplies.tsx                    # NY: knapperad under assistant-melding
  ChatBody.tsx                        # OPPDATERT: rendre quick_replies under melding hvis tilstede

web/src/lib/coach-stream.ts           # OPPDATERT: håndtere quick_replies-event
```

`OnboardingClient` arver mye fra `CoachClient` men:
- Skjuler 🎤 voice-knappen
- Skjuler "Ny samtale"-knappen
- Viser fremgangs-indikator i header
- Etter `complete_onboarding`-success, redirecter til `/home`
- Sender alltid `mode: "onboarding"` til backend

`QuickReplies.tsx`:

```tsx
"use client"
interface Props {
  options: string[]
  onSelect: (option: string) => void
  disabled?: boolean
}

export default function QuickReplies({ options, onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-2 ml-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-sm text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
```

## Suksesskriterier

- [ ] Ny bruker treffer signup-skjerm, oppretter konto, redirects til /onboarding
- [ ] Coach starter samtalen med velkomstmelding innen 2 sek
- [ ] Coach stiller spørsmål 1 med quick-reply-knapper
- [ ] Bruker tapper knapp → coach kaller save_profile_field
- [ ] Etter 8 felter samlet, coach kaller complete_onboarding
- [ ] users-tabellen oppdateres med riktige verdier
- [ ] Bruker redirectes til /home
- [ ] Senere åpning av Coach-tab viser onboarding-samtalen som første historiske session
- [ ] Profile-tab viser alle 8 verdiene
- [ ] Hvis bruker lukker fanen midt i, neste login resumer samtalen på /onboarding
- [ ] Middleware redirecter til /onboarding hvis bruker prøver å nå /home før completion
- [ ] Backend test: save_profile_field oppdaterer riktig felt
- [ ] Backend test: complete_onboarding setter status og validerer Tier 1
- [ ] Frontend test: QuickReplies-komponent rendres og sender riktig melding ved klikk
- [ ] `make check` passerer

## Out of scope

1. Tier 3-felt (activity_level, years_training, preferred_training_time, max_session_duration_min, skader, preferanser, constraints) — plukkes opp organisk eller via Profile
2. Voice-mode i onboarding
3. Avatar-opplasting i onboarding (flyttes til Profile)
4. Sosial sign-up (Google/Apple) — fortsatt epost+passord
5. Eksplisitt "begynn på nytt"-knapp midt i onboarding
6. Tvunget email-verifisering
7. Onboarding-analytics (drop-off-rate per spørsmål)
8. A/B-testing av spørsmål-rekkefølge
9. Multi-språk (kun norsk)
10. Coach-tilgang til memory tools (search_observations, etc.) under onboarding

## Risiko og avveininger

| Risiko | Avbøtning |
|---|---|
| Coach hopper over eller glemmer spørsmål | `complete_onboarding`-handler validerer Tier 1. Returnerer feilmelding hvis ufullstendig — coach må fortsette. |
| Bruker svarer veldig kort ("ja"/"ok") og coach mister kontekst | System-prompt instruerer eksplisitt re-spørring ved uklare svar |
| LLM-kostnad høy for onboarding | ~15 meldinger × Sonnet 4.5 m/prompt caching = under $0.10 per onboarding. Akseptabelt. |
| Bruker bruker for lang tid → drop-off | Vi sporer ikke i MVP. Hvis det blir et problem: shorter onboarding eller mer prominent "skip" |
| Coach kaller feil tool og lagrer feil verdi | Validering i tool-handler. Bruker kan rette opp via Profile etter onboarding. |
| Quick-reply-knapper står igjen i historikken | Akseptert — gir kontekst når brukeren senere skroller tilbake. |

## Avhengigheter

- `users.onboarding_status` + `coach_sessions.is_onboarding` migrasjon må kjøres før kode kan deployes
- Endring i `coach_stream` for å støtte `mode`-parameter og nye tools
- Ny `add_equipment_batch`-tool wrapper rundt eksisterende `user_equipment`-insert-logikk (samme DB-tabell som Profile bruker)

## Hva som blir neste spec etter denne

1. **Logging-flyt redesign** — slå sammen Log+Program
2. **Visuell design / premium feel** — design-system, farger, typografi, animasjoner
3. **Voice-to-text input** (Phase 2 av Coach) — Deepgram-integrasjon
4. **Proaktive coach-meldinger** — notification-infra
5. **"Hva husker du om meg?"** — Lag 2 visibility i Profile-tab
