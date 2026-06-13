# AI Coach — Forge design system (referanse for skjerm-mockups)

Statiske HTML/CSS-mockups, ingen rammeverk. Alle skjermer deler `forge.css` + `theme.js`.

## Regel #1
Bruk **KUN** klassene og tokens under. **Ingen inline-farger.** Trenger du en farge,
bruk en CSS-variabel (`var(--accent)`, `var(--ink)`, ...). Da blir alle skjermer
konsistente og tema-bryteren (lys/mørk) virker overalt. Inline `style` for ren
layout (margin/grid) er ok, men aldri for farge/skygge.

## Tokens (CSS-variabler — lys i `:root`, mørk i `[data-theme="dark"]`)
`--canvas --surface --subtle --border --ink --muted --faint` ·
`--accent (#f97316) --accent-deep --accent-soft --glow (#fb923c)` ·
`--success --danger` · struktur: `--plate --plate-2 --hairline --hairline-strong --on-accent` ·
radius: `--r-sm (6) --r-md (12) --r-lg (18)`.

## Klasse-vokabular (1 linje hver)
**Skjelett / chrome**
- `.phone-frame` — 390px telefon sentrert på nøytral scene; inneholder `.screen`.
- `.screen` — selve skjermflaten (flex-kolonne, fast høyde, maskinert grid-tekstur).
- `.status-bar` > `.notch` — toppnotch.
- `.app-topbar` — topplinje; inneholder `.datebar` (m/ `.tick`) og `.theme-toggle`.
- `.theme-toggle` — sol/måne-knapp (sol/måne byttes auto via tema). Bind av `theme.js`.
- `.screen-scroll` — scrollbart innholdsområde mellom topbar og nav.

**Tekst-primitiver**
- `.eyebrow` — liten versal label med prikk.
- `.display-title` — stor display-overskrift (−3% spacing).
- `.tnum` (alias `.mono`) — mono + tabular tall (brukes på ALLE tall).

**Header-biter**
- `.greet` (m/ `.dot`) — stor "Hei, Trym." hilsen.
- `.streak` > `.flame` + `.num` — streak-pille.

**Hero (max ett oransje hero per skjerm)**
- `.hero` > `.eyebrow`, `.hero-title`, `.hero-sub`, knapp.

**Knapper**
- `.btn` basis; modifikatorer `.btn-primary` (molten), `.btn-ghost` (hairline),
  `.btn-block` (full bredde), `.btn-pill` (liten avrundet). `.btn .arrow` animeres.

**Plater / lister**
- `.panel` — generisk hairline-plate. `.panel-list` — vertikal liste m/ gap.
- `.list-row` > `.row-main` (`.row-name`, `.row-meta`), `.row-trail`. `.friend` for sosial-stil.
- `.plate-icon` — 40px ledende ikon-plate (✓, initial).

**Stats**
- `.stat-grid` > `.stat-tile` (`.v` tall, `.l` label); `.stat-tile.accent` = oransje tall.

**Seksjonshoder**
- `.section-head` > `.section-label` (m/ `.meta`) + `.section-link` ("Se alle →").

**Sosialt**
- `.avatar` (`.live` ring, `.live-dot`); `.pr-badge` — PR-merke.

**Chips / faner**
- `.chip-row` > `.chip` (+ `.active`) — filter-/segment-piller.

**Fremdrift**
- `.progress` > `.bar` (sett bredde via inline `style="width:%"`).

**Chat (coach)**
- `.chat-thread` > `.bubble.coach` / `.bubble.user`.
- `.input-row` > `.field` + `.send` — composer / input-felt.

**Kalender / program**
- `.calendar-grid` > `.cal-cell` (+ `.muted` / `.done` / `.today`).
- `.day-row` (m/ `.day-tag`); `.exercise-row` (`.ex-name`, `.ex-spec`).

**Nav**
- `.bottom-nav` > `.nav-item` (+ `.active`) — fast bunn-nav. Lim inn fra `nav.html`.

**Diverse**
- `.footnote` — liten versal bunntekst.

## Minimalt skjelett for en ny skjerm
```html
<!DOCTYPE html>
<html lang="nb" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Coach — Skjermnavn</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="forge.css">
  <script src="theme.js"></script>   <!-- i <head>, ikke defer: unngår tema-flash -->
</head>
<body>
  <div class="phone-frame">
    <div class="screen">
      <div class="status-bar"><div class="notch"></div></div>

      <div class="app-topbar">
        <div class="datebar"><span class="tick"></span>fredag 13. juni</div>
        <button class="theme-toggle" type="button" aria-label="Bytt tema" aria-pressed="false">
          <svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
          </svg>
          <svg class="i-moon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        </button>
      </div>

      <div class="screen-scroll">
        <!-- skjermens innhold her -->
      </div>

      <!-- lim inn nav.html her; sett .active + aria-current="page" på riktig fane -->
    </div>
  </div>
</body>
</html>
```

## Tema
`theme.js` leser/skriver localStorage-nøkkel **`forge-theme`** (delt på tvers av sider),
setter `data-theme` på `<html>` før paint, og binder alle `.theme-toggle`.
Valget huskes mellom sider og økter.
