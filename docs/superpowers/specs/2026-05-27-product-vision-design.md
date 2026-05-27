# AI Coach — Produkt-visjon

**Status:** Draft for review
**Dato:** 2026-05-27
**Forfatter:** Trym (m/ Claude)

Dette er **visjon-spec-en** — den definerer hva vi bygger på et høyt nivå. Etterfølgende spec-er (onboarding-flyt, coach-arkitektur, program-design, visuelt design, etc.) refererer tilbake hit.

## Visjon

> **AI Coach er en treningscoach som lærer deg å kjenne over tid, og som blir smartere — ikke bare større — jo mer dere snakker sammen.**

Den er **ikke**:
- En treningsdagbok der man logger for å logge — man logger fordi coach trenger dataen for å justere
- En kalkulator (Strong/Hevy gjør det)
- En generisk AI-chatbot man må be om alt (Claude/ChatGPT gjør det)

Den **er**:
- En kompis med treningskompetanse, hukommelse, og evne til å handle på data
- Mest aktiv under selve økten (live coaching + strukturert logging)
- Tilgjengelig hele tiden ellers (planlegging, motivasjon, spørsmål)

## Hvem appen er for

**Primær: "Den smarte amatøren"**

En person som:
- Tar trening seriøst nok til å betale for hjelp
- Ikke har tid eller lyst til å bli treningsekspert selv
- Trener regelmessig men ikke daglig (2-5 ganger i uka)
- Bryr seg om fremgang, men ikke konkurransefokus
- Forveksler antagelig "volume" og "intensity"

Konkrete sub-grupper som passer:
- Nybegynner med ambisjon (har bestemt seg for å gjøre det skikkelig)
- 1-3 år erfaring med plateau eller motivasjonshull
- Returning user etter pause (baby, skade, jobb-intensiv periode)
- Hjemmegym-personen med begrenset utstyr

**Sekundær: entusiasten som logg-bruker.**

Logging fungerer alene — rene tall, kjapt å registrere, RPE-felt, history. Entusiaster kan bruke appen som "Hevy med valgfri AI på topp". De ignorerer coach hvis de vil.

**Eksplisitt IKKE for:**
- Erfarne entusiaster som leser Greg Nuckols og lager egne programmer
- Konkurranseatleter med ekte coach
- Hardcore programdesignere som krever mikro-detaljert kontroll over periodisering

## Kjerne-differensiering

Tre løfter som skiller AI Coach fra alle andre treningsapper:

**1. Hukommelse over tid.** Coach husker brukeren som person — ikke bare hva som ble gjort sist økt, men hvordan kroppen responderer over uker og måneder. "Du sliter alltid på knebøy etter en lang dag på jobb" er innsikt coach kan utvikle etter 6 uker.

**2. Sanntids-tilpasning.** Coach er ikke en statisk program-generator. "Litt tungt" på sett 3 → justering på sett 4. Sliten onsdag → restrukturert uke. Programmet er aldri en PDF — det er en levende avtale.

**3. Samtalebasert.** Hovedinteraksjonen med coach er chat (med valgfri voice). Coach kan svare på "burde jeg trene i dag selv om jeg er litt syk?" på samme måte som hen kan logge sett 4 av knebøy. Ingen separate features inni Coach-tab — én sammenhengende dialog.

**Konkurranseposisjonering:**

| Konkurrent | Hva de mangler |
|---|---|
| Fitbod, Future, Caliber, Trainerize | Programmer, men ikke ekte memory + sanntids-samtale |
| Strong, Hevy, Jefit | Bare logging, ingen coaching |
| ChatGPT custom GPT | Samtale + lett memory, men ingen treningskontekst, ingen struktur, ingen tool use mot DB |
| Menneskelig PT | Coaching og kontekst, men 800-2000 kr/mnd og kapasitetsbegrenset |

AI Coach lander midt i mellom: smartere enn programmet-apper, billigere og mer skalerbar enn menneskelig PT.

## Scope

**Inkludert:** Trening — øvelser, programmer, økter, logging, progresjon, motivasjon.

**Lett samtale-scope:** Coach kan svare på spørsmål om kosthold, søvn, recovery, stress når brukeren bringer det opp — men det er **ingen separate logge-flows** for de dimensjonene.

