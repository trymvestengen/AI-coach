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
