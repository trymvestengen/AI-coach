# Login-skjerm redesign

> **Status:** Design (godkjent 2026-06-06)
> **Scope:** Rebrand login-flyten til lyst brand-system + legg til Google og Apple sign-in via Supabase OAuth.

## Bakgrunn

Dagens `/login`-flate er den siste skjermen som ikke har fått brand-redesign. Den bruker mørk bakgrunn (`#0d0d0d`/`#111`) og gamle CSS-variabler (`--ai-accent`). Det skjærer mot resten av appen (Home/Coach/Profile/Trening), som alle er lyse med oransje aksent.

I tillegg har Supabase støtte for Google og Apple OAuth som vi ikke har eksponert i UI-en ennå. Brukerne har bare e-post/passord som alternativ.

## Mål

1. Rebrand `/login`, `/login/forgot-password`, og `/login/reset-password` til lyst tema med brand-vars.
2. Implementer Layout C: tre store CTA-knapper (Apple, Google, E-post) som primær flate; e-post-feltene utvides inline ved tap.
3. Sett opp Supabase OAuth-callback-rute (`/auth/callback`) som videresender riktig basert på om brukeren er ny eller eksisterende.
4. Apple-knappen kan toggleres av/på via feature-flag inntil Apple Developer-konto er på plass.

## Ikke-mål

- Sign-up via e-post på `/login`-flaten — nye brukere går fortsatt via `/onboarding`-wizarden.
- Magic link / OTP.
- Email-verifikasjon-UI.
- «Husk meg»-checkbox (Supabase håndterer session automatisk).
- Endring av onboarding-wizarden.

## Visuell layout

### Default (initial state)

```
┌─────────────────────────┐
│                         │
│         💪              │
│      AI Coach           │
│  DIN PERSONLIGE TRENER  │
│                         │
│  Logg treninger, følg   │
│  progresjon og få       │
│  personlig coaching     │
│                         │
│ [  Fortsett m/ Apple  ] │
│ [  Fortsett m/ Google ] │
│ [✉️ Fortsett m/ e-post ] │
│                         │
│ Ved å fortsette godtar  │
│ du vilkår og personvern │
└─────────────────────────┘
```

### Etter tap på «Fortsett med e-post»

```
┌─────────────────────────┐
│         💪              │
│      AI Coach           │
│                         │
│ [  Fortsett m/ Apple  ] │
│ [  Fortsett m/ Google ] │
│                         │
│ ── eller med e-post ──  │
│ [ E-post              ] │
│ [ Passord             ] │
│ [    Logg inn         ] │
│                         │
│ Glemt passord?  Ny bruker? │
└─────────────────────────┘
```

- «Fortsett med e-post»-knappen forsvinner når feltene utvides (den var bare en proxy).
- Apple/Google-knappene blir igjen som sekundære alternativer over e-post-formen.
- Hero-blokken med beskrivelse-tekst komprimeres for å gjøre plass til feltene.

## Tekniske integrasjoner

### Supabase OAuth (Google + Apple)

```ts
await supabase.auth.signInWithOAuth({
  provider: 'google', // eller 'apple'
  options: { redirectTo: `${window.location.origin}/auth/callback` }
})
```

Brukeren sendes til Google/Apple → autoriserer → returnerer til `/auth/callback?code=…` → Supabase setter session cookie via `exchangeCodeForSession` → vi videresender til riktig destinasjon.

### Manuell konfigurasjon i Supabase-dashboard (én gang)

- **Google:** Authentication → Providers → Google → enable + lim inn OAuth client ID/secret fra Google Cloud Console. Konfigurer authorized redirect URI til Supabase sin standard callback-URL.
- **Apple:** Authentication → Providers → Apple → enable. Krever Apple Developer-konto + Sign in with Apple-konfigurasjon. Hvis dette ikke er klart, settes `NEXT_PUBLIC_ENABLE_APPLE_LOGIN=false` for å skjule knappen.

### `/auth/callback`-flyt

Server-side route handler i `web/src/app/auth/callback/route.ts`:

1. Henter `code` fra query params.
2. Kaller `supabase.auth.exchangeCodeForSession(code)` — setter session cookie.
3. Sjekker om brukeren har en `users`-row (vår profile-tabell):
   - **Hvis ja** → redirect til `/home`.
   - **Hvis nei** (første gang sosial-innlogging) → redirect til `/onboarding` (wizarden tar over).
4. Ved feil → redirect til `/login?error=oauth_failed`.

## Komponentstruktur

### Nye filer

```
web/src/app/auth/callback/
└── route.ts                          ← OAuth callback handler

web/src/components/login/
├── LoginHero.tsx                     ← logo + tittel + tagline
├── SocialButton.tsx                  ← gjenbrukbar knapp (Apple/Google/E-post)
└── LoginForm.tsx                     ← e-post/passord-form (vises etter expand)
```

