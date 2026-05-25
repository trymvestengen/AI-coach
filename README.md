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

## Bidra

Les [CONTRIBUTING.md](CONTRIBUTING.md) før du åpner din første PR. Kort versjon:

- Branch-navn: `<initialer>/<beskrivelse>`
- Commit-prefiks: `feat: / fix: / docs: / refactor: / chore: / test:`
- Alle PR-er trenger approval — ingen self-merge
- Kjør `make check` lokalt før du pusher

## Stack

**Frontend**
- Next.js 16 (App Router) + TypeScript
- Tailwind v4 + shadcn/ui
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

## Status

Aktiv utvikling. Se [PROJECT_PLAN.md](PROJECT_PLAN.md) for detaljerte tasks og milepæler, og [CONTRIBUTING.md](CONTRIBUTING.md) for team-konvensjoner.

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

## Repo-struktur

```
ai-coach/
├── web/                  # Next.js frontend
├── api/                  # FastAPI backend
├── prompts/              # Coach system-prompter og variasjoner
├── scripts/              # Seed-data, utility-scripts
├── docs/                 # Architecture, specs, plans, follow-ups
├── .github/              # CI workflow + PR/issue templates
├── CLAUDE.md             # Kontekst for Claude Code / AI-agenter
├── CONTRIBUTING.md       # Team-konvensjoner
├── Makefile              # make check, make test, make dev, ...
└── PROJECT_PLAN.md
```

## Lisens

TBD. Hvis dere vurderer å selge: hold repoet privat og avklar eierskap skriftlig før dere skriver for mye kode.
