# Onboarding Wizard — Design Spec

**Status:** Draft for review
**Dato:** 2026-06-02
**Forfatter:** Trym (m/ Claude)

## Bakgrunn

Tidligere spec ([2026-05-28-onboarding-redesign-design.md](2026-05-28-onboarding-redesign-design.md)) skisserte en chat-basert onboarding ledet av coachen. Under smoke-test viste det seg at LLM-styrt skjemainnsamling er sårbar (modellen kan hoppe over felter, glemme quick-replies, generere uventede meldinger), og det er ikke verdt usikkerheten for en kritisk førstegangs-opplevelse.

Denne spec'en erstatter chat-onboardingen med en klassisk wizard: ett spørsmål per skjerm, forutsigbar progresjon. Backend-infrastrukturen fra forrige spec gjenbrukes (migrasjon 009, `onboarding_status`-feltet, middleware-redirect). Chat-spesifikk kode rives ut.

## Mål

Når denne spec'en er implementert:
- Ny bruker går gjennom 13 spørsmålsskjermer (+ en avsluttende oppsummering) på under 3 minutter og lander på `/home` med fullstendig profil
- Konto opprettes på steg 3 (etter navn + epost + passord) — coach kan tiltale brukeren ved navn fra steg 4
- Brukeren kan navigere bakover og rette opp tidligere svar
- Refresh midt i flowen taper ikke fremgang (state lagres i localStorage før signup og i DB etter)
- Profile-tab viser alle 8 obligatoriske felter etterpå

## Scope

**3 signup-skjermer (steg 1-3, oppretter Supabase Auth-bruker på steg 3):**
1. Navn (fornavn + etternavn) — tekst
2. Epost — tekst
3. Passord — tekst (min 6 tegn) → trigger Supabase signUp

**8 obligatoriske personaliseringsskjermer (steg 4-11):**
4. `goals` (multi-select) — bygg muskler, gå ned i vekt, bli sterkere, kondis, holde formen
5. `experience_level` (enum) — nybegynner, middels, erfaren
6. `training_days_per_week` (enum) — 1-2, 3-4, 5-6, 7
7. `equipment` (multi-select med fritekst-fallback) — treningssenter, hjemmegym basic, bare bodyweight, annet
8. `gender` (enum) — mann, kvinne, vil ikke si
9. `birth_date` — datepicker
10. `height_cm` — number input
11. `weight_kg` — number input

**2 valgfrie skjermer (steg 12-13):**
12. Skader — fritekst eller "hopp over"
13. Preferanser — fritekst eller "hopp over"

**14. Sluttskjerm:** Oppsummering ("Alt klart, Trym!") + "Kom i gang"-knapp → `/home`

**Ikke i scope:** activity_level, years_training, preferred_training_time, max_session_duration_min (samlet inn senere via Profile-tab eller organisk i coach-samtaler).

## Flyt

```
[Bruker treffer /onboarding eller blir redirected dit]
        ↓
[Steg 1: Navn] → localStorage
        ↓
[Steg 2: Epost] → localStorage
        ↓
[Steg 3: Passord → Supabase auth.signUp() ]
        ↓
[Backend POST /api/users/profile (oppretter users-rad, onboarding_status='in_progress')]
        ↓
[Steg 4-11: 8 obligatoriske felter, hver PATCH'es til /api/users/profile på "Neste"]
        ↓
[Steg 12-13: 2 valgfrie felter, "hopp over" mulig]
        ↓
[Steg 14: Sluttskjerm — POST /api/users/onboarding/complete → onboarding_status='complete']
        ↓
[Redirect til /home]
```

**Navigasjon:**
- "Neste"-knapp er disabled til feltet har gyldig verdi
- Tilbake-pil øverst venstre på steg 2+ (signup-stegene 2 og 3 kan også gå tilbake — ingenting er commited før signUp på steg 3)
- Etter signup (steg 4+) kan brukeren også gå tilbake, men signup-skjermene kan ikke nås på nytt (vi vil ikke gi inntrykk av at de kan endre epost via tilbake-pil)
- Lukker fanen midt i: ved retur lastes siste lagrede state og brukeren plasseres på sitt forrige steg

