# Team Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish CI, pre-commit hooks, frontend test infra, docs templates, and branch protection so that no future code can land in `main` without lint/typecheck/test gates and a human review.

**Architecture:** Monorepo with `web/` (Next.js 16, TypeScript) and `api/` (FastAPI, pytest). GitHub Actions runs lint+typecheck+test+build for web, pytest for api — both jobs always run in parallel on every PR. Local `make check` mirrors CI exactly. Husky+lint-staged enforce formatting on commit. Docs (README, CONTRIBUTING, PR/issue templates, CLAUDE.md) make onboarding self-serve.

**Tech Stack:** GitHub Actions, Vitest, React Testing Library, jsdom, Husky v9, lint-staged, Prettier, Make.

**Spec:** [docs/superpowers/specs/2026-05-25-team-foundation-design.md](../specs/2026-05-25-team-foundation-design.md)

**Note on deviation from spec:** Spec mentioned `paths:` filter in CI to skip jobs for unrelated PRs. We're running both jobs unconditionally instead — required status checks in branch protection break when jobs are skipped. Cost is ~2 min on backend-only PRs; benefit is simpler, less error-prone branch protection.

## Branching strategy for this plan

All Tasks 1-15 are committed to local `main`. No one else is pushing yet, so this is safe. Task 16 pushes the accumulated work to remote `main` and verifies CI is green there before configuring branch protection (you cannot select a "required status check" until that check has run at least once). Task 17 is the end-to-end verification PR after branch protection is live.

---

## File Structure

**Created:**
- `.github/workflows/ci.yml` — single workflow with `web` and `api` jobs
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `web/vitest.config.ts`
- `web/vitest.setup.ts`
- `web/src/app/page.test.tsx`
- `web/.prettierrc.json`
- `web/.prettierignore`
- `web/.husky/pre-commit`
- `Makefile`
- `CONTRIBUTING.md`
- `CLAUDE.md`
- `.nvmrc`

**Modified:**
- `web/package.json` — add scripts, deps, lint-staged config, prepare hook
- `README.md` — trim stale MVP section, add CONTRIBUTING link

---

## Phase A — Frontend tooling

### Task 1: Add typecheck script and verify it passes today

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Add typecheck script**

Edit `web/package.json` `scripts` block to add:
```json
"typecheck": "tsc --noEmit"
```

Final scripts section:
```json
"scripts": {
  "dev": "next dev",
  "dev:all": "concurrently -n api,web -c blue,green \"cd ../api && uvicorn app.main:app --reload\" \"next dev\"",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 2: Run typecheck locally**

```bash
cd web && npm run typecheck
```

Expected: passes with no errors. If errors appear, STOP and report them — they need to be fixed (or excluded) before this plan can proceed, otherwise CI will never be green. Do not skip this verification.

- [ ] **Step 3: Run lint locally**

```bash
cd web && npm run lint
```

Expected: passes with no errors. If errors appear, fix or report before continuing.

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/package.json
git commit -m "chore: add typecheck script to web"
```

---

### Task 2: Install Vitest + React Testing Library

**Files:**
- Modify: `web/package.json` (deps)

- [ ] **Step 1: Install dev dependencies**

```bash
cd web && npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Verify install**

```bash
cd web && npx vitest --version
```

Expected: prints a version number (likely 2.x or 3.x).

- [ ] **Step 3: Add test scripts to package.json**

Edit `web/package.json` `scripts` block to add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/package.json web/package-lock.json
git commit -m "chore: install vitest and react testing library"
```

---

### Task 3: Configure Vitest

**Files:**
- Create: `web/vitest.config.ts`
- Create: `web/vitest.setup.ts`

- [ ] **Step 1: Create `web/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 2: Create `web/vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest"
```

- [ ] **Step 3: Verify Vitest runs (no tests yet)**

```bash
cd web && npm run test
```

Expected: Vitest reports "No test files found" — that's fine, config is loaded successfully.

- [ ] **Step 4: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/vitest.config.ts web/vitest.setup.ts
git commit -m "chore: add vitest config and setup"
```

---

### Task 4: Write the first smoke test

**Files:**
- Create: `web/src/app/page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/src/app/page.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"

// Root page calls Next.js `redirect()`, which throws in test context.
// We mock it to assert intent without crashing.
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}))

import { redirect } from "next/navigation"
import Root from "./page"

describe("Root page", () => {
  it("redirects to /home", () => {
    Root()
    expect(redirect).toHaveBeenCalledWith("/home")
  })
})
```

