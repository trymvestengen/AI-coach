---
name: design-compare
description: Generer 2-4 alternative frontend-design-varianter av samme brief med ULIKE design-skills (frontend-design, impeccable, design-taste-frontend, ui-ux-pro-max) og presenter dem side om side for sammenligning. Bruk når brukeren ber om design-forslag, redesign, eller vil sammenligne design-retninger.
---

# Design-sammenligning

Trym vil se forslag fra FLERE design-kilder på samme brief og velge selv.
Ikke velg én skill og kjør — generer varianter og la ham sammenligne.

## Kilder (velg 2-4, alltid minst én fra hver gruppe)

**Anthropics:** `frontend-design`-skillen (innebygd).
**Tryms installerte:** `impeccable` (.claude/skills/impeccable — bruk dens
register/regler), `design-taste-frontend` (~/.claude/skills — anti-slop-regler),
`ui-ux-pro-max` (plugin — stil-/palett-database), evt. `ui-ux-designer`-agenten.

Default: 3 varianter (frontend-design + impeccable + design-taste-frontend).
Brukeren kan be om flere/færre.

## Prosess

1. **Avklar briefen** kort hvis uklar (hvilken flate, hvilken stemning).
2. **Spawn én subagent per kilde, parallelt.** Hver subagent får:
   - samme brief + relevante eksisterende filer (globals.css, aktuell komponent)
   - instruks om å følge SIN design-kilde sine regler (les skill-fila!) og
     IGNORERE de andre
   - eget output-sted: `design-variants/<kilde>/` (HTML-mock eller
     komponentfil-kopi — ALDRI direkte i prosjektets src/)
3. **Ikke bland reglene.** Poenget er å se kildenes ulike smak — en variant som
   følger alle skills samtidig er grøt.
4. **Presenter:** kompakt tabell (kilde | hovedgrep | typografi | farger |
   motion) + hvordan åpne hver variant i nettleser. Ingen anbefaling med mindre
   han ber om det — valget er hans.
5. **Etter valg:** implementer vinner-varianten i ekte kodebase (følg
   prosjektkonvensjonene), og slett `design-variants/`.

## Regler

- UI-tekst på norsk, mobile-first (jf. CLAUDE.md).
- Variantene skal være sammenlignbare: samme innhold/data, samme viewport.
- Kostnadsbevissthet: ved store flater, lag HTML-mocks fremfor full
  Next.js-integrasjon per variant.
