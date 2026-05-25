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