- [ ] **Step 2: Run test to verify it passes**

```bash
cd web && npm run test
```

Expected: 1 test passed.

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/src/app/page.test.tsx
git commit -m "test: add smoke test for root redirect"
```

---

### Task 5: Install and configure Prettier

**Files:**
- Modify: `web/package.json` (deps + script)
- Create: `web/.prettierrc.json`
- Create: `web/.prettierignore`

- [ ] **Step 1: Install Prettier**

```bash
cd web && npm install --save-dev prettier
```

- [ ] **Step 2: Create `web/.prettierrc.json`**

```json
{
  "semi": false,
  "singleQuote": false,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100
}
```

- [ ] **Step 3: Create `web/.prettierignore`**

```
.next
node_modules
.turbo
*.tsbuildinfo
public
```

- [ ] **Step 4: Add `format` script to `web/package.json`**

Add to scripts:
```json
"format": "prettier --write ."
```

- [ ] **Step 5: Verify Prettier runs (dry run)**

```bash
cd web && npx prettier --check .
```

Expected: either "All matched files use Prettier code style!" OR a list of files that need formatting. Do NOT run `--write` on the existing codebase as part of this task — that's a separate cleanup PR (touches hundreds of files, would bloat this work). The dev only formats their own changed files via Husky from now on.

- [ ] **Step 6: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/package.json web/package-lock.json web/.prettierrc.json web/.prettierignore
git commit -m "chore: add prettier config"
```

---

### Task 6: Set up Husky + lint-staged

**Files:**
- Modify: `web/package.json` (deps, prepare script, lint-staged config)
- Create: `web/.husky/pre-commit`

Husky v9 in a subdirectory: install hooks to `web/.husky/`, point `core.hooksPath` there via the `prepare` script.

- [ ] **Step 1: Install husky and lint-staged**

```bash
cd web && npm install --save-dev husky lint-staged
```

- [ ] **Step 2: Add `prepare` script and `lint-staged` config to `web/package.json`**

In `scripts`:
```json
"prepare": "cd .. && husky web/.husky"
```

At top level of `package.json` (sibling of `scripts`):
```json
"lint-staged": {
  "web/**/*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "web/**/*.{js,jsx,json,md,css}": ["prettier --write"]
}
```

Note the `web/**` prefix: lint-staged receives paths relative to the git repo root because that's where staged paths are reported.

- [ ] **Step 3: Initialize husky**

```bash
cd web && npm run prepare
```

Expected: creates `web/.husky/` directory, sets `core.hooksPath` to `web/.husky`. Verify:
```bash
git config core.hooksPath
```
Expected output: `web/.husky`

- [ ] **Step 4: Create `web/.husky/pre-commit`**

```sh
cd web && npx lint-staged
```

Make executable:
```bash
chmod +x web/.husky/pre-commit
```

- [ ] **Step 5: Test the hook manually**

Create a deliberately misformatted file to verify hook fires:
```bash
echo "const  x   =   1" > web/src/__hook_test.ts
git add web/src/__hook_test.ts
git commit -m "test: husky" --dry-run
```

Then for real:
```bash
git commit -m "test: husky"
```

Expected: prettier reformats the file (now `const x = 1`), commit succeeds. Verify the file was reformatted in the commit:
```bash
git show HEAD --stat
git show HEAD -- web/src/__hook_test.ts
```

- [ ] **Step 6: Clean up test file and amend**

```bash
git rm web/src/__hook_test.ts
git commit --amend --no-edit
```

Then verify the hook test commit no longer references the test file:
```bash
git show HEAD --stat
```

- [ ] **Step 7: Add typecheck to pre-commit (optional but recommended)**

Edit `web/.husky/pre-commit`:
```sh
cd web && npx lint-staged && npm run typecheck
```

Test by trying to commit a file with a type error and confirming the hook blocks it. Revert after verifying.

- [ ] **Step 8: Commit the husky setup**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add web/package.json web/package-lock.json web/.husky/pre-commit
git commit -m "chore: add husky pre-commit hook with lint-staged"
```

---

## Phase B — Continuous Integration

### Task 7: Add `.nvmrc` for consistent Node version

**Files:**
- Create: `.nvmrc`

- [ ] **Step 1: Determine current Node version**

```bash
node --version
```

Use the major version. Example: if output is `v22.5.1`, use `22`.

- [ ] **Step 2: Create `.nvmrc`** at repo root with just the version number, e.g.:

```
22
```

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add .nvmrc
git commit -m "chore: pin node major version via .nvmrc"
```

