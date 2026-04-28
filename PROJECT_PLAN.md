# Project Plan

Delt opp etter MVP-trinn. Hver task er ment å kopieres direkte inn i GitHub Issues. Hold tasks små — hvis en task virker som den vil ta over en dag, splitt den.

## Arbeidsdeling (forslag)

- **Utvikler A:** Voice pipeline (STT, TTS, streaming, WebSocket) + backend-infra.
- **Utvikler B:** LLM-integrasjon, tool use, prompt-engineering, frontend-UI.
- **Sammen:** Arkitektur-beslutninger, DB-skjema, deployment, første deploy til produksjon.

Bytt gjerne område etter trinn 3 — begge skal kunne hele stacken.

## Trinn 0 — Repo- og miljøoppsett (sammen)

- [ ] Opprett GitHub repo (privat).
- [ ] Inviter kompis som collaborator.
- [ ] Sett opp `main` branch protection (krev PR + 1 review).
- [ ] Legg til `.gitignore` for Python, Node, Next.js.
- [ ] Begge installerer Cursor / VS Code + Claude Code.
- [ ] Kjør `git clone` + `npm install` + `pip install` end-to-end hver for seg.
- [ ] Opprett GitHub Project board (Kanban) eller bruk Issues med labels.
- [ ] Kopier alle tasks fra dette dokumentet til Issues.

## Trinn 1 — Tekst-chat med tool use

Mål: en fungerende chatbot som kan lage treningsprogrammer og slå opp øvelser, uten voice.

- [ ] Scaffolde Next.js 15 app i `web/`.
- [ ] Scaffolde FastAPI app i `api/`.
- [ ] Opprett `POST /api/chat` endpoint som tar meldinger og returnerer respons (ikke streaming enda).
- [ ] Koble til Anthropic API med Sonnet 4.5.
- [ ] Implementer base-prompt fra `prompts/coach-system-prompt.md`.
- [ ] Importer ExerciseDB eller wger-eksport som JSON → seed `exercises`-tabell (men i trinn 1 kan den ligge som fil).
- [ ] Implementer tools: `get_exercise_info`, `search_exercises`, `create_program`.
- [ ] Frontend: enkel chat-UI med shadcn `<Card>` og tekstinput.
- [ ] Deploy frontend til Vercel, backend til Railway. Sjekk at end-to-end funker i produksjon.

**Kriterier for "ferdig":** En bruker kan si "lag et program for meg, jeg vil bygge muskler, har tilgang til hjemmegym" og få et strukturert program tilbake.

## Trinn 2 — Postgres + workout logging

Mål: persistens. Coachen husker brukeren på tvers av sesjoner.

- [ ] Opprett Supabase-prosjekt.
- [ ] Kjør DB-migrering fra `docs/ARCHITECTURE.md` skjema.
- [ ] Seed `exercises`-tabell.
- [ ] Koble backend til Postgres (SQLAlchemy eller psycopg med async).
- [ ] Implementer tools: `log_workout`, `get_user_history`, `suggest_progression`.
- [ ] Midlertidig hardkodet test-bruker (auth kommer i trinn 6).
- [ ] Frontend: enkel `<WorkoutLog>`-komponent som viser siste 5 økter.
- [ ] Test: be coachen logge en økt via chat, verifiser i DB, be den oppsummere siste uke.

**Kriterier for "ferdig":** Coachen kan si "du gjorde knebøy 80 kg x 5 sist, prøv 82,5 i dag" basert på ekte DB-data.

## Trinn 3 — Voice input (Deepgram streaming)

Mål: bruker kan snakke. Svaret er fortsatt tekst.

- [ ] Opprett Deepgram-konto, generer API-key.
- [ ] Implementer WebSocket `WS /ws/voice` på backend.
- [ ] Frontend: `MediaRecorder` (eller `AudioWorkletNode`) fanger mic, streamer audio chunks via WebSocket.
- [ ] Backend: relayer audio til Deepgram streaming API, mottar partial transcripts.
- [ ] Implementer VAD-logikk: når bruker er ferdig å snakke, send final transcript til LLM.
- [ ] Frontend: vis live transcription mens bruker snakker.
- [ ] Test: mål total latency bruker-slutter-å-snakke → transcript-sendt-til-LLM. Bør være under 200ms.

