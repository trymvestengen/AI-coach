# Forge full-app redesign (Plan C) — Implementeringsplan

**Goal:** Bygg ALLE gjenstående skjermer om til forge-mockupene i `design-variants/app-preview/`, så hele appen matcher det valgte forge-designet (lyst + mørk). Trening-tab + mal-detalj (Plan B) er allerede forge-tro.

**Bakgrunn:** Designet ble valgt via `design-compare` (3 varianter: frontend-design / impeccable / taste-skill) → reconciled til **forge** → full mockup-sett i `app-preview/` (forge.css). Plan B leverte forge-token-systemet (lyst+mørk) + Trening-flyten. Plan C tar resten av skjermene.

**Tech:** Next 16 App Router, Tailwind v4, TS, Vitest. Branch: `feat/forge-redesign` (avgrenet fra Plan B / PR #35).

## Arkitektur-beslutning: scoped forge-komponentlag

Mockupene bruker `forge.css`-komponentklasser (`.hero`, `.stat-tile`, `.panel-list`, `.list-row`, `.btn-primary`, `.chip`, …). Appen brukte til nå inline-token-styling. For 10 skjermer porter vi **forge-komponentlaget inn i `globals.css`**, men:
- **Scoped under `.forge`** (`.forge .hero { … }`) så det IKKE kolliderer med eksisterende globale klasser (`.screen`, `.card`, `.tnum`) eller shadcn/Tailwind. Skjermer opter inn med `className="forge"` på rot.
- **Forge-token-navn aliases til `--brand-*`** (+ lys/mørk-spesifikke verdier for `--accent-soft`, `--hero-grad`, `--on-accent`, `--glow`, `--plate-shadow`). `.dark` (allerede satt av B-1) driver mørk modus.
- Ekskluder telefon-chrome (`.phone-frame/.screen/.status-bar/.bottom-nav`) — appen har egen layout + `BottomNav`.

Da porter mockup-HTML nesten 1:1 → `className`-basert JSX, og dataene wires inn.

## Sub-tasks

- [x] **C-0 Foundation:** scoped forge-komponentlag + token-aliases i `globals.css`. Verifiser: build grønt, eksisterende skjermer uendret (de bruker ikke `.forge`).
- [x] **C-1 Login** (`login.html`) — enklest, høy synlighet. Valider pipelinen ende-til-ende + screenshot.
- [x] **C-2 Hjem** (`home.html`) — app-topbar+datebar, greet-row, hero, stat-grid, panel-list m/ plate-icon. (Sosialt forblir skjult.)
- [x] **C-3 Workout-run** (`workout-run.html`) — forge-tokens i stedet for hardkodet `#1a1a1a`.
- [x] **C-4 Historikk** (`historikk.html`) + detalj.
- [x] **C-5 Profil** (`profile.html`).
- [ ] **C-6 Coach** (`coach.html`) — chat-thread/bubble/input-row.
- [ ] **C-7 Øvelser** (`exercises.html`) + øvelse-detalj.
- [ ] **C-8 Onboarding** (`onboarding.html`).
- [ ] **C-9 Kropp** (`body.html`).
- [ ] **C-10** ThemeToggle → forge `.theme-toggle`-stil (sol/måne-SVG) + evt. delt `.app-topbar` på tvers; full `make check` + manuell røyktest (lyst+mørk) på alle skjermer.

**Per-skjerm-oppskrift:** les mockup → les nåværende komponent → bygg om markup mot forge-klasser (behold data-wiring + tester) → screenshot live vs mockup → iterer → `make check` + commit.

**Rekkefølge-prinsipp:** brukerreise + risiko: Login → Hjem → Workout-run → Historikk → Profil → Coach → Øvelser → Onboarding → Kropp → polish.