**Visuell stil:** matcher eksisterende app — mørk bakgrunn (#0d0d0d), oransje aksent (#ff6b35), store pill/card-knapper, system-font.

**Progresjon:**
- Steg 1-3 (signup): subtil "1/3", "2/3", "3/3" tekst øverst, ingen synlig bar
- Steg 4-11 (obligatorisk): segment-bar med 8 segmenter, fyller seg ettersom man kommer videre
- Steg 12-13 (valgfri): segment-baren får 2 ekstra segmenter, men markert med stiplet kant
- Steg 14: ingen bar, full status

## Datamodell

### Brukes som er

`users`-tabellen har allerede alle nødvendige kolonner:
- `id`, `email`, `first_name`, `last_name`, `goals`, `experience_level`, `training_days_per_week`, `gender`, `birth_date`, `height_cm`, `weight_kg`, `onboarding_status`

`user_equipment`-tabellen finnes allerede (fra migrasjon 007).

Fra forrige spec/PR:
- `users.onboarding_status` (`not_started` / `in_progress` / `complete`) — migrasjon 009
- `coach_sessions.is_onboarding` — migrasjon 009 (vil fortsatt ligge der men brukes ikke; ingen verdi i å droppe)

### Nye kolonner

```sql
-- api/db/migrations/010_user_notes.sql
ALTER TABLE users
  ADD COLUMN injury_notes      TEXT,
  ADD COLUMN preference_notes  TEXT;
```

Disse erstatter de tunge `user_injuries` / `user_preferences`-tabellene for onboarding-bruk. Brukeren skriver fritekst, AI'en kan plukke fra det. (`user_injuries`-tabellen beholdes for strukturerte skader brukeren legger inn i Profile senere.)

### Eksisterende endepunkter som gjenbrukes

- `POST /api/users/profile` (upsert) — kalles fra steg 3 (etter Supabase signUp) for å lage backend-raden
- `PATCH /api/users/profile` — kalles fra hver av stegene 4-11 og 12-13 ettersom brukeren går videre
- `GET /api/users/profile` — leses av middleware og av wizard-page for å bestemme hvor brukeren skal lande

### Nytt endepunkt

```python
POST /api/users/onboarding/complete
# Setter onboarding_status='complete'. Krever at obligatoriske felter er satt; returnerer 400 hvis ikke.
```

## Backend-endringer

### Tas i bruk fra forrige PR

- Migrasjon 009 (onboarding_status, is_onboarding) — beholdes som-er
- Middleware-redirect logikk — beholdes (`web/src/middleware.ts`)
- `users.onboarding_status` i `GET /api/users/profile`-respons — beholdes

### Slettes (chat-spesifikk kode som ikke lenger trengs)

- `api/app/tools/onboarding_definitions.py`
- `api/app/tools/onboarding_handlers.py`
- `api/tests/test_onboarding_handlers.py`
- `ONBOARDING_PROMPT`-konstanten i `api/app/services/coach.py`
- `mode="onboarding"`-grenen i `chat_stream` (inkludert `set_quick_replies`-håndtering og `quick_replies` SSE-event-mapping)
- `mode`-feltet i `/api/chat/stream`-routeren
- `_get_first_name`-hjelpefunksjonen (var bare brukt av onboarding-prompten)
- Onboarding-routing av `save_profile_field`, `add_equipment_batch`, `complete_onboarding` i `handle_tool` — slettes
- Relaterte tester (`test_chat_stream.py` — onboarding-mode-, user_id-, quick_replies-, is_onboarding-testene)

### Nytt

- Migrasjon 010 (injury_notes + preference_notes)
- `POST /api/users/onboarding/complete`-endepunkt
- `PATCH /api/users/profile` må whiteliste `injury_notes` og `preference_notes`

### `chat_stream` ryddes tilbake til opprinnelig form

`chat_stream`-funksjonen returnerer til pre-onboarding-versjonen: ingen `mode`-parameter, ingen onboarding-tools, ingen quick_replies-event-typen, ingen `is_onboarding`-flagg ved sesjon-opprettelse. Den eneste arven fra forrige PR som beholdes i `chat_stream` er fiksen `return str(row[0])` i `_ensure_session` (UUID→string-serialisering, generell bug-fiks).

`api/app/db.py` beholder `prepare_threshold=None`-fiksen (PgBouncer-kompatibilitet, ingen onboarding-spesifikt).

## Frontend-arkitektur

### Routestruktur

```
/login         (eksisterende — uendret)
/onboarding    (NY — single route, inneholder hele 13-stegs wizard)
/home          (eksisterende — uendret)
```

`/signup`-routen fra forrige PR fjernes. Steg 1-3 av wizarden er den nye "signup-opplevelsen".

### Komponentstruktur

```
web/src/app/onboarding/
  page.tsx                      # Server component: auth-check + redirect-logikk + render wizard
  OnboardingWizard.tsx          # Client: stegvis state-maskin, navigering, persistens
  steps/
    StepName.tsx                # Steg 1
    StepEmail.tsx               # Steg 2
    StepPassword.tsx            # Steg 3 (kaller Supabase signUp)
    StepGoals.tsx               # Steg 4
    StepExperience.tsx          # Steg 5
    StepFrequency.tsx           # Steg 6
    StepEquipment.tsx           # Steg 7
    StepGender.tsx              # Steg 8
    StepBirthDate.tsx           # Steg 9
    StepHeight.tsx              # Steg 10
    StepWeight.tsx              # Steg 11
    StepInjuries.tsx            # Steg 12 (valgfri)
    StepPreferences.tsx         # Steg 13 (valgfri)
    StepDone.tsx                # Steg 14 (sluttskjerm)
  components/
    ProgressBar.tsx             # Segment-bar
    BackArrow.tsx               # Tilbake-knapp øverst
    NextButton.tsx              # Standard "Neste"-knapp (orange, disabled-state)
    SkipLink.tsx                # "Hopp over →"-lenke under Neste
```

Hver step-komponent er en kontrollert input-komponent som tar `value`, `onChange`, `onNext`, `onBack`. State (svar fra alle steg) bor i `OnboardingWizard`-roten.

### State-management

`OnboardingWizard` holder:

```tsx
interface WizardState {
  step: number  // 1-14
  firstName: string
  lastName: string
  email: string
  password: string
  // Felter 4-11
  goals: string[]
  experienceLevel: string
  trainingDaysPerWeek: number | null
  equipment: string[]
  gender: string
  birthDate: string  // YYYY-MM-DD
  heightCm: number | null
  weightKg: number | null
  // Felter 12-13 (valgfrie)
  injuryNotes: string  // tom = ikke fylt ut, men "hopp over" skiller "tom og bekreftet" fra "ikke kommet hit enda"
  preferenceNotes: string
}
```

### Persistens

**Steg 1-3 (pre-signup):**
- Etter hver "Neste": skriv hele `WizardState` til `localStorage` under nøkkelen `ai-coach.onboarding.draft`
- Ved mount: hvis localStorage har en draft og bruker ikke er innlogget, restorer state og fortsett fra siste steg
- Ved siste signup-trinn (steg 3): kall Supabase `signUp`, deretter `POST /api/users/profile` med navn+epost (resten av feltene som null), så sett `onboarding_status='in_progress'`. Slett localStorage-draften.

**Steg 4-13 (post-signup):**
- Etter hver "Neste": kall `PATCH /api/users/profile` med det aktuelle feltet
- Ved mount: hvis bruker er innlogget men `onboarding_status != 'complete'`, hent profilen og bestem steg basert på hvilke felter som er satt:
  - `goals` null → steg 4
  - `experience_level` null → steg 5
  - ... osv.
  - Alle obligatoriske satt → steg 12
  - Hvis 12 er besøkt men ikke ferdig → vanskelig å detektere (vi har ikke en "valgfri ferdig"-markør i datamodellen). MVP: alltid plasser brukeren på første ufullstendige obligatoriske felt. Hvis alle obligatoriske er satt, gå til steg 12.

**Steg 14:**
- Kall `POST /api/users/onboarding/complete`. Hvis 200, redirect til `/home`. Hvis 400 (mangler felt), kast feilmelding og send brukeren tilbake til første manglende felt.

### Validering

- Navn: begge felt påkrevd, hvert 1+ tegn
- Epost: regex for `@` og `.` (server gjør riktig validering ved signUp)
- Passord: min 6 tegn (Supabase-default)
- Multi-select: minst 1 valgt
- Number-inputs: parseInt/parseFloat må gi et tall innenfor rimelige grenser (høyde 100-250 cm, vekt 30-200 kg)
- Date: må være parsable og før dagens dato

Disabled state på "Neste"-knapp inntil validering passerer. Ingen røde feilmeldinger med mindre server avviser noe (sjeldent).

### Middleware

`web/src/middleware.ts` beholder samme logikk som forrige PR med én endring:
- `PUBLIC_PATHS` listen fjerner `/signup` (routen finnes ikke lenger)
- `/onboarding` er fortsatt public-mid-flow (innlogget bruker uten `onboarding_status='complete'` får tilgang)
- Uautentiserte brukere som treffer `/onboarding` får lov til å være der (signup-stegene må fungere før de er innlogget)

Logikken blir:
```
1. Hvis bruker er på /onboarding → la passere
2. Hvis ikke innlogget OG ikke på public → redirect til /login
3. Hvis innlogget på /login → redirect til /home (eller /onboarding hvis status ≠ complete)
4. Hvis innlogget og på en app-rute (/home, /coach, /profile, ...) og onboarding_status ≠ complete → redirect til /onboarding
```

## Suksesskriterier

- [ ] Ny bruker treffer `/onboarding`, kommer gjennom alle 13 steg, lander på `/home`
- [ ] Bruker kan navigere bakover på alle steg 2-13 og rette opp svar
- [ ] Refresh midt i flowen restorer state og plasserer bruker på siste ufullførte steg
- [ ] Lukker fanen helt og logger inn igjen → blir sendt til `/onboarding` med riktig steg
- [ ] Profile-tab viser alle 8 obligatoriske felter etter fullføring
- [ ] Hvis bruker prøver å nå `/home` før completion → redirect til `/onboarding`
- [ ] Hopp over på 12 og 13 fungerer — `injury_notes` / `preference_notes` forblir null
- [ ] Bruker som har fullført — `onboarding_status='complete'` — kommer aldri tilbake til `/onboarding`
- [ ] `make check` passerer
- [ ] Frontend-tester for hver step-komponent + integrasjons-test for wizard-flow
- [ ] Backend-tester for `POST /api/users/onboarding/complete` med både ferdig og ufullstendig profil

## Out of scope

1. Sosial signup (Google/Apple) — fortsatt bare epost+passord
2. Epost-verifisering før onboarding kan starte
3. Avatar-opplasting (kan legges til i Profile senere)
4. A/B-testing av rekkefølge eller copy
5. Onboarding-analytics (drop-off per skjerm)
6. Multi-språk — kun norsk
7. Animasjoner mellom skjermer (kan polertes senere)
8. Tier 3-felter (activity_level, years_training, preferred_training_time, max_session_duration_min) — samles via Profile eller coach-samtaler senere

## Avhengigheter

- Migrasjon 010 må kjøres lokalt og i Supabase før koden deployes
- Eksisterende migrasjon 009 må allerede være kjørt (gjort i forrige PR)
- Supabase-instansen må tillate signUp uten epost-verifisering (default)

## Risiko og avveininger

| Risiko | Avbøtning |
|---|---|
| Bruker bruker for lang tid → drop-off | Vi sporer ikke i MVP, men progresjons-bar gir visuell feedback. 13 steg er på linje med Fitbod/MyFitnessPal (10-12 steg) |
| State-recovery feiler hvis brukeren skifter device midt i | Pre-signup: tapt (localStorage er per-device). Post-signup: lagres i DB så fungerer på tvers av devices |
| Brukeren angrer signup men kommer for langt | Tilbake-pilen tar dem til steg 2, men signup på steg 3 er irreversibel uten "slett bruker"-flyt. MVP godtar dette |
| Tidligere chat-onboarding-state ligger i DB for testbrukere | Akseptert — testbrukere blir ryddet senere |
| PATCH per skjerm gir mange API-kall | 10 PATCH'er totalt er ubetydelig for ytelse. Alternativt kunne vi batched ved completion, men da taper vi state-recovery-fordelen |

## Hva som blir neste spec etter denne

1. Logging-flyt redesign (Log + Program merge)
2. Visuell design / premium-følelse
3. Voice-to-text input (Phase 2 av Coach)
4. Proaktive coach-meldinger
5. "Hva husker du om meg?" — Lag 2 visibility i Profile
