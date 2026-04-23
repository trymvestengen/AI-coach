# AI Coach — MVP Master Plan

**Goal:** En treningslogg-app (tenk Hevy/Strong) med en innebygd AI-coach som primært opererer via voice.

**Architecture:** Next.js 15 frontend med flere visninger (program, logg, øvelsesbibliotek) kommuniserer med FastAPI backend via REST (data) og WebSocket (voice). Backend orkestrerer STT (Deepgram) → LLM (Claude Sonnet) → TTS (ElevenLabs/Cartesia) i en streaming-pipeline med mål om under 800ms latency. Data lagres i Postgres via Supabase.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind · shadcn/ui · Python FastAPI · Claude Sonnet 4.5 · Deepgram Nova-2 · ElevenLabs Flash (NO) / Cartesia Sonic (EN) · Supabase (Postgres + Auth)

---

## Hva vi bygger

En treningsapp der AI-coachen er det som skiller den fra konkurrentene.

**Kjernen i appen er tre skjermbilder:**

### 1. Dashboard / Hjem
- Dagens økt fra aktivt program
- Rask oversikt over siste treninger
- Knapp for å starte voice-coach-modus

### 2. Treningsprogram-visning
- Liste over alle programmer (AI-genererte og egne)
- Detaljvisning av ett program: dager, øvelser, sett/reps
- Øvelsesillustrasjoner (animasjon eller video) for hver øvelse
- AI-coach kan forklare programmet via voice

### 3. Treningslogg
- Logg en aktiv økt: kryss av sett, skriv inn vekt/reps
- Historikk over alle tidligere økter
- Progresjonskurver per øvelse (graf)
- AI-coach kan logge via voice under økten ("jeg tok 80 kilo, 5 reps")

### 4. Voice Coach (modus, ikke egen side)
- Aktiveres fra hvilken som helst skjerm via en knapp
- VoiceOrb vises som overlay
- Coachen ser hvilken skjerm du er på og svarer deretter
- Tre personligheter: Friend (default), Sergeant, Analyst

---

## Status

| Trinn | Hva | Status |
|-------|-----|--------|
| 0 | Repo + miljøoppsett | ✅ Ferdig |
| 1 | Tekst-chat + grunnleggende UI | 🔲 Neste |
| 2 | Postgres + treningslogg | 🔲 |
| 3 | Treningsprogram-visning + øvelsesbibliotek | 🔲 |
| 4 | Voice input (Deepgram) | 🔲 |
| 5 | Voice output (TTS streaming) | 🔲 |
| 6 | Visualisering + VoiceOrb | 🔲 |
| 7 | Auth + profil + mål | 🔲 |

---

## Arkitektur-diagram

```
[Bruker: mic/høyttaler/skjerm]
         ↕
[Next.js frontend — Vercel]
  ├── Dashboard (hjem)
  ├── ProgramView (treningsplaner + øvelsesillustrasjoner)
  ├── WorkoutLog (logg + historikk + grafer)
  └── VoiceCoach overlay (WebSocket til backend)
         ↕ REST (data) + WebSocket (voice)
[FastAPI backend — Railway/Fly.io]
    ├── Deepgram Nova-2 (STT streaming)
    ├── Claude Sonnet 4.5 (LLM + tool use)
    ├── ElevenLabs Flash / Cartesia Sonic (TTS streaming)
    └── Supabase Postgres (brukere, økter, programmer, øvelser)
```

---

## Trinn 1 — Tekst-chat + grunnleggende UI 🔲

**Mål:** Funksjonell chatbot og grunnleggende app-skall. Ingen voice enda.

**Hva som bygges:**
- FastAPI-backend med `POST /api/chat`
- Claude Sonnet-integrasjon med base-prompt og tools (`get_exercise_info`, `search_exercises`, `create_program`)
- Statisk øvelseskatalog som JSON-fil
- Frontend: navigasjon mellom Dashboard, Program, Logg
- Enkel chat-UI på Dashboard som proof-of-concept

**Kriterium:** Bruker kan skrive "lag et program for meg" og få et strukturert program tilbake.

---

## Trinn 2 — Postgres + treningslogg 🔲

**Mål:** Appen husker deg. Data lagres og hentes fra database.

**Hva som bygges:**
- Supabase-prosjekt + DB-migrering (skjema fra `docs/ARCHITECTURE.md`)
- Seed av øvelseskatalog
- Tools: `log_workout`, `get_user_history`, `suggest_progression`
- Frontend `<WorkoutLog>`: logg aktiv økt (sett, reps, vekt), vis historikk
- Hardkodet test-bruker (auth kommer i trinn 7)

