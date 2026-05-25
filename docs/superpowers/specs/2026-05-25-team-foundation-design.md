# Team Foundation — Design Spec

**Status:** Draft for review
**Dato:** 2026-05-25
**Forfatter:** Trym (m/ Claude)

## Kontekst og motivasjon

Prosjektet (`ai-coach`) har vokst forbi opprinnelig MVP-scope (sosiale features er bygd), og en ny utvikler (kompis) skal snart inn i kodebasen. Per i dag finnes det:

- ✅ Backend-tester (pytest, 14 testfiler)
- ❌ Ingen CI (`.github/` finnes ikke)
- ❌ Ingen frontend-tester
- ⚠️ Lint finnes, men ikke håndhevet
- ⚠️ Ingen typecheck-script
- ⚠️ README har stale MVP-rekkefølge som ikke matcher faktisk progresjon

Brukeren har flere kvalitetsbekymringer (frontend-design, kode-duplisering, backend-arkitektur, error-håndtering, DB-skjema, security) som hver er en egen workstream. Denne spec-en dekker **kun** "anti-mess foundation" — infrastrukturen som hindrer at neste feature gjør problemet verre. De andre workstream-ene tas etter at foundationen står.

## Mål

Når denne spec-en er ferdig implementert:

1. Ingen kode kan merges til `main` uten grønn CI og kode-review fra en annen person.
2. En ny utvikler kan klone repoet og kjøre `make check` lokalt for å verifisere at endringene deres vil passere CI før de pusher.
3. Frontend har infrastruktur (men ikke krav om dekning) for å skrive tester.
4. Type-feil og lint-feil oppdages før kode lander i `main`.
5. PR- og issue-konvensjoner er dokumentert og håndhevet via templates.

## Ikke-mål (med vilje)

- Ingen E2E-tester (Playwright/Cypress). Tas senere.
- Ingen auto-deploy fra CI — Vercel og Railway gjør sitt eget.
- Ingen coverage-gate. Vi skriver tester der det gir verdi, ikke for å treffe et tall.
- Ingen krav om at nye komponenter må ha tester.
- Ingen pre-commit på backend (kun CI).
- Ingen conventional commits-enforcement (commitlint). Vi følger konvensjonen, men håndhever ikke automatisk.
- Ingen Dependabot/CodeQL/auto-deploy-pipelines. Det blir Approach 3 — for tidlig nå.

## Komponenter

### 1. CI-pipeline (`.github/workflows/ci.yml`)

To parallelle jobber som trigges på PR mot `main`:

**Job `web`:**
- Path filter: `web/**`
- Steg: checkout → setup-node (lock til versjon i `.nvmrc`, opprettes hvis mangler) → `npm ci` → `npm run lint` → `npm run typecheck` → `npm run test` → `npm run build`

**Job `api`:**
- Path filter: `api/**`
- Steg: checkout → setup-python → `pip install -r requirements.txt` → `pytest`

Path-filter betyr at ren backend-PR ikke venter på frontend-bygg, og omvendt.

### 2. Branch protection på `main`

Konfigureres via GitHub repo settings (ikke kode i repoet):

- Krev PR (ingen direkte push, inkludert for repo-eier)
- Krev grønn CI på relevante jobber
- Krev minst 1 approving review fra noen *annen* enn forfatteren — absolutt krav, ingen self-merge
- Krev at branch er up-to-date med `main` før merge
- Default merge-strategi: "Squash and merge"; deaktiver "Merge commit"
- Ingen force-push tillatt

### 3. Pre-commit hooks (kun frontend)

Husky + lint-staged i `web/`. På `git commit`, kjøres på endrede filer:

- `eslint --fix` på `.ts/.tsx`
- `prettier --write` på alt formaterbart
- `tsc --noEmit` på hele prosjektet (TypeScript er holistic)

Hvis noe feiler, blokkeres commit.

Backend: ingen pre-commit (pytest er for tregt for hver commit; CI fanger det).

### 4. Frontend test-infrastruktur

**Stack:** Vitest + React Testing Library + jsdom.

**Konvensjon:** Co-located. `components/Foo.tsx` → `components/Foo.test.tsx`. Ikke `__tests__/`-mapper. Filnavn må ikke matche Next.js route-konvensjoner (skjer ikke ved `.test.tsx`).

**Filer:**
- `web/vitest.config.ts` — `environment: 'jsdom'`, peker på setup-fil
- `web/vitest.setup.ts` — importerer `@testing-library/jest-dom`
- `web/src/app/page.test.tsx` — én smoke-test som starter (renderer uten å krasje)