**Eksplisitt utenfor scope (deferred):**
- Kostholds-logging (kalorier, makros, måltidsplaner)
- Søvn-logging manuelt
- Stress-tracking
- Form-check via kamera
- Periodisering på meso/makro-cyklus-nivå
- Sosialt utover lett feed (ingen kommentarer-stream, ingen leaderboards som hovedfeature)

## Interaksjonsmodell

**App-struktur: 4 tabs.**

1. **Home** — dagens oversikt (streak, dagens økt, ukens plan) + lett sosial feed (venner trener) som bakgrunns-info, ikke egen destination.
2. **Program** — aktivt program, planlagte økter. **Logging skjer her** når bruker trykker "Start økt".
3. **Coach** — AI-chat (tekst, valgfri voice). Proaktive meldinger lander her.
4. **Profile** — innstillinger, mål, profil, utstyr, persona-tone.

**Coach er en feature, ikke en wrapper.** Bruker kan bruke appen 100% uten å snakke med coach. Coach legger AI-laget på toppen for de som vil ha det.

**Hva coach kan gjøre (handler direkte):**
- Logge sett/reps på vegne av bruker ("3x10x80 markløft i dag, RPE 7")
- Endre programmet ("flytt fredagens økt til lørdag", "bytt knebøy med beinpress denne uka")
- Justere vekter for kommende sett basert på prestasjon
- Svare på spørsmål med ekte data fra brukerens historikk
- Foreslå justeringer proaktivt basert på mønstre

**Voice** er kun aktiv i Coach-tab. Bruker velger preferanse i Profile.

**Proaktive check-ins** kommer som push-notifikasjoner som åpner Coach-tab. Bruker kan slå av per type (ukentlig planlegging, pre-økt, post-økt, motivasjon, inaktivitet).

## Personlighet

**Én sterk personlighet: "Friend".**

- Vennlig, kunnskapsrik, litt humoristisk
- Forklarer hvorfor, ikke bare hva
- Pusher når det trengs uten å være skremmende
- Direkte men ikke kald
- Tilpasser tone basert på kontekst (mer energisk pre-økt, mer roende etter dårlig dag)

Default-modus for alle brukere. Ingen valg mellom 3-4 personas — kun denne ene, men varianter i tone kan trigges via samtale ("vær mindre snill i dag").

Originalspec'ens "Sergeant" og "Analyst" droppes som modus-valg. Hvis en bruker vil ha "barskere" coaching, kan personality-prompten justeres via dialog, ikke via radio-knapper.

## Memory-arkitektur

AI bygger hukommelse ved å **skrive notater inn i selve dataen sin**, ikke via separat memory-system.

**Granulariteter:**
- **Per sett:** kort fritekst-notat fra coach som kontekstualiserer det strukturerte settet (RPE, kvalitet, korrigering, observasjon)
- **Per økt:** sammendragsnotat — totalvurdering, mønstre, hva som funket
- **Per samtale-sesjon:** sammendragsnotat — hva ble diskutert, hva ble bestemt, hva brukeren sa om sin tilstand

Eksempel per-sett-notat:
```
set: knebøy 80kg x 5
coach_note: "5/5 reps. Sa det var litt tungt på rep 4 — RPE 7. Form solid hele
            settet. Foreslår 82.5 neste sett. Ryggen ingen tegn til problem
            i dag."
```

Når coach senere skal svare på "hva er svakeste øvelsen min?" eller "hvordan har knebøy utviklet seg?", henter den både strukturerte tall OG disse notatene fra kontekstvinduet.

**Foreløpig arkitektur:** notater + LLM som henter hele relevant historikk inn i kontekst-vinduet. Hvis dette skalerer dårlig (mange tusen sett), legger vi på embeddings + semantic search. Ikke optimaliser før det trengs.

## Killer-opplevelse

Det demo-øyeblikket som selger appen i 30 sekunder:

