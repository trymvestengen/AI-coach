# Preview Environments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make backend CORS env-driven, push all pending commits to remote main, wire Railway/Vercel env vars correctly, and document the preview-environment flow so a new dev can use it without asking.

**Architecture:** Backend reads `CORS_ORIGINS` (comma-separated) and `CORS_ORIGIN_REGEX` from env vars via a pure `build_cors_config()` function. Default falls back to localhost so local dev keeps working. Vercel preview URLs match a regex pattern derived from the team-slug. All other deploy infra (Vercel project, Railway service, Supabase) is already set up manually; this plan codifies the wiring.

**Tech Stack:** FastAPI CORSMiddleware, pytest, Vercel, Railway.

**Spec:** [docs/superpowers/specs/2026-05-25-preview-environments-design.md](../specs/2026-05-25-preview-environments-design.md)

## Current state

Already done manually (during brainstorming):
- Vercel project linked to `trymvestengen/AI-coach`, root `web/`, deployed
- Vercel env vars set: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`
- Railway project linked to same repo, root `api/`, start command `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
- Railway env vars set: `ANTHROPIC_API_KEY`, `DATABASE_URL`, `SUPABASE_JWKS_URL`, plus extras
- Railway public domain: `https://ai-coach-production-0d0c.up.railway.app`
- Health endpoint responds: `curl …/ → {"status":"ok"}`

What does NOT yet work:
- Backend hardcodes CORS to localhost — Vercel cannot call it
- `CORS_ORIGINS` and `CORS_ORIGIN_REGEX` in Railway are set but unused by code
- Local commits (foundation work + this plan's spec) are not pushed to GitHub
- No docs explain the preview flow

---

## File Structure

**Created:**
- `api/tests/test_cors_config.py` — unit tests for `build_cors_config`
- `docs/deploys.md` — where things live, how to promote

**Modified:**
- `api/app/main.py` — extract `build_cors_config`, use env-driven config
- `.env.example` — rewrite to clarify used-today vs aspirational
- `CONTRIBUTING.md` — add preview section
- `CLAUDE.md` — link to deploys.md

---

## Phase A — Backend CORS becomes env-driven

### Task 1: Write failing tests for `build_cors_config`

**Files:**
- Create: `api/tests/test_cors_config.py`

- [ ] **Step 1: Write the failing tests**

Create `api/tests/test_cors_config.py`:

```python
from app.main import build_cors_config


def test_default_origins_when_env_unset():
    config = build_cors_config({})
    assert config["allow_origins"] == [
        "http://localhost:3000",
        "http://localhost:3001",
    ]
    assert config["allow_origin_regex"] is None


def test_custom_origins_from_env():
    config = build_cors_config({"CORS_ORIGINS": "https://foo.com,https://bar.com"})
    assert config["allow_origins"] == ["https://foo.com", "https://bar.com"]


def test_regex_from_env():
    config = build_cors_config({
        "CORS_ORIGIN_REGEX": r"^https://.*\.vercel\.app$",
    })
    assert config["allow_origin_regex"] == r"^https://.*\.vercel\.app$"


def test_empty_entries_filtered_out():
    config = build_cors_config({"CORS_ORIGINS": "https://foo.com,,https://bar.com,"})
    assert config["allow_origins"] == ["https://foo.com", "https://bar.com"]


def test_whitespace_trimmed():
    config = build_cors_config({"CORS_ORIGINS": "https://foo.com , https://bar.com"})
    assert config["allow_origins"] == ["https://foo.com", "https://bar.com"]


def test_empty_regex_treated_as_none():
    config = build_cors_config({"CORS_ORIGIN_REGEX": ""})
    assert config["allow_origin_regex"] is None
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
source .venv/bin/activate
pytest tests/test_cors_config.py -v
```

Expected: ImportError or AttributeError — `build_cors_config` doesn't exist yet in `app.main`.

---

### Task 2: Implement env-driven CORS in `api/app/main.py`

**Files:**
- Modify: `api/app/main.py`

- [ ] **Step 1: Replace CORS setup with env-driven config**

Edit `api/app/main.py`. Current state (lines 1-19):

```python
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat
from app.routers import workouts
from app.routers import programs
from app.routers import users
from app.routers import social

app = FastAPI(title="AI Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

Replace with:

```python
import os
from typing import Mapping

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat
from app.routers import workouts
from app.routers import programs
from app.routers import users
from app.routers import social


def build_cors_config(env: Mapping[str, str] = os.environ) -> dict:
    origins_raw = env.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001",
    )
    allow_origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
    regex = env.get("CORS_ORIGIN_REGEX")
    return {
        "allow_origins": allow_origins,
        "allow_origin_regex": regex if regex else None,
    }