### 5. Nye scripts

I `web/package.json`:
```
"typecheck": "tsc --noEmit"
"test": "vitest run"
"test:watch": "vitest"
"format": "prettier --write ."
```

I repo-rot, `Makefile`:
```
dev:    starter både api og web (eksisterende dev:all i web/)
test:   kjører frontend + backend tester
lint:   kjører lint begge steder
check:  kjører alt CI gjør, lokalt (lint + typecheck + test + build)
```

`make check` er den viktigste — gir én kommando for "er PR-en min klar?".

### 6. Dokumentasjon

**`README.md` (rydding):**
- Trim "MVP-rekkefølge"-seksjonen til en kort statussetning + lenke til `PROJECT_PLAN.md`
- Verifiser "Kjøre lokalt" steg-for-steg på en ren maskin
- Legg til lenke til `CONTRIBUTING.md`

**`CONTRIBUTING.md` (ny):**
- Branch-navngivning: `<initialer>/<kort-beskrivelse>`
- Commit-stil: `feat: / fix: / docs: / refactor: / chore: / test:`
- PR-prosess: draft for WIP, ready-for-review når CI er grønn, krev approval
- Code review-etikette: kommenter kode ikke person, "nit:" for små ting, godkjenn raskt
- Secrets-håndtering (peker til hvor secrets ligger)

**`.github/pull_request_template.md`:**
- Seksjoner: Hva / Hvorfor / Hvordan testet / Screenshots (hvis UI)

**`.github/ISSUE_TEMPLATE/`:**
- `bug_report.md` — korte, fokuserte felter (hva forventet, hva skjedde, repro-steg)
- `feature_request.md` — problem først, så foreslått løsning

**`CLAUDE.md` i repo-rot (ny):**
- 50-100 linjer
- Prosjekt-konvensjoner: norsk i UI-tekst, "Friend"-persona som default
- Stack-oppsummering og pekere til viktige filer
- Tool use-patterns
- Hvor Claude bør lete for kontekst

## Data flow / arkitektur

Ikke relevant — dette er infrastruktur-arbeid uten data-modell. Eneste arkitektur-implikasjon: CI er kilde-til-sannhet for "fungerer denne PR-en?". Lokalt `make check` skal speile CI eksakt.

## Risiko og avveininger

| Risiko | Avbøtning |
|---|---|
| Husky-hooks irriterer dev og blir disabled lokalt | Hold dem raske (lint-staged på kun endrede filer). Tsc er det treigste — vurder å droppe det fra pre-commit hvis det blir for mye friksjon. |
| Branch protection blokkerer hotfix når den andre dev-en sover | Akseptert kost. Dere har ingen sluttbrukere ennå. Hvis det blir et reelt problem, vurder å gi repo-eier override-rettigheter midlertidig. |
| Vitest co-located filer kommer i veien for Next.js route-discovery | Filnavn på `.test.tsx` matcher ingen Next.js-konvensjoner. Verifisert i deres setup (App Router). |
| Frontend-tester blir aldri skrevet fordi det ikke er krav | Akseptert. Infrastruktur er på plass; kultur følger etter (skriv test når du fikser en bug). |
| CLAUDE.md kommer ut av sync med faktisk konvensjon | Akseptert kost. Bedre å ha noe utdatert enn ingenting. Oppdateres når konvensjoner endres. |

## Suksesskriterier

Foundationen er ferdig når:

- [ ] CI kjører grønn på en test-PR med trivial endring
- [ ] CI feiler korrekt på en test-PR med (a) lint-feil, (b) type-feil, (c) feilende test
- [ ] Forsøk på direkte push til `main` blokkeres av GitHub
- [ ] Forsøk på merge uten approval blokkeres
- [ ] `make check` kjører lokalt og passerer på en ren `main`
- [ ] Pre-commit hook blokkerer en commit med lint-feil
- [ ] En ny utvikler kan følge README + CONTRIBUTING fra null til kjørende lokal stack uten å spørre
- [ ] PR-template vises automatisk når du åpner ny PR
- [ ] `CLAUDE.md` er sjekket inn og brukes faktisk av Claude Code

## Out of scope (kommer i neste workstream)

Disse listes her så vi ikke glemmer dem — men de er IKKE en del av denne spec-en:

1. Frontend redesign (premium-følelse)
2. Frontend kode-cleanup (dedupe, shared components)
3. Backend arkitektur-rydding (routers/services/tools-grenser)
4. Backend error-håndtering og validering
5. DB-skjema cleanup
6. Security audit

Når foundationen står, velger vi én av disse som neste spec.
