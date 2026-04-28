# AI Coach

En voice-first treningscoach som hjelper brukere fra nybegynner til avansert med treningsprogrammer, live coaching under økten, og kostholdsguiding. Fungerer på norsk og engelsk.

## Vision

Produktet skal føles som å ha en smart, vennlig kompis som tilfeldigvis er personlig trener — ikke en app med en chatbot-skjerm. Lav latency, naturlig stemme, og coaching som tilpasser seg brukeren over tid.

## Persona: "Smart kompis"

Default-personaen er vennlig, kunnskapsrik og litt humoristisk. Den forklarer hvorfor (ikke bare hva), tilpasser seg brukerens nivå, og pusher når det trengs uten å være skremmende.

Tre moduser kan velges i innstillinger (samme LLM, ulik system-prompt):

- **Friend (default):** Vennlig, motiverende, forklarer hvorfor.
- **Sergeant:** Direkte, kompromissløs. Kort energi mellom settene.
- **Analyst:** Datadrevet. Snakker i volum, RPE, progresjon.

Se `prompts/coach-system-prompt.md` for full prompt-arkitektur.

## Stack

**Frontend**
- Next.js 15 (App Router) + TypeScript
- Tailwind + shadcn/ui
- Web Audio API + WebSocket for voice streaming
- Canvas-basert orb/waveform for visualisering (MVP-nivå)

**Backend**
- Python FastAPI (async)
- WebSocket endpoint for voice pipeline
- REST endpoints for vanlig data (treningslogg, programmer)

**AI-tjenester**
- LLM: Claude Sonnet 4.5 (Anthropic API) med tool use
- STT: Deepgram Nova-2 (streaming)
- TTS: ElevenLabs Flash for norsk, Cartesia Sonic for engelsk (abstraksjon bak samme interface)

**Data**
- Postgres via Supabase eller Neon
- pgvector for kontekstuell samtalehistorikk (valgfritt i MVP)
- Øvelseskatalog: wger API eller ExerciseDB som seed

**Deploy**
- Frontend: Vercel
- Backend: Railway eller Fly.io
- DB: Supabase/Neon

## MVP-rekkefølge

Hvert trinn er deploybart og testbart alene. Ikke gå videre før trinn N funker.

1. **Tekst-chat med tool use** — Claude + statisk øvelseskatalog. Programdesigner-modus.
2. **Postgres + workout logging** — lagre økter via tool use.
3. **Voice input** — Deepgram streaming, tekst-svar fortsatt.
4. **Voice output** — Cartesia/ElevenLabs streaming, full voice-loop.
5. **Visualisering** — waveform/orb i frontend.
6. **Auth + profil + mål** — Supabase Auth, brukerprofil.

Se `PROJECT_PLAN.md` for full task-nedbrytning per trinn.

## Kjøre lokalt

```bash
# Frontend
cd web
npm install
cp .env.example .env.local  # fyll inn nøkler
npm run dev

# Backend
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fyll inn nøkler
uvicorn app.main:app --reload
```

Se `.env.example` for hvilke API-nøkler som trengs.

## Repo-struktur (planlagt)

```
ai-coach/
├── web/                  # Next.js frontend
├── api/                  # FastAPI backend
├── prompts/              # Coach system-prompter og variasjoner
├── scripts/              # Seed-data, utility-scripts
├── docs/
│   └── ARCHITECTURE.md
├── README.md
├── PROJECT_PLAN.md
└── .env.example
```

## Team

To utviklere. Arbeidsdeling foreslått i `PROJECT_PLAN.md`. Bruk branches + pull requests, aldri commit direkte til `main`.

## Lisens

TBD. Hvis dere vurderer å selge: hold repoet privat og avklar eierskap skriftlig før dere skriver for mye kode.
