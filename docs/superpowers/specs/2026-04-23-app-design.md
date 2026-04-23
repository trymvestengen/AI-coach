# AI Coach — App Design Spec

**What we're building:** En treningslogg-app (inspirert av Hevy + Strong + Dropset) med en innebygd AI-coach som primært opererer via voice. Det beste fra alle tre appene kombinert til én enkel, god opplevelse.

**Core insight:** Appen er en treningslogg først — AI-coachen er det som skiller den fra konkurrentene.

---

## Navigasjonsstruktur

5 bunntabs, alltid synlig:

| Tab | Ikon | Innhold |
|-----|------|---------|
| Hjem | 🏠 | Dagens økt, progresjonsoversikt, start-knapp |
| Program | 📋 | Alle programmer, dager og øvelser |
| Logg | ➕ | Aktiv økt + treningshistorikk |
| Sosialt | 👥 | Feed, følg/følger, del økter |
| Profil | 👤 | Statistikk, rekorder, innstillinger |

**Voice Coach** er ikke en tab — det er et overlay tilgjengelig fra alle skjermbilder via en fast knapp (pulserende orb øverst til høyre). Aktiveres med ett trykk.

---

## Hjem-skjermen

- Dagens økt fra aktivt program med navn og øvelsesliste
- Rask progresjonsoversikt: treninger siste 7 dager (streakindikator)
- Stor "Start økt"-knapp
- Voice Coach-knapp øverst til høyre (alltid synlig)

---

## Program-skjermen

**Programliste:**
- Kort per program: navn, antall dager, sist brukt
- AI-genererte og egendefinerte programmer
- Knapp for å lage nytt program (via AI eller manuelt)

**Programdetaljvisning:**
- Dager listet opp (Mandag: Push, Onsdag: Pull osv.)
- Øvelser per dag med muskelgruppe-tags
- Trykk på øvelse → øvelsesdetaljskjerm

**Øvelsesdetaljskjerm:**
- Animert GIF/video av korrekt utførelse (hentet fra wger API)
- Primær- og sekundærmuskelgrupper
- Dine siste 5 ganger med øvelsen
- Personlig rekord
- AI-coach-tips for teknikk

---

## Logg-skjermen

**Aktiv økt (under trening):**

Øvelsene fra dagens program er lastet inn. For hver øvelse:
- Øvelsesnavn + info-knapp (→ øvelsesdetaljskjerm)
- Forrige gang du tok øvelsen vises som referanse (f.eks. "Sist: 80 kg × 5")
- Rader per sett: `[Sett nr] [Vekt kg] [Reps] [✓]`
- Sett-typer: normal, warmup, failure, dropset
- Legg til sett-knapp under radene
- Hvile-nedtelling starter automatisk når du krysser av et sett

Gjennomfører du alle sett → øvelsen kollapser og neste blir aktiv.

Voice-coachen ser hvilken øvelse du er på og kan logge for deg ("tok 82,5 kilo, 6 reps").

**Treningshistorikk:**
- Liste over alle fullførte økter, nyeste øverst
- Trykk på økt → detaljer (øvelser, sett, vekt, varighet)
- Progresjonsgraf per øvelse (vekt over tid)

---

## Sosialt-skjermen

- Feed med venners siste fullførte økter
- Like og kommenter på økter
- Følg/følger-system
- Del egne økter manuelt eller automatisk etter fullført økt
- Søk etter brukere

---

## Profil-skjermen

- Total treningstid, antall økter, personlige rekorder
- Treningsstreak
- Valg av coach-personlighet: Friend (default) · Sergeant · Analyst
- Språkinnstilling: Norsk / Engelsk
- Kontoinnstillinger

---

## Voice Coach Overlay

Aktiveres fra alle skjermbilder. Vises som et overlay (ikke ny side).

**States:**
- **Idle:** Liten pulserende orb-knapp øverst til høyre
- **Lytter:** Orb vokser, animerer til brukerens stemmeamplitude
- **Tenker:** Orb spinner/pulserer
- **Snakker:** Orb animerer til coachens stemmeamplitude

Coachen ser hvilken skjerm brukeren er på og tilpasser svar deretter:
- På Logg-skjermen: kan logge sett, foreslå vekt, motivere
- På Program-skjermen: kan forklare øvelser, justere program
- På Hjem: kan planlegge dagen, oppsummere forrige økt

**Tre personligheter (velges i Profil):**
- **Friend:** Vennlig, forklarer hvorfor, feirer fremgang
- **Sergeant:** Kort, direkte, høy energi
- **Analyst:** Snakker i tall, volum, RPE, progresjonskurver

---

## Inspirasjon og referanser

| Feature | Hentet fra |
|---------|-----------|
| Rask logging, rast-timer | Hevy |
| Muskelheatmap | Hevy |
| Animert øvelsesvideo + PR-graf i detaljskjerm | Strong |
| Template/mal-modell for program | Strong |
| Monokromatisk, clean design | Dropset |
| Swipe-navigasjon, store touch-areas | Dropset |
| Sosialt feed, følg/del | Hevy |

---

## Freemium

Gratis med premium-tilgang. Hva som er premium defineres etter at appen er bygget.

---

## MVP-rekkefølge

Appen bygges trinn for trinn. Hvert trinn er deploybart alene.

1. App-skall + tekst-chat med AI
2. Postgres + treningslogg
3. Program-visning + øvelsesbibliotek med animasjoner
4. Voice input (Deepgram)
5. Voice output (TTS streaming)
6. VoiceOrb-visualisering
7. Auth + profil + sosialt

---

## Ikke i scope for MVP

- 3D-avatar eller pose estimation fra kamera
- Apple Health / Garmin / Strava integrasjon
- Kostholdsregistrering fra bilde
- Offline-modus
- Betalingsintegrasjon
