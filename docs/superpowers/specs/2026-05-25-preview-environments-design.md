# Preview Environments — Design Spec

**Status:** Draft for review
**Dato:** 2026-05-25
**Forfatter:** Trym (m/ Claude)

## Kontekst og motivasjon

Etter team-foundation-arbeidet har vi PR-flyt og CI, men når en PR åpnes finnes det ingen måte å se eller teste den faktiske endrede frontenden uten å klone branchen og kjøre lokalt. Det blokkerer code review fra å være visuelt og hands-on, og det blir verre når en kompis (eller du selv) skal review-e en PR fra en annen maskin.

Målet er at hver PR skal få en unik **preview-URL** der reviewer kan klikke seg rundt og se hvordan endringene faktisk ser ut og oppfører seg, før merge til `main`.

## Mål

Når denne spec-en er ferdig implementert:

1. Hver PR mot `main` får automatisk en Vercel preview-URL postet som kommentar på PR-en
2. Preview-frontenden snakker med en delt staging-backend (Railway) som følger `main`
3. Backend godtar CORS fra både `localhost`, production Vercel-URL, og alle Vercel preview-URL-er
4. Secrets (API-nøkler, DB-passord) håndteres via Vercel/Railway-dashboards — aldri i repo
5. Devs vet hvordan flow-en funker via oppdaterte docs

## Ikke-mål (med vilje)

- **Ingen custom domain** — `*.vercel.app` og `*.railway.app` til vi har brukere
- **Ingen separat prod vs staging backend** — én Railway-instans følger `main`, brukes både som "production" (Vercel main-deploy) og "staging" (preview-deploys). Splittes når vi får ekte brukere.
- **Ingen per-PR backend (Approach B)** — krever Railway Pro ($20/mo). Vi starter med shared staging (Approach A, $5/mo). Vurder oppgradering hvis backend-endringer per PR blir hyppige.
- **Ingen database-branching for previews** — alle previews deler én Supabase DB. Når dette blir et problem, oppgrader til Supabase branching eller seed-script.
- **Ingen Postgres på Railway** — bruker Supabase. Railway hoster kun FastAPI-koden.
- **Ingen voice-stack-vars (Deepgram/ElevenLabs/Cartesia)** lagt inn nå — kommer når voice-arbeidet starter.

## Komponenter

### 1. Vercel — frontend hosting

**Setup (manuelt via Vercel-dashboard, allerede gjort under denne brainstormingen):**
- Project name: `ai-coach-new` (URL-slug ble `ai-coach`)
- Linked GitHub repo: `trymvestengen/AI-coach`
- Framework: Next.js (auto-detected)
- Root directory: `web/`
- Build/install/output commands: defaults

**Preview-deploys:** Vercel deployer hver PR automatisk og poster URL som PR-kommentar. URL-format: `ai-coach-<hash>-trymvestengens-projects.vercel.app`.

**Env vars (Production + Preview scope):**
- `NEXT_PUBLIC_SUPABASE_URL` = Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
- `NEXT_PUBLIC_API_URL` = `https://ai-coach-production-0d0c.up.railway.app`

### 2. Railway — backend hosting

**Setup (manuelt via Railway-dashboard, allerede gjort):**
- Project: `charming-heart` (Railway default-generert)
- Linked GitHub repo: `trymvestengen/AI-coach`
- Service root: `api/`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
- Public URL: `https://ai-coach-production-0d0c.up.railway.app`
- Plan: Hobby ($5/mo)

**Env vars (faktisk brukt av kode i dag — verifisert via `grep os.environ` i `api/app/`):**
- `ANTHROPIC_API_KEY` — brukes i `app/services/coach.py`
- `DATABASE_URL` — brukes i `app/db.py`
- `SUPABASE_JWKS_URL` — brukes i `app/auth.py` (auth verification)
- `CORS_ORIGINS` — kreves etter kode-endring i komponent 3
- `CORS_ORIGIN_REGEX` — kreves etter kode-endring i komponent 3
- `LOG_LEVEL=info` — ufarlig å ha

**Variabler som er satt men IKKE brukes av nåværende backend-kode** (greit å beholde, eller rydd):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — kun frontend bruker disse
- `JWT_SECRET` — ikke brukt (auth bruker JWKS, ikke shared secret)
- `BACKEND_PORT`, `BACKEND_HOST` — Railway styrer via `$PORT`, ignoreres
- `CARTESIA_*`, `ELEVENLABS_*`, `DEEPGRAM_*` — kommer i voice-workstream

### 3. CORS-håndtering i backend

**Problemet:** `api/app/main.py` hardkoder CORS allow_origins til localhost. Vercel preview-URL-er er dynamiske og må håndteres via regex.

**Endring i `api/app/main.py`** (linje 14-19):

```python
import os

ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001"
    ).split(",")
    if o.strip()
]
ALLOWED_ORIGIN_REGEX = os.getenv("CORS_ORIGIN_REGEX")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

Default-verdien i `getenv` bevarer lokal dev-flow (`localhost:3000/3001`) hvis env-varen ikke er satt.

**Verdier i Railway:**
- `CORS_ORIGINS=https://ai-coach.vercel.app` (production Vercel-deploy)
- `CORS_ORIGIN_REGEX=^https://ai-coach-[a-z0-9-]+-trymvestengens-projects\.vercel\.app$` (preview-deploys; `[a-z0-9-]+` tillater både hash-baserte (`ouzcu07we`) og branch-baserte (`git-feature-auth`) URL-er)

