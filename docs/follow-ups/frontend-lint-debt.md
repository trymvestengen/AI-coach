# Frontend lint debt: refactor `setState`-in-effect patterns

**Opprettet:** 2026-05-25 (under team-foundation-arbeidet)
**Konvertér til GitHub-issue:** når issue tracker er klargjort i Phase D

## Bakgrunn

ESLint-regelen `react-hooks/set-state-in-effect` (ny i React 19) flagger fire steder i frontenden hvor vi kaller `setState` direkte i `useEffect`-body. Dette er anti-mønstret beskrevet i https://react.dev/learn/you-might-not-need-an-effect.

Vi `eslint-disable`-et hver av dem med en `TODO(frontend-lint-debt)`-kommentar i team-foundation-arbeidet for å unngå å sprenge scope. Disse skal håndteres som del av frontend-cleanup-workstreamen, ikke isolert.

## Stedene som er disablet

| Fil | Linje | Mønster | Foreslått fix |
|---|---|---|---|
| `web/src/components/program/ExerciseDetail.tsx` | 37 | Lokal edit-state synces fra props (reps, weight) | Commit-on-blur + dirty tracking. Eller derivert state. |
| `web/src/components/program/ExerciseLibrary.tsx` | 36 | `setLoading(true)` i fetch-effect | Bytt til React Query / SWR / dedikert `useFetch`-hook |
| `web/src/components/program/ProgramScreen.tsx` (`ActiveExerciseRow`) | 180 | Lokal log-state synces fra log-prop | Samme som ExerciseDetail — commit-on-blur, eller flytt state opp |
| `web/src/components/social/SocialScreen.tsx` | 479 | `setSearchResults([])` i debounce-effect | Extract til `useDebouncedSearch`-hook |

## Også verdt å vurdere

3 `<img>`-warnings som ikke ble håndtert:
- `web/src/app/(tabs)/profile/page.tsx:92` — bytt til `<Image />` fra `next/image`
- `web/src/app/onboarding/page.tsx:454` — samme
- `web/src/components/exercises/ExerciseDetail.tsx:95` — samme

Disse er warnings, ikke errors, så de blokkerer ikke CI. De fixes naturlig som del av frontend-redesign-arbeidet.

## Hvorfor vi ikke gjorde det nå

Foundation-spec-en ([docs/superpowers/specs/2026-05-25-team-foundation-design.md](../superpowers/specs/2026-05-25-team-foundation-design.md)) listet "Frontend kode-cleanup" eksplisitt som out-of-scope. Disse er reelle bugs/anti-mønstre som fortjener tankegang i kontekst av en frontend-workstream, ikke en hastefiks for å åpne CI-gate.

## Hvordan finne dem igjen

```bash
rg "frontend-lint-debt" web/src
```