app = FastAPI(title="AI Coach API")

_cors = build_cors_config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors["allow_origins"],
    allow_origin_regex=_cors["allow_origin_regex"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd /Users/trymvestengen/Desktop/ai-coach/api
source .venv/bin/activate
pytest tests/test_cors_config.py -v
```

Expected: all 6 tests pass.

- [ ] **Step 3: Run the full test suite to verify no regression**

```bash
pytest
```

Expected: all tests pass (was 67 passing in foundation work — should still be that plus the 6 new CORS tests = 73).

- [ ] **Step 4: Run lint check (manual eyeball — backend has no linter wired up)**

Skim the diff. Are imports at the top? Is the function in a sensible place? Move `build_cors_config` definition before `app = FastAPI(...)` so it's defined before use.

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add api/app/main.py api/tests/test_cors_config.py
git commit -m "feat(api): make CORS allowed origins env-driven for preview deploys"
```

---

## Phase B — Push to remote main

### Task 3: User refreshes gh CLI auth scope

**This step is manual — done by the user, not Claude.**

- [ ] **Step 1: Refresh gh auth with workflow scope**

User runs in terminal:

```bash
gh auth refresh -s workflow
```

This opens browser → user authorizes additional `workflow` scope (needed because we have `.github/workflows/ci.yml` in the commits).

- [ ] **Step 2: Verify scope is added**

```bash
gh auth status
```

Expected output should include `'workflow'` in the token scopes line.

---

### Task 4: Push accumulated commits to remote main

**Files:** none (git operation)

- [ ] **Step 1: Verify local main is ahead and clean**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git status
```

Expected: `nothing to commit, working tree clean` (or similar).

```bash
git rev-list --left-right --count origin/main...HEAD
```

Expected: `0	N` where N is the number of ahead commits (20+ at this point including the foundation work and the CORS commit).

- [ ] **Step 2: Push**

```bash
git push origin main
```

Expected: success, prints `* [new branch]` or fast-forward update.

- [ ] **Step 3: Verify on GitHub**

Open `https://github.com/trymvestengen/AI-coach` in browser. Confirm latest commit matches local HEAD.

- [ ] **Step 4: Watch CI run on main**

```bash
gh run watch
```

Expected: both `web` and `api` jobs complete green. If they fail, surface the failure to the user — do not silently retry.

- [ ] **Step 5: Watch Railway re-deploy**

Railway auto-deploys when `main` updates. In Railway dashboard → Deployments tab, you should see a new deploy in progress. Wait for it to go Active. The backend now reads CORS_ORIGINS and CORS_ORIGIN_REGEX from env vars (which were already set during brainstorming).

---

## Phase C — Wire and verify CORS values in Railway

### Task 5: Verify Railway CORS values are correct

**Files:** none (Railway dashboard, env vars already set during brainstorming)

- [ ] **Step 1: Confirm Railway has the right CORS env vars**

In Railway dashboard → Variables tab, verify these two exist:

```
CORS_ORIGINS=https://ai-coach.vercel.app
CORS_ORIGIN_REGEX=^https://ai-coach-[a-z0-9-]+-trymvestengens-projects\.vercel\.app$
```

If the values are different (user may have set them to placeholders earlier), update them to match. After saving, Railway re-deploys automatically.

- [ ] **Step 2: Verify backend still serves health endpoint**

```bash
curl https://ai-coach-production-0d0c.up.railway.app/
```

Expected: `{"status":"ok"}`. If it 500's, check Railway logs — likely an env-var issue, not CORS.

- [ ] **Step 3: Verify CORS preflight from a Vercel preview URL is accepted**

```bash
curl -i -X OPTIONS \
  -H "Origin: https://ai-coach-test12345-trymvestengens-projects.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  https://ai-coach-production-0d0c.up.railway.app/api/programs
```

Expected: response includes header `access-control-allow-origin: https://ai-coach-test12345-trymvestengens-projects.vercel.app`. If not, the regex isn't matching — escape characters or pattern needs fixing.

- [ ] **Step 4: Verify localhost still works**

```bash
curl -i -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  https://ai-coach-production-0d0c.up.railway.app/api/programs
```

Expected: `access-control-allow-origin: http://localhost:3000` in response.

---

## Phase D — Documentation

### Task 6: Rewrite `.env.example` to separate used vs aspirational

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Replace `.env.example` contents**

Current `.env.example` has many vars not used by code. Replace with:

```
# AI Coach — eksempel på miljøvariabler
# Kopier til .env (backend) og .env.local (frontend). Aldri commit den ekte filen.
#
# Variabler er gruppert etter "i bruk i dag" vs "kommer".

# ===========================================================
# BRUKT I DAG av backend (api/) — kreves for at backend kjører
# ===========================================================

# LLM (anthropic SDK i app/services/coach.py)
ANTHROPIC_API_KEY=sk-ant-...

# Database (Supabase postgres-connection-string brukt i app/db.py)
DATABASE_URL=postgresql://postgres:password@localhost:5432/aicoach

# Auth (JWKS-endpoint fra Supabase brukt i app/auth.py)
SUPABASE_JWKS_URL=https://xxxx.supabase.co/auth/v1/.well-known/jwks.json

# CORS (lest i app/main.py — kommaseparert + regex)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_ORIGIN_REGEX=

# Logging (valgfri)
LOG_LEVEL=info

# ===========================================================
# BRUKT I DAG av frontend (web/.env.local) — NEXT_PUBLIC_-prefiks
# ===========================================================

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# ===========================================================
# KOMMER (voice-stack) — ikke nødvendig før voice-arbeidet starter
# ===========================================================

# Speech-to-Text
DEEPGRAM_API_KEY=...
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=multi

# Text-to-Speech (norsk via ElevenLabs, engelsk via Cartesia)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID_NO=...
ELEVENLABS_MODEL=eleven_flash_v2_5

CARTESIA_API_KEY=...
CARTESIA_VOICE_ID_EN=...
CARTESIA_MODEL=sonic-2

NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/voice

# ===========================================================
# Feature flags (frontend, brukes når voice/persona kommer)
# ===========================================================

ENABLE_VOICE=true
ENABLE_PERSONA_SWITCHER=true
DEFAULT_PERSONA=friend                # friend | sergeant | analyst
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: rewrite .env.example to separate used-today vs aspirational vars"
```

---

### Task 7: Create `docs/deploys.md`

**Files:**
- Create: `docs/deploys.md`

- [ ] **Step 1: Create the file**

```markdown
# Deploys og preview-environments

Hvor ting bor, hvordan endringer promoteres, og hvordan preview-flowen funker.

## Hvor ting bor

| Komponent | Tjeneste | URL | Følger |
|---|---|---|---|
| Frontend | Vercel | `ai-coach.vercel.app` (production) + preview-URL per PR | Branch |
| Backend  | Railway | `ai-coach-production-0d0c.up.railway.app` | `main` |
| Database | Supabase | `<project>.supabase.co` | (delt) |

Dashboards:
- Vercel: <https://vercel.com/trymvestengens-projects/ai-coach-new>
- Railway: <https://railway.com/project/...> (sjekk Railway-dashboard for siste URL)
- Supabase: <https://supabase.com/dashboard>

## Hvordan promotere en endring

1. Åpne PR mot `main`
2. CI (GitHub Actions) kjører lint/typecheck/test/build
3. Vercel-boten poster preview-URL som kommentar på PR-en
4. Reviewer klikker URL-en for å se endringen live
5. Etter approval + merge til main:
   - Vercel oppdaterer production-deploy automatisk
   - Railway oppdaterer backend-deploy automatisk
6. Endringen er live på `ai-coach.vercel.app` og `ai-coach-production-0d0c.up.railway.app` innen ~2 min

## Env vars per miljø

| Var | Lokal | Vercel | Railway | Beskrivelse |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Railway-URL | — | Hvor frontend kaller backend |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | satt | — | Supabase-prosjektet |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | satt | — | Anon-key (trygg å eksponere) |
| `ANTHROPIC_API_KEY` | `.env` | — | satt | Claude API |
| `DATABASE_URL` | `.env` | — | satt | Supabase Postgres connection |
| `SUPABASE_JWKS_URL` | `.env` | — | satt | Auth-verifisering |
| `CORS_ORIGINS` | `.env` (valgfri) | — | satt til prod-Vercel | Eksakte tillatte origins |
| `CORS_ORIGIN_REGEX` | `.env` (valgfri) | — | satt til preview-mønster | Tillater Vercel preview-URLs |

## Når du legger til en ny env-var

1. Legg til lokalt (i `.env` eller `.env.local`)
2. Oppdater `.env.example` med en placeholder (aldri ekte verdi)
3. Hvis backend bruker den: legg inn i Railway Variables
4. Hvis frontend bruker den (`NEXT_PUBLIC_*`): legg inn i Vercel env vars (Production + Preview scope)
5. Trigger redeploy (Railway/Vercel gjør dette automatisk når env vars endres)

## Preview-mønster (CORS-regex)

Backend tillater preview-URLs som matcher:

```
^https://ai-coach-[a-z0-9-]+-trymvestengens-projects\.vercel\.app$
```

Hvis Vercel-team-slug endres (f.eks. ved overføring til organisasjon), må regexen oppdateres i Railway.

## Begrensninger (i dag)

- **Én delt backend** for både production og previews. Hvis en PR endrer backend-oppførsel, må PR-en merges til main FØR preview-frontender i påfølgende PRs kan teste den nye oppførselen.
- **Én delt Supabase DB.** To samtidige previews kan steppe på hverandres data. Aksepterbart for små team.
- **Ingen custom domain** ennå. Bruker `*.vercel.app` og `*.railway.app`.

Disse er bevisste avveininger fra [preview-environments-spec'en](superpowers/specs/2026-05-25-preview-environments-design.md). Splittes når vi får brukere.

## Feilsøking

**Preview-URL åpner men data-kall feiler med CORS:**
- Sjekk Railway-deploy-loggene
- Sjekk at `CORS_ORIGIN_REGEX` i Railway matcher preview-URL-en din
- Test preflight med `curl -i -X OPTIONS -H "Origin: <preview-url>" -H "Access-Control-Request-Method: GET" <backend-url>/api/programs`

**Vercel-bygg feiler:**
- Sjekk Vercel-dashboard → Deployments → Logs
- Vanlig årsak: ny dependency lagt til lokalt men ikke i lockfile

**Railway-deploy feiler:**
- Sjekk Railway-dashboard → Deployments → Logs
- Vanlig årsak: ny env-var lagt til i kode men ikke i Railway Variables
```

- [ ] **Step 2: Commit**

```bash
git add docs/deploys.md
git commit -m "docs: add deploys.md with preview-environment overview"
```

---

### Task 8: Add preview section to `CONTRIBUTING.md`

**Files:**
- Modify: `CONTRIBUTING.md`

- [ ] **Step 1: Add a "Preview-deploys" section before "Secrets"**

Find the line `## Secrets` in `CONTRIBUTING.md`. Insert above it:

```markdown
## Preview-deploys

Hver PR mot `main` får automatisk en Vercel preview-URL.

- Når du åpner PR-en, Vercel-boten poster en kommentar med URL-en (typisk i løpet av 1-2 min)
- Klikk URL-en for å se endringen din live i browser
- Preview-frontenden snakker med samme staging-backend som `main` (én delt Railway-instans)

**Hvis PR-en endrer backend-oppførsel:**

Backend deployer kun fra `main`. Det betyr at:
1. Hvis PR-en din inneholder ENDA-IKKE-MERGET backend-endringer, vil preview-frontenden snakke med GAMMEL backend
2. For å teste backend-endringer end-to-end før merge, kjør backend lokalt mens du tester preview-URL-en (eller del PR-en i en backend-først og en frontend-først PR)

Se [docs/deploys.md](docs/deploys.md) for full oversikt over deploys og env vars.

```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: add preview-deploys section to CONTRIBUTING"
```

---

### Task 9: Link `docs/deploys.md` from `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add a "Deploys" reference**

Find the section `## Test- og lint-flow` in `CLAUDE.md`. Insert above it:

```markdown
## Deploys

- Frontend lever på Vercel, backend på Railway, DB i Supabase
- Hver PR får automatisk en Vercel preview-URL (postes som kommentar av Vercel-boten)
- Backend deployer fra `main` etter merge
- Se [docs/deploys.md](docs/deploys.md) for env vars, dashboards, og feilsøking
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: link deploys.md from CLAUDE.md"
```

---

### Task 10: Push docs to remote main

**Files:** none

- [ ] **Step 1: Push**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git push origin main
```

Expected: 4 new commits pushed (env example, deploys.md, CONTRIBUTING, CLAUDE.md).

- [ ] **Step 2: Verify on GitHub**

Open repo in browser. Confirm latest commit.

- [ ] **Step 3: Confirm Vercel and Railway both re-deploy**

Both should auto-deploy on main push. Wait until both are Active.

---

## Phase E — End-to-end verification

### Task 11: Open a test PR and verify the preview flow end-to-end

**Files:** none (verification only)

- [ ] **Step 1: Create a test branch with a trivial visible change**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git checkout main && git pull
git checkout -b chore/preview-flow-verify
```

Make a tiny visible change to verify preview-URL shows your edits. For example, edit `web/src/app/login/page.tsx` to change a label, or just add a comment to any file. Avoid changes that need backend.

```bash
git add <file>
git commit -m "chore: verify preview flow"
git push -u origin chore/preview-flow-verify
```

- [ ] **Step 2: Open PR**

```bash
gh pr create --title "chore: verify preview flow" --body "End-to-end verification of preview environments."
```

- [ ] **Step 3: Wait for Vercel preview**

Within ~2 minutes, Vercel-boten should post a comment on the PR with a preview URL.

```bash
gh pr view --comments
```

Look for a comment from `vercel[bot]` containing a `https://ai-coach-...vercel.app` URL.

- [ ] **Step 4: Open preview URL in browser, verify**

Visit the preview URL. Verify:
- The page loads (Supabase login works = env vars OK)
- The change you made is visible (preview reflects PR contents)
- Browser DevTools console has NO CORS errors when the page calls the API
- The Network tab shows successful calls to `https://ai-coach-production-0d0c.up.railway.app/api/...` (or 401 if not logged in — that's fine, it's auth, not CORS)

If there ARE CORS errors:
- Note the exact preview URL
- Test the regex: `python3 -c "import re; print(bool(re.match(r'^https://ai-coach-[a-z0-9-]+-trymvestengens-projects\\.vercel\\.app\$', '<paste preview URL>')))"`
- If regex doesn't match, fix it in Railway Variables and re-test

- [ ] **Step 5: Clean up**

```bash
gh pr close chore/preview-flow-verify --delete-branch
```

(Don't merge — this was a verification-only PR.)

---

## Out of scope — explicit

Per the spec, these are NOT in this plan and will get their own work later:

1. Custom domain on Vercel and Railway
2. Separate prod vs staging backend (separate Railway instance per env)
3. Database branching / seed scripts for preview-isolation
4. Per-PR backend (Approach B with Railway Pro)
5. Voice-stack env vars and deploy verification
6. CI integration for Vercel preview status (require preview build green before merge)

Do not creep into these. If you notice a related issue while implementing, write it as a GitHub issue and move on.