**Kriterier for "ferdig":** Brukeren kan holde inne "talk"-knapp, snakke, slippe, og få tekst-svar.

## Trinn 4 — Voice output (Cartesia / ElevenLabs streaming)

Mål: full voice-loop. Dette er "wow"-øyeblikket.

- [ ] Opprett Cartesia + ElevenLabs konti.
- [ ] Abstraher TTS bak `TTSProvider`-interface i backend.
- [ ] Implementer sentence chunker: samler LLM-tokens til hele setninger.
- [ ] Streame TTS audio tilbake til frontend via WebSocket.
- [ ] Frontend: `AudioContext` + `AudioBufferSourceNode` for gapless playback.
- [ ] Velg default-stemme per språk. Vurder 2-3 stemmealternativer å velge mellom.
- [ ] Implementer avbrudd: hvis bruker begynner å snakke mens TTS spiller, stopp TTS og prosesser ny input.
- [ ] Test: mål total latency bruker-slutter-å-snakke → coach-begynner-å-snakke. Mål < 800ms.

**Kriterier for "ferdig":** En full samtale kan føres i 5+ turns, med naturlig timing og avbruddshåndtering.

## Trinn 5 — Visualisering

Mål: gjøre appen vakker og engasjerende. Ingen funksjonell endring, bare polish.

- [ ] Implementer `<VoiceOrb>` — Canvas med pulserende sirkel som reagerer på amplitude (`AnalyserNode`).
- [ ] Ulike states: idle, lytter (bruker snakker), tenker (LLM prosesserer), snakker (TTS spiller).
- [ ] Smooth transitions mellom states (Framer Motion).
- [ ] Optional: enkel waveform som alternativ visualisering.
- [ ] Test på mobil — orb skal funke fint på iPhone Safari.

**Kriterier for "ferdig":** Appen føles som et premium-produkt. Folk vil ta en skjermvideo og sende til venner.

## Trinn 6 — Auth, profil, mål

Mål: ekte brukere med egne data.

- [ ] Implementer Supabase Auth (magic link + Google OAuth).
- [ ] Frontend: login/signup-flow, protected routes.
- [ ] Onboarding-flow: velg språk (no/en), velg persona-modus (friend/sergeant/analyst), sett mål og utstyr.
- [ ] Profil-side: rediger mål, utstyr, bytt persona-modus.
- [ ] Backend: alle endpoints skal sjekke bruker-kontekst, ikke hardkodet test-ID.
- [ ] Row Level Security-policies i Postgres.
- [ ] Test: to ulike brukere ser kun sine egne data.

**Kriterier for "ferdig":** Dere kan invitere 3-5 venner til å teste i produksjon.

## Post-MVP (ikke i prioriteringsrekkefølge ennå)

- Pose estimation fra kamera for form-sjekk.
- Apple Health / Garmin / Strava integrasjon.
- Kostholdsregistering via foto (Claude vision).
- Sosial: venner, leaderboards, delte programmer.
- Offline-modus for voice coaching på treningssenter med dårlig nett.
- Whisper-fallback for STT hvis Deepgram feiler.
- Apple / Google Pay-abonnement.

## Prosess-regler

- **Aldri push direkte til `main`.** Alt skal via PR.
- **Hver PR skal ha en beskrivelse** med hva den gjør + screenshots hvis UI.
- **Test lokalt før du åpner PR.** Ikke "det funker hos meg".
- **Code review er ikke valgfritt.** Selv to minutter er bedre enn ingen.
- **Secrets i `.env` (ignorert av Git).** API-nøkler deles via 1Password / Bitwarden / DM.
- **Commit-meldinger:** bruk `feat:`, `fix:`, `docs:`, `refactor:` prefix.

## Risiko & check-ins

- **Ukentlig check-in (15 min):** hva har vi gjort, hva er neste, er vi blokkert?
- **Etter trinn 2 og trinn 4:** stopp opp, bruk appen selv i en uke, samle feedback før neste trinn.
- **Hvis noen API-kostnader eskalerer raskt:** sett opp dashboards og hard limits fra dag én.