Regex strammes når vi ser flere reelle URL-er, men gjeldende mønster er allerede ganske spesifikt (krever `ai-coach`-prefiks og `trymvestengens-projects`-team-slug).

### 4. `.env.example`-rydding

`.env.example` lister env vars som er aspirational, ikke kode-realitet. Det skaper forvirring (som vi opplevde under setup). Endringer:

- Marker tydelig hvilke vars som er **brukt i dag** (kreves) vs **planlagt** (kommer i voice/STT/TTS-workstream)
- Legg til kommentar over `CORS_ORIGINS` og ny `CORS_ORIGIN_REGEX` med Vercel preview-URL-mønster som eksempel
- Fjern `BACKEND_PORT` og `BACKEND_HOST` (Railway styrer, lokalt brukes uvicorn-default)

### 5. Dokumentasjon

**`docs/deploys.md` (ny):**
- Hvor frontend bor (Vercel), hvor backend bor (Railway), hvor DB bor (Supabase)
- Lenker til dashboards (uten å lekke konkrete URLs hvis private)
- Env-var-tabell: hvilke vars hvor, hvorfor
- "Hvordan promotere endring": merge til main → Vercel og Railway re-deployer automatisk
- Klargjøring av "preview vs production" og at vi ikke har separate environments enda

**`CONTRIBUTING.md`-tillegg (kort seksjon):**
- Når du åpner PR → Vercel poster preview-URL i kommentar
- Klikk URL-en for å klikke deg rundt i den endrede appen
- Preview snakker med samme staging-backend som `main`
- Hvis du har gjort backend-endringer, må de merges til main først FØR preview-frontenden kan teste dem

**`CLAUDE.md`-tillegg (kort):**
- Lenke til `docs/deploys.md`
- Notér at backend deployes til Railway fra `main`, frontend til Vercel per branch

## Data flow / arkitektur

**Vanlig review-flyt:**

1. Dev åpner PR mot `main`
2. GitHub Actions kjører CI (lint, typecheck, tests, build) — fra team-foundation
3. Vercel-boten bygger preview-deploy → poster URL som kommentar
4. Reviewer klikker URL, ser endringen i browser
5. Preview-frontend kaller `https://ai-coach-production-0d0c.up.railway.app/api/...`
6. Browser CORS-preflight matches `CORS_ORIGIN_REGEX` på Railway → tillatt
7. Backend svarer med data, reviewer ser ekte tilstand

**Backend-endring-flyt:**

1. Dev gjør backend-endring i PR
2. PR mergeses til main (etter review)
3. Railway auto-deployer fra main
4. Backend er oppdatert
5. Etterfølgende preview-PRs får ny backend-oppførsel

**Begrensning:** Hvis en PR samtidig endrer frontend og backend som er gjensidig avhengige, må backend-PR-en merges først. Preview-frontend i samtidig PR vil ikke kunne teste den nye backend-oppførselen før etter merge. Akseptert kost for Approach A.

## Risiko og avveininger

| Risiko | Avbøtning |
|---|---|
| Backend krasjer på Railway pga manglende env vars → alle previews ødelagt | Verifisere health endpoint etter hver Railway-endring. Sjekkliste i `docs/deploys.md`. |
| CORS_ORIGIN_REGEX matcher for løst → URL-spoofing fra annen Vercel-konto | Regex bruker både prosjekt-slug OG team-slug. Vanskelig å spoofe begge. |
| Delt DB → to PRs som tester samtidig steper på hverandres data | Akseptert kost. Når det skjer, vurder seed-scripts eller Supabase branching. |
| Railway-kostnad eskalerer hvis trafikk vokser | Hobby-plan har $5 kreditt inkludert. Setting opp en hard limit i Railway dashboard hvis bekymret. |
| Vercel-bygg feiler på preview, blokkerer review | Vercel-bygg er separat fra GitHub Actions. PR kan fortsatt merges (status check er ikke required). Akseptert; juster hvis det blir et reelt problem. |
| Dev legger til ny env-var lokalt, glemmer Vercel/Railway → preview krasjer | Sjekkliste i `CONTRIBUTING.md` "når du legger til ny env-var" — oppdater begge dashboards. |
| Production = staging gir ingen "trygg" plass å teste utenfor prod | Når dere får brukere, splitt. Til da er det riktige tradeoff. |

## Suksesskriterier

- [ ] Backend leser `CORS_ORIGINS` og `CORS_ORIGIN_REGEX` fra env (kode-endring landet)
- [ ] `curl https://ai-coach-production-0d0c.up.railway.app/` returnerer `{"status":"ok"}`
- [ ] Vercel-deploy på `main` lar deg logge inn (Supabase fungerer)
- [ ] Manuelt test-PR: åpne en trivial PR, Vercel-bot poster preview-URL, URL-en åpner appen, du kan klikke på en autentisert side uten CORS-feil i konsollen
- [ ] `docs/deploys.md` finnes og dekker hvor ting bor
- [ ] `CONTRIBUTING.md` har en preview-seksjon
- [ ] `.env.example` skiller mellom brukt-i-dag og planlagt

## Out of scope — neste workstreams

Disse er IKKE en del av denne spec-en:

1. Custom domain på Vercel og Railway
2. Splitt prod vs staging (separat Railway-instans per env)
3. Database branching eller seed-scripts for preview-isolation
4. Per-PR backend (Approach B med Railway Pro)
5. Voice-stack env vars og deploy-verifisering
6. CI-integrasjon for Vercel-preview-status (require preview-bygg grønn før merge)