---

### Task 8: Verify backend tests pass locally

This must work before we wire CI, otherwise we'll waste CI cycles diagnosing a pre-existing failure.

- [ ] **Step 1: Run pytest in api/**

```bash
cd api
python -m venv .venv 2>/dev/null || true
source .venv/bin/activate
pip install -q -r requirements.txt
pytest
```

Expected: all tests pass. If they don't, STOP and report — pre-existing test failures are out of scope for this plan and need to be addressed first (either by fixing them or by xfail-ing and tracking as issues).

- [ ] **Step 2: Note the exit code**

If exit 0, proceed. If non-zero, do not continue with the CI workflow task.

---

### Task 9: Create the CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  web:
    name: Web (lint, typecheck, test, build)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
          cache-dependency-path: web/package-lock.json

      - run: npm ci

      - run: npm run lint

      - run: npm run typecheck

      - run: npm run test

      - run: npm run build

  api:
    name: API (pytest)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: api
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: api/requirements.txt

      - run: pip install -r requirements.txt

      - run: pytest
```

- [ ] **Step 2: Validate YAML syntax locally (no parser needed — visually check indentation)**

If `yamllint` is installed:
```bash
yamllint .github/workflows/ci.yml
```

Otherwise eyeball: each step has 6-space indent for its keys, 4-space indent for the dash.

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add .github/workflows/ci.yml
git commit -m "ci: add github actions workflow for web and api"
```

- [ ] **Step 4: Defer remote verification to Task 16**

CI runs on push or PR. We'll push to `main` in Task 16 and verify there. Don't open a verification branch now — it complicates the order of operations with branch protection.

---

## Phase C — Repo-level orchestration

### Task 10: Create Makefile

**Files:**
- Create: `Makefile`

- [ ] **Step 1: Create `Makefile`** at repo root:

```makefile
.PHONY: dev test test-web test-api lint lint-web lint-api typecheck check format help

help:
	@echo "Available targets:"
	@echo "  make dev        Start api and web in parallel"
	@echo "  make test       Run all tests (web + api)"
	@echo "  make lint       Run linters (web + api implicit via tests)"
	@echo "  make typecheck  Run typescript check"
	@echo "  make check      Run everything CI runs, locally"
	@echo "  make format     Run prettier --write on web"

dev:
	cd web && npm run dev:all

test: test-web test-api

test-web:
	cd web && npm run test

test-api:
	cd api && pytest

lint: lint-web

lint-web:
	cd web && npm run lint

typecheck:
	cd web && npm run typecheck

check: lint typecheck test
	cd web && npm run build

format:
	cd web && npm run format
```

- [ ] **Step 2: Verify each target**

```bash
make help
make lint
make typecheck
make test-web
make test-api
```

Each should succeed (or print the expected output). If `make check` fails because some step fails, fix BEFORE proceeding.

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add Makefile
git commit -m "chore: add makefile for cross-repo orchestration"
```

---

## Phase D — Documentation

### Task 11: Create PR template

**Files:**
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: Create the template**

```markdown
## Hva

<én-to setninger om hva PR-en gjør>

## Hvorfor

<kontekst: hvilken issue, hvorfor akkurat denne løsningen>

## Hvordan testet

- [ ] Lokalt: <hvilke kommandoer, hvilke flows manuelt>
- [ ] Tester lagt til eller oppdatert
- [ ] `make check` passerer lokalt

## Screenshots (hvis UI)

<dra inn bilder her>

## Sjekkliste

- [ ] Brancnavn følger `<initialer>/<beskrivelse>`-konvensjon
- [ ] Commit-meldinger bruker `feat: / fix: / docs: / refactor: / chore: / test:` prefix
- [ ] PR-en er liten nok til at en kollega kan reviewe på under 15 minutter (hvis ikke: del opp eller forklar hvorfor i "Hvorfor")
```

- [ ] **Step 2: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add .github/pull_request_template.md
git commit -m "docs: add pull request template"
```

---

### Task 12: Create issue templates

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`

- [ ] **Step 1: Create `bug_report.md`**

```markdown
---
name: Bug report
about: Rapporter en bug
title: "[bug] "
labels: bug
---

## Hva forventet du?

<beskriv ønsket oppførsel>

## Hva skjedde?

<beskriv faktisk oppførsel, inkluder feilmelding hvis relevant>

## Reproduserings-steg

1. ...
2. ...
3. ...

## Miljø

- OS:
- Browser (hvis frontend):
- Node-versjon (hvis backend-uavhengig):

## Skjermbilder eller logger

<lim inn hvis tilgjengelig>
```

- [ ] **Step 2: Create `feature_request.md`**

```markdown
---
name: Feature request
about: Foreslå ny funksjonalitet
title: "[feature] "
labels: enhancement
---

## Problemet

<hvilket problem løser denne featuren? Hvem opplever det?>

## Foreslått løsning

<beskriv hvordan featuren skal funke>

## Alternativer vurdert

<hvilke andre tilnærminger ble vurdert, og hvorfor ble den foreslåtte valgt?>

## Avhengigheter / blockers

<er det noe annet som må på plass først?>
```

- [ ] **Step 3: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add .github/ISSUE_TEMPLATE/
git commit -m "docs: add issue templates for bugs and features"
```

---

### Task 13: Create CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Create the file**

```markdown
# Bidra til ai-coach

Velkommen. Denne fila beskriver team-konvensjonene. Les den én gang før du åpner din første PR.

## Komme i gang

Følg [README.md](README.md) for å sette opp lokal stack.

For å verifisere at oppsettet ditt vil passere CI:

```bash
make check
```

Dette kjører lint, typecheck, tester og build — samme som GitHub Actions.

## Branches og PRs

- **Aldri push direkte til `main`.** Det er blokkert av branch protection — du må gå via PR.
- **Branch-navn:** `<initialer>/<kort-beskrivelse>` — f.eks. `tv/fix-share-state`, `np/auth-refactor`.
- **Åpne PR som draft** hvis arbeidet er pågående. Marker "Ready for review" når CI er grønn og du vil ha review.
- **Krev approval:** alle PR-er trenger minst én approving review fra noen annen enn forfatteren før merge.
- **Squash and merge** er default — gir renere historikk.

## Commit-meldinger

Bruk prefiks:
- `feat:` — ny funksjonalitet
- `fix:` — bugfix
- `docs:` — kun dokumentasjon
- `refactor:` — kode-endring uten funksjonell forskjell
- `chore:` — verktøy, config, dependencies
- `test:` — kun tester

Eksempel: `feat: add workout sharing modal`.

## Code review-etikette

- **Kommenter koden, ikke personen.** "Denne funksjonen kunne være enklere", ikke "du gjorde dette dårlig".
- **Bruk `nit:` prefiks** for kommentarer du ikke krever endring på. Det signaliserer "dette er småplukk, opp til deg".
- **Godkjenn raskt** hvis du ikke har innvendinger. En PR som ligger og venter er en kostnad for hele teamet.
- **Be om endringer eksplisitt** hvis noe må fikses før merge — ikke bare kommenter og glem.

## Tester

- **Backend (`api/`):** pytest, mocker DB-tilkoblinger. Skriv tester for nye routers/services/tools.
- **Frontend (`web/`):** Vitest + React Testing Library. Ikke krav om dekning, men skriv test når du fikser en bug (testen ville fanget den), eller når du bygger noe kritisk (auth, sharing, payment).
- **Ingen seremonitester.** `it("renders without crashing")` fanger ingenting og er bortkastet tid.

## Secrets

API-nøkler og hemmeligheter ligger i `.env`-filer (ignorert av git). Deles via 1Password / Bitwarden / DM — aldri commit til repo, aldri lim inn i Slack/Discord-meldinger som ikke slettes.

## Når du står fast

Spør! Er det noe i CONTRIBUTING/README som er uklart, åpne en PR mot dokumentene direkte. Bedre å oppdatere docs enn å la neste person streve.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add CONTRIBUTING.md
git commit -m "docs: add contributing guide"
```

---

### Task 14: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Read current README**

```bash
cat README.md
```

- [ ] **Step 2: Verify "Kjøre lokalt" instructions actually work**

In a temp directory:
```bash
cd $(mktemp -d)
git clone <repo-url> ai-coach-test
cd ai-coach-test
# Follow each step in README "Kjøre lokalt" exactly
```

Note any steps that fail or require unstated knowledge. Update README accordingly.

- [ ] **Step 3: Trim the MVP section**

Replace the "MVP-rekkefølge" block with a one-line status pointer:

```markdown
## Status

Aktiv utvikling. Se [PROJECT_PLAN.md](PROJECT_PLAN.md) for detaljerte tasks og milepæler. Se [CONTRIBUTING.md](CONTRIBUTING.md) for team-konvensjoner.
```

- [ ] **Step 4: Add a "Bidra" section near the top**

```markdown
## Bidra

Les [CONTRIBUTING.md](CONTRIBUTING.md) før du åpner din første PR. Kort versjon:

- Branch-navn: `<initialer>/<beskrivelse>`
- Commit-prefiks: `feat: / fix: / docs: / refactor: / chore: / test:`
- Alle PR-er trenger approval — ingen self-merge
- Kjør `make check` lokalt før du pusher
```

- [ ] **Step 5: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add README.md
git commit -m "docs: trim stale MVP section, link to CONTRIBUTING"
```

---

### Task 15: Create CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Create the file**

```markdown
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

- **Språk i UI-tekst:** norsk (default). Engelsk variant kommer.
- **Persona-default:** "Friend" (vennlig, kunnskapsrik, litt humoristisk). Se [prompts/coach-system-prompt.md](prompts/coach-system-prompt.md).
- **Tool use:** alle Claude-tools defineres i `api/app/tools/`. Hver tool har én ansvarsoppgave.
- **Routers:** `api/app/routers/` — kun HTTP-lag, ingen forretningslogikk.
- **Services:** `api/app/services/` — forretningslogikk, kan kalles fra routers og tools.

## Viktige filer å lese først

Hvis du jobber på:
- **Coach/chat-flow:** [api/app/main.py](api/app/main.py), [api/app/tools/](api/app/tools/), [prompts/coach-system-prompt.md](prompts/coach-system-prompt.md)
- **Frontend chat-UI:** [web/src/app/coach/](web/src/app/coach/), [web/src/components/](web/src/components/)
- **DB-skjema:** [api/db/](api/db/), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **Auth:** [api/app/auth.py](api/app/auth.py), [web/src/middleware.ts](web/src/middleware.ts)

## Test- og lint-flow

- Kjør `make check` før PR — det matcher CI eksakt
- Frontend-tester: Vitest, co-located (`Foo.tsx` → `Foo.test.tsx`)
- Backend-tester: pytest, mocker DB. Ligger i `api/tests/`
- Pre-commit hooks formaterer endrede filer automatisk (Husky + lint-staged)

## Hva Claude IKKE skal gjøre uten å spørre

- Commit direkte til `main` (blokkert av branch protection uansett)
- Endre DB-skjema uten å oppdatere [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Legge til nye AI-providers uten å sjekke abstraksjonen i `api/app/services/`
- Reformatere store deler av kodebasen i en uvanlig PR — gjør det som dedikert "chore: format" PR
- Skrive seremonitester (`renders without crashing`) — skriv ekte tester eller la være

## Out-of-scope-arbeid på vent

Disse problemene er kjent og kommer i egne specs senere — ikke prøv å fikse dem i sidekvest:

1. Frontend redesign (premium-følelse)
2. Kode-duplisering i frontend
3. Backend arkitektur-rydding (routers/services/tools-grenser)
4. Backend error-håndtering og validering
5. DB-skjema cleanup
6. Security audit
```

- [ ] **Step 2: Commit**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project context for AI agents"
```

---

## Phase E — GitHub configuration and verification

### Task 16: Configure branch protection on GitHub

**This task is manual** — done via GitHub web UI, not code. Document the steps so the other developer can verify.

- [ ] **Step 1: Push all commits to `main`** (last time direct push will work)

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git push origin main
```

- [ ] **Step 2: Wait for CI to run on `main`**

```bash
gh run watch
```

Expected: green run on `main`.

- [ ] **Step 3: Configure branch protection**

Open in browser: `https://github.com/<owner>/<repo>/settings/branches`

Click "Add branch protection rule" (or "Add rule"). Branch name pattern: `main`.

Enable:
- ☑ Require a pull request before merging
  - ☑ Require approvals (1 approval)
  - ☑ Dismiss stale pull request approvals when new commits are pushed
- ☑ Require status checks to pass before merging
  - ☑ Require branches to be up to date before merging
  - Required checks: `Web (lint, typecheck, test, build)`, `API (pytest)` (search and select after CI has run at least once)
- ☑ Require conversation resolution before merging
- ☑ Do not allow bypassing the above settings (apply to admins)
- ☐ Allow force pushes — leave UNCHECKED
- ☐ Allow deletions — leave UNCHECKED

Save the rule.

- [ ] **Step 4: Verify branch protection blocks direct push**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git checkout main
echo "# test" >> README.md
git add README.md
git commit -m "test: should be blocked"
git push origin main
```

Expected: push is rejected by GitHub with a message about branch protection. Revert the commit:
```bash
git reset --hard HEAD~1
```

- [ ] **Step 5: Verify branch protection allows PR merge after approval**

(This part is verified in Task 17.)

- [ ] **Step 6: Configure repo defaults**

In `Settings → General`:
- Default merge method: "Squash merging"
- Uncheck "Allow merge commits"
- Uncheck "Allow rebase merging" (optional, simpler with only squash)

---

### Task 17: End-to-end foundation verification

This is the acceptance test for the whole plan.

- [ ] **Step 1: Create a clean test branch**

```bash
cd /Users/trymvestengen/Desktop/ai-coach
git checkout main && git pull
git checkout -b chore/foundation-verify
```

- [ ] **Step 2: Make a trivial change**

```bash
echo "" >> README.md  # add empty line
git add README.md
git commit -m "chore: verify foundation"
```

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin chore/foundation-verify
gh pr create --title "chore: verify foundation" --body "End-to-end verification of CI + branch protection."
```

- [ ] **Step 4: Verify PR template was applied**

Check the PR body in the GitHub UI — it should NOT match what you typed if the template kicks in. (Note: `gh pr create --body` overrides the template. To verify template: open a PR in the browser instead.)

- [ ] **Step 5: Verify CI runs both jobs**

```bash
gh pr checks --watch
```

Expected: `Web (lint, typecheck, test, build)` and `API (pytest)` both run and pass.

- [ ] **Step 6: Verify cannot merge without approval**

```bash
gh pr merge --squash
```

Expected: fails with branch protection error about missing approvals.

- [ ] **Step 7: Verify CI failure blocks merge**

Push a deliberate lint error:
```bash
echo "const   x=1;const   y=2" > web/src/__lint_test.ts
git add web/src/__lint_test.ts
git commit -m "test: trigger lint fail"
```

Pre-commit hook should catch this. If it does:
- ✅ Pre-commit verified working
- Manually bypass for the test: `git commit -m "test: trigger lint fail" --no-verify`

Push:
```bash
git push
gh pr checks --watch
```

Expected: `Web` job fails on lint. Revert:
```bash
git rm web/src/__lint_test.ts
git commit -m "revert: remove lint test"
git push
```

- [ ] **Step 8: Get approval from the other dev, merge**

Either:
- Ask the second dev to approve (real workflow)
- Or temporarily disable "Require approvals" → merge → re-enable (only if no other dev available)

```bash
gh pr merge --squash --delete-branch
```

- [ ] **Step 9: Final verification checklist**

Manually walk through the spec's success criteria:

- [ ] CI runs green on a trivial PR ✓ (verified in Step 5)
- [ ] CI fails correctly on lint error ✓ (verified in Step 7)
- [ ] Direct push to `main` blocked ✓ (verified in Task 16 Step 4)
- [ ] Merge without approval blocked ✓ (verified in Step 6)
- [ ] `make check` passes locally on clean main:
  ```bash
  git checkout main && git pull
  make check
  ```
- [ ] Pre-commit hook blocks lint errors ✓ (verified in Step 7)
- [ ] New dev can follow README + CONTRIBUTING from scratch — ask the second dev to verify this end-to-end
- [ ] PR template appears on new PRs — verify by opening another PR in the GitHub UI
- [ ] `CLAUDE.md` is committed: `git log --oneline | grep CLAUDE`

If all green, the foundation is done.

---

## Out of scope — explicit

Per the spec, these are NOT addressed in this plan and will get their own specs later:

1. Frontend redesign (premium-følelse)
2. Frontend kode-cleanup (dedupe, shared components)
3. Backend arkitektur-rydding (routers/services/tools-grenser)
4. Backend error-håndtering og validering
5. DB-skjema cleanup
6. Security audit

Do not let any of these creep into this plan. If you notice a related issue while implementing, write it as a GitHub issue and move on.