### Modifiserte filer

```
web/src/app/login/
├── page.tsx                          ← omstruktureres til client-component med expand-flyt
├── forgot-password/page.tsx          ← rebrand: lyst tema, brand-vars
└── reset-password/page.tsx           ← rebrand: lyst tema, brand-vars
```

Den nye `page.tsx` blir client-component med state for «expanded» (boolean) som styrer om e-post-formen vises.

### Slett

Ingen filer slettes — alt er rebrand/omstrukturering.

## Klient-state

`LoginPage` holder:

```ts
const [expanded, setExpanded] = useState(false)
const [busyProvider, setBusyProvider] = useState<'google' | 'apple' | null>(null)
```

`LoginForm` (kun montert når `expanded = true`) holder e-post/passord/feilmelding lokalt.

## Feature flags

- `NEXT_PUBLIC_ENABLE_APPLE_LOGIN` — `'true'` viser Apple-knappen, alt annet skjuler den. Default `'true'` lokalt, satt eksplisitt per environment.

## Edge cases

| Scenario | Hva som skjer |
|---|---|
| Bruker logger inn med Google første gang | Callback redirecter til `/onboarding` (siden `users`-row mangler) |
| Bruker har allerede e-post-konto, prøver Google med samme e-post | Supabase merger automatisk via e-post (default-oppførsel) |
| OAuth-flyt feiler / bruker avbryter | Returnerer til `/login?error=oauth_failed`; vis liten toast «Innlogging feilet, prøv igjen» |
| Apple Developer-konto mangler | `NEXT_PUBLIC_ENABLE_APPLE_LOGIN=false` skjuler knappen helt |
| Bruker trykker «Fortsett med e-post» mens en sosial-flyt pågår | Knappen disabled så lenge `busyProvider !== null` |
| Bruker har glemt passord | «Glemt passord?»-link (synlig kun i expanded state) → `/login/forgot-password` |
| Bruker er ny | «Ny bruker?»-link → `/onboarding` |

## Brand-styling

| Element | Variabel |
|---|---|
| Bakgrunn | `var(--brand-canvas)` (#fafaf7) |
| Hero-tittel «AI Coach» | `var(--brand-ink)` (#0f0f0f) |
| «DIN PERSONLIGE TRENER»-tagline | `var(--brand-orange)` |
| Logo-tile | gradient `var(--brand-orange) → var(--brand-orange-deep)` |
| Sosial-knapper | hvit bakgrunn, `var(--brand-border)`-ramme, ink-tekst |
| Apple-knapp | sort bakgrunn, hvit tekst (Apple branding-krav) |
| «Logg inn»-knapp | `var(--brand-orange)` bakgrunn, hvit tekst |
| Input-felter | `var(--brand-surface)` bakgrunn, `var(--brand-border)`-ramme |
| Divider («eller med e-post») | `var(--brand-muted)`-tekst, `var(--brand-border)`-linjer |
| Vilkår-link og «Ny bruker?» | `var(--brand-muted)`, underline ved hover |

## Testing

### Frontend (Vitest, co-located)

- `LoginClient.test.tsx`:
  - Default: tre social-knapper vises, ingen form
  - Tap «Fortsett med e-post» → form vises, «Fortsett med e-post»-knapp forsvinner
  - Submit e-post-form → kaller `supabase.auth.signInWithPassword`
  - OAuth-flow: tap «Google» → kaller `supabase.auth.signInWithOAuth({ provider: 'google' })`
  - Apple-knapp skjules når `NEXT_PUBLIC_ENABLE_APPLE_LOGIN !== 'true'`
- `SocialButton.test.tsx`:
  - Rendrer riktig label og icon basert på provider-prop
  - Trigger onClick

### Backend (pytest)

Ingen endringer. Auth er fullt og helt i Supabase.

### Manuell verifisering

- Google sign-in i Vercel preview-environment — krever OAuth client i Google Cloud Console med både prod og preview URL-er som autoriserte redirect URIs.
- Apple sign-in venter til Apple Developer-konto er klar.

## Migreringsplan (kort)

1. Sett opp Google OAuth i Supabase-dashboard (manuell, du gjør dette).
2. Bygg `LoginHero`, `SocialButton`, `LoginForm` parallelt.
3. Omstrukturer `LoginClient.tsx` (page.tsx blir thin wrapper).
4. Lag `/auth/callback/route.ts`.
5. Rebrand forgot-password + reset-password.
6. Verifiser i preview med ekte Google-flyt.
7. Toggle Apple-knappen når Apple-oppsett er klart.