> Bruker logger et tøft sett, sier "det var hardt". Coach svarer i sanntid: *"Jeg ser at de tre siste øktene har du gått ned i RPE på sett 4 av knebøy. Vi reduserer til 77.5 neste sett — ta det litt rolig i dag, vi spiser igjen i overgang neste uke."* Tre uker senere, når bruker undrer på hvorfor de stagnerer, kan coach trekke fram nøyaktig de øktene og forklare: *"Du hadde tøff jobb-uke 12.-19. mai. Søvnen var sannsynligvis lav. Da kuttet vi volume. Det funket — nå er vi tilbake. La oss prøve å pushe nå."*

Det er ikke "AI som genererer programmer". Det er **"AI som ser deg over tid og forklarer din egen kropp tilbake til deg"**.

## Hva dette betyr for implementering

Konsekvenser av visjonen for tekniske valg:

- **Memory architecture** er kritisk infrastruktur. Hvis vi ikke kan gjøre #1 godt, har vi intet produkt.
- **Tool use i LLM-en** (logge sett, hente historikk, endre program) er hvordan sanntids-tilpasning faktisk fungerer.
- **DB-skjema må støtte fritekst-notater på sett, økt, samtale.** Inkludert i kommende DB-cleanup-spec.
- **Coach-tab er den mest kompleks UI-en.** Resten av app-en er mer konvensjonell.
- **Voice er en sekundær prioritet.** Vi bygger tekst-chat først, voice kommer senere. Original PROJECT_PLAN's voice-first-rekkefølge revurderes — voice er ikke MVP-blokker.

## Åpne spørsmål (egne spec-er senere)

Disse er **utenfor visjon-spec** og skal håndteres i egne, dedikerte spec-er:

1. **Business model** — gratis, freemium, abonnement? Påvirker hvilke features bak betaling
2. **Onboarding-flow** — første-gangs-bruker-opplevelsen, hva coach spør om før første økt
3. **Visual design / "premium feel"** — fargepalett, typografi, animasjoner, tone-of-voice i kopi
4. **Coach-navn** — har coach et navn (f.eks. "Aiden", "Tor", "Trener Kim") eller bare "din coach"?
5. **Naming av appen** — "AI Coach" er arbeids-navn. Hva blir det egentlig?
6. **Voice-stemmer** — hvilken stemmevariant matcher Friend-personligheten?
7. **Premium features** — hva koster, hva er gratis (f.eks. ubegrenset AI-samtaler vs limit)?
8. **Wearable-integrasjon** — Apple Watch / Garmin / Whoop. Senere, ikke MVP.
9. **Form-check via kamera** — eksplisitt deferred.
10. **Periodisering / makro-program** — hvor avansert kan coach bli i lang-tids-planlegging?

## Suksesskriterier for visjonen

Når en bruker har brukt appen i 6 uker, skal følgende være sant:

- [ ] Bruker kan si "hva er svakeste øvelsen min?" og få et meningsfullt, datadrevet svar
- [ ] Bruker har logget minst én økt der coach justerte vekt på et sett basert på "litt tungt"-feedback
- [ ] Bruker har hatt minst én samtale med coach hvor referanse til tidligere samtale eller mønster føltes "wow"
- [ ] Bruker kan slå av coach helt og bruke appen som en standard logger
- [ ] Bruker har minst én proaktiv check-in fra coach som ikke føltes som spam

Disse er kvalitative — målbare via brukertesting, ikke via metrikker. Konkrete metrikker (retention, DAU/MAU, conversion) defineres når business model er på plass.

## Hva som blir neste spec

Etter at denne visjon-spec-en er godkjent, foreslås neste workstream å være **én av disse** (i prioritert rekkefølge for max impact):

1. **Memory/coach-arkitektur** — DB-skjema for notater, tool-use-design, hvordan LLM-en henter kontekst. Foundational for alt annet.
2. **Coach-tab UX** — chat-interaksjonen i detalj. Hvordan ser samtalen ut? Hvordan ser "coach handler" ut visuelt?
3. **Logging-flyt redesign** — siden Log slås sammen inn i Program, hvordan ser økt-modus ut?
4. **Onboarding** — første-gangs-flow. Hvordan møter brukeren coach første gang?
5. **Premium feel / visuell design** — design-system, farger, typografi, komponenter.

Min anbefaling: **#1 først** (memory-arkitektur), fordi det er kjerne-infrastruktur som alt annet bygger på. Hvis coach-en ikke kan huske eller handle, fungerer ingenting av det vi har lovet.
