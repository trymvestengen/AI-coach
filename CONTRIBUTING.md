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
- **Åpne PR som draft** hvis arbeidet er pågående. Marker "Ready for review" når CI er grønn.
- **Review er ikke et formelt krav** — du kan merge selv når CI er grønn. Men: be om review når PR-en er stor, rører kritisk område (auth, betalinger, DB-skjema), eller du er usikker. Helst dele PR-lenken i chat før merge så den andre kan kikke hvis han har tid.
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

Når du *blir bedt* om å reviewe (review er ikke obligatorisk):

- **Kommenter koden, ikke personen.** "Denne funksjonen kunne være enklere", ikke "du gjorde dette dårlig".
- **Bruk `nit:` prefiks** for kommentarer du ikke krever endring på. Det signaliserer "dette er småplukk, opp til deg".
- **Be om endringer eksplisitt** hvis noe må fikses før merge — ikke bare kommenter og glem. Forfatteren kan velge å merge uansett, men eksplisitte forespørsler synliggjør innvendingene.

## Tester

- **Backend (`api/`):** pytest, mocker DB-tilkoblinger. Skriv tester for nye routers/services/tools.
- **Frontend (`web/`):** Vitest + React Testing Library. Ikke krav om dekning, men skriv test når du fikser en bug (testen ville fanget den), eller når du bygger noe kritisk (auth, sharing, payment).
- **Ingen seremonitester.** `it("renders without crashing")` fanger ingenting og er bortkastet tid.

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

## Secrets

API-nøkler og hemmeligheter ligger i `.env`-filer (ignorert av git). Deles via 1Password / Bitwarden / DM — aldri commit til repo, aldri lim inn i Slack/Discord-meldinger som ikke slettes.

## Når du står fast

Spør! Er det noe i CONTRIBUTING/README som er uklart, åpne en PR mot dokumentene direkte. Bedre å oppdatere docs enn å la neste person streve.