**Kriterium:** Coachen kan si "du tok 80 kg x 5 sist, prøv 82,5 i dag" basert på ekte data.

---

## Trinn 3 — Treningsprogram-visning + øvelsesbibliotek 🔲

**Mål:** Appen visualiserer treninger ordentlig.

**Hva som bygges:**
- `<ProgramView>`: vis aktivt program med dager og øvelser
- `<ExerciseCard>`: øvelsesnavn, muskelgrupper, utstyr, illustrasjon/animasjon
- Øvelsesillustrasjoner: hent fra wger API (har GIF-animasjoner gratis) eller ExerciseDB
- `GET /api/exercises` og `GET /api/programs` på backend

**Kriterium:** Bruker kan se treningsprogrammet sitt med øvelsesillustrasjoner for hver øvelse.

---

## Trinn 4 — Voice input (Deepgram) 🔲

**Mål:** Bruker kan snakke. Svar er fortsatt tekst.

**Hva som bygges:**
- WebSocket `WS /ws/voice` på backend
- Frontend fanger mic med `MediaRecorder`, streamer audio chunks
- Backend relaer til Deepgram streaming API
- VAD-logikk: send til LLM når bruker er ferdig å snakke
- Voice-knapp tilgjengelig på alle skjermbilder

**Latency-mål:** Under 200ms fra bruker slutter å snakke til transcript sendes til LLM.

---

## Trinn 5 — Voice output (TTS streaming) 🔲

**Mål:** Full voice-loop. Coachen svarer med stemme.

**Hva som bygges:**
- `TTSProvider`-interface (ElevenLabs for norsk, Cartesia for engelsk)
- Sentence chunker: sender én setning til TTS mens resten av svaret genereres
- TTS audio streames tilbake via WebSocket
- `AudioContext` + `AudioBufferSourceNode` for gapless playback
- Avbruddshåndtering

**Latency-mål:** Under 800ms fra bruker slutter å snakke til coach begynner å svare.

---

## Trinn 6 — VoiceOrb + visualisering 🔲

**Mål:** Appen føles premium. Voice-modus har en tydelig visuell identitet.

**Hva som bygges:**
- `<VoiceOrb>`: Canvas-basert pulserende sirkel som reagerer på amplitude
- States: idle → lytter → tenker → snakker (med ulike animasjoner)
- Overlay-design: VoiceOrb vises over eksisterende skjerm, ikke ny side
- Framer Motion for smooth transitions
- Testet på iPhone Safari

---

## Trinn 7 — Auth + profil + mål 🔲

**Mål:** Ekte brukere med egne data. Klar for eksterne testbrukere.

**Hva som bygges:**
- Supabase Auth: magic link + Google OAuth
- Login/signup-flow, protected routes
- Onboarding: velg språk, persona-modus (Friend/Sergeant/Analyst), mål, utstyr
- Profil-side: rediger mål og innstillinger
- Row Level Security i Postgres

**Kriterium:** Kan invitere 3-5 venner til å teste i produksjon.

---

## Voice pipeline

```
Bruker snakker
  ↓ audio chunks hvert 100ms via WebSocket
Deepgram STT streaming
  ↓ partial transcripts løpende
VAD — detekterer pause
  ↓ final transcript
Claude Sonnet streaming (med kontekst: hvilken skjerm er bruker på?)
  ↓ tokens token-for-token
Sentence chunker
  ↓ én setning av gangen
TTS streaming
  ↓ audio chunks tilbake via WebSocket
AudioBufferSourceNode i nettleser
```

Nøkkelprinsipp: ikke vent på hele LLM-responsen før TTS starter. Dette kutter latency fra 3-5 sek til under 1 sek.

---

## Prosessregler

- Aldri push direkte til `main` — alt via PR
- Commit-prefix: `feat:`, `fix:`, `docs:`, `refactor:`
- API-nøkler deles via sikker kanal, aldri i kode
- Test lokalt før PR åpnes

---

## Arbeidsdeling (forslag)

- **Trym:** Frontend UI (program, logg, øvelsesillustrasjoner), Claude-integrasjon
- **Axel:** Voice pipeline (STT/TTS/WebSocket), backend-infra, database
- **Sammen:** DB-skjema, arkitektur-beslutninger, deploy
