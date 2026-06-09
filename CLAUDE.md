# Claude-kontekst for ai-coach

Denne fila gir Claude Code (og andre AI-coding-agenter) kontekst om prosjektet. Hold den kort og oppdatert.

## Hva prosjektet er

Voice-first treningscoach. Hjelper brukere fra nybegynner til avansert med treningsprogrammer, live coaching, og kostholdsguiding. Norsk og engelsk.

Detaljert vision: [README.md](README.md). Detaljerte tasks: [PROJECT_PLAN.md](PROJECT_PLAN.md). Team-konvensjoner: [CONTRIBUTING.md](CONTRIBUTING.md).

## Stack-oppsummering

- **Frontend (`web/`):** Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- **Backend (`api/`):** Python FastAPI (async) + psycopg
- **LLM:** Anthropic Claude (Sonnet) med tool use
- **DB:** Supabase Postgres
- **STT/TTS:** Deepgram (STT), Cartesia/ElevenLabs (TTS)

## Konvensjoner

- **Push tidlig og ofte:** opprett branch + draft-PR med én gang et workstream starter, push etter hver fullført task (ikke samle opp), og hold deg til ett workstream = én PR.
- **Språk i UI-tekst:** norsk (default). Engelsk variant kommer.
- **Persona-default:** "Friend" (vennlig, kunnskapsrik, litt humoristisk). Se [prompts/coach-system-prompt.md](prompts/coach-system-prompt.md).
- **Tool use:** alle Claude-tools defineres i `api/app/tools/`. Hver tool har én ansvarsoppgave.
- **Routers:** `api/app/routers/` — kun HTTP-lag, ingen forretningslogikk.
- **Services:** `api/app/services/` — forretningslogikk, kan kalles fra routers og tools.
- **Frontend-tester:** Vitest + React Testing Library, co-located (`Foo.tsx` → `Foo.test.tsx`).

## Viktige filer å lese først

Hvis du jobber på:
- **Coach/chat-flow:** [api/app/main.py](api/app/main.py), [api/app/tools/](api/app/tools/), [prompts/coach-system-prompt.md](prompts/coach-system-prompt.md)
- **Frontend chat-UI:** [web/src/app/coach/](web/src/app/coach/), [web/src/components/](web/src/components/)
- **DB-skjema:** [api/db/](api/db/), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Auth:** [api/app/auth.py](api/app/auth.py), [web/src/middleware.ts](web/src/middleware.ts)

## Deploys

- Frontend lever på Vercel, backend på Railway, DB i Supabase
- Hver PR får automatisk en Vercel preview-URL (postes som kommentar av Vercel-boten)
- Backend deployer fra `main` etter merge
- Se [docs/deploys.md](docs/deploys.md) for env vars, dashboards, og feilsøking

## Test- og lint-flow

- Kjør `make check` før PR — det matcher CI eksakt (lint + typecheck + test + build)
- Frontend-tester: `make test-web` eller `cd web && npm run test`
- Backend-tester: `make test-api` (bruker `api/.venv/bin/pytest`)
- Pre-commit hooks formaterer endrede filer automatisk (Husky + lint-staged via `web/.husky/pre-commit`)
- CI: `.github/workflows/ci.yml` kjører de samme stegene på hver PR

## Hva Claude IKKE skal gjøre uten å spørre

- Commit direkte til `main` (blokkert av branch protection uansett)
- Endre DB-skjema uten å oppdatere [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Legge til nye AI-providers uten å sjekke abstraksjonen i `api/app/services/`
- Reformatere store deler av kodebasen i en uvanlig PR — gjør det som dedikert "chore: format" PR
- Skrive seremonitester (`renders without crashing`) — skriv ekte tester eller la være

## Kjent teknisk gjeld

Se [docs/follow-ups/frontend-lint-debt.md](docs/follow-ups/frontend-lint-debt.md) — fire `setState`-i-effekt-mønstre er midlertidig disablet med `TODO(frontend-lint-debt)`. Håndteres som del av frontend-cleanup-workstream, ikke isolert.

## Out-of-scope-arbeid på vent

Disse problemene er kjent og kommer i egne specs senere — ikke prøv å fikse dem i sidekvest:

1. Frontend redesign (premium-følelse)
2. Kode-duplisering i frontend
3. Backend arkitektur-rydding (routers/services/tools-grenser)
4. Backend error-håndtering og validering
5. DB-skjema cleanup
6. Security audit
