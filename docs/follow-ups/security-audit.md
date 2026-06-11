# Security audit — ai-coach (2026-06-10)

Read-only audit av fem flater (auth/authz, RLS, SQL/data-access, secrets/config,
input-validering/API). Ingen kode ble endret — dette er funn-rapporten for
out-of-scope-workstream #6. Funn er rangert etter alvorlighet med fil:linje og
anbefalt fiks.

> **Arkitektonisk nøkkelfakta som avgjør alvorlighet:** Backend kobler til Postgres
> med én delt `DATABASE_URL`-pool (`api/app/db.py:16`) uten per-request rolle, så
> **Supabase RLS er ikke aktiv på backend-stien** — `WHERE ... user_id = %s` i Python
> er eneste autorisasjonsgrense der. Frontend derimot spør Supabase direkte med
> brukerens JWT (`web/src/lib/supabase-server.ts`), så for de spørringene er **RLS
> eneste vern**. Begge stiene har hver sin kritiske svakhet under.

## Sammendrag

| Alvorlighet | Antall | Headline |
|---|---|---|
| 🔴 Kritisk | 4 | TEST_USER_ID i tool-handlers · uautentisert `/chat` · 7 tabeller uten RLS · IDOR i logge-tools |
| 🟠 Høy | 3 | Ingen rate-limit på LLM-endepunkt · JWT issuer ikke pinnet · JWKS-feilhåndtering |
| 🟡 Medium | 4 | Feilmelding-lekkasje · ubegrenset meldingsstørrelse · ikke-atomisk delete · leaderboard-PII |
| ⚪ Lav | 4 | Utypet `/chat/stream`-body · middleware prefix-match · e-post-validering · manglende UPDATE-policy |

**Fiks i denne rekkefølgen:** K1 → K2 → K3 → K4 → H1 (rate-limit) → resten.

## Remediasjonsstatus (oppdatert 2026-06-11)

Alle kritiske, høye og medium funn er adressert. Detaljene under er den opprinnelige
rapporten; statusen her er fasit.

| Funn | Status | PR |
|---|---|---|
| K1 user_id i tool-handlers | ✅ Fikset | #14 |
| K2 uautentisert `/chat` | ✅ Fikset | #14 |
| K3 RLS på 007-tabeller | ✅ Fikset + **applisert mot Supabase** | #15 |
| K4 IDOR i logge-tools | ✅ Fikset | #14 |
| H1 rate-limit + tool-loop-tak | ✅ Fikset | #16 |
| H2 JWT issuer-pinning + require_exp | ✅ Fikset — **opt-in via `SUPABASE_ISSUER`** | #18 |
| H3 JWKS-cache-poisoning-vern | ✅ Fikset | #18 |
| M1 feilmelding-lekkasje | ✅ Fikset | #17 |
| M2 ubegrenset meldingsstørrelse | ✅ Fikset | #17 |
| M3 ikke-atomisk `delete_exercise` | ✅ Fikset | #18 |
| M4 leaderboard-PII | ✅ **Akseptert — global leaderboard er bevisst design** (Trym, 2026-06-11) | — |
| L1 utypet `/chat/stream`-body | ✅ Fikset | #17 |
| L2 middleware prefix-match | ⏳ Åpen (frontend, lav-prio) | — |
| L3 e-post/min_length-validering | ⏳ Åpen (krever `email-validator`-dep) | — |
| L4 `post_comments` UPDATE-policy | ⏳ Åpen (allerede fail-safe) | — |

**Operasjonelt utestående (ikke kode):** sett `SUPABASE_ISSUER` for å aktivere H2 ·
rotér Supabase DB-passord · slett stray `api/.en` · (valgfritt) rydd 7 redundante
dvale-RLS-policies som fantes før `009`.

---

## 🔴 Kritisk

### K1 — Tool-handlers ignorerer autentisert bruker, opererer på hardkodet TEST_USER_ID
**Fil:** `api/app/tools/handlers.py:211-269` · `api/app/constants.py:2` · droppet i `api/app/services/coach.py:236`

`chat_stream` autentiserer korrekt og henter `user_id` fra token, men i det modellen
kaller en tool, kaller `handle_tool(navn, input)` — **uten `user_id`** — og hver
DB-tool bruker `TEST_USER_ID = "0000…0001"`. En `# TODO: remove after tools/handlers.py
is auth-aware`-kommentar (`constants.py:1`) bekrefter at dette er kjent-uferdig, men
det er live i hoved-chat-flyten.

**Konsekvens:** Enhver autentisert bruker som chatter med coachen leser og skriver mot
TEST_USER_ID sine data — ikke sine egne. "Hva sier profilen min?" → `get_user_profile(TEST_USER_ID)`
→ returnerer en annen brukers e-post/skader. "Logg denne økten" / "lag dette programmet"
→ skriver inn i TEST_USER_ID. Cross-tenant lese+skrive på primærflyten.

**Fiks:** La `handle_tool` ta `user_id` og tre det gjennom fra `chat_stream`/`chat`.
Erstatt alle `TEST_USER_ID`-referanser i `handlers.py` med argumentet. Slett konstanten
når den er ubrukt. Legg til en regresjonstest: en tool-call for bruker A skal aldri
spørre bruker B sin id.

### K2 — `POST /api/chat` er fullstendig uautentisert (og bundet til TEST_USER_ID)
**Fil:** `api/app/routers/chat.py:34-38` → `api/app/services/coach.py:51-52`

Det ikke-strømmende `/api/chat`-endepunktet kaller aldri `get_current_user_id` og
bygger kontekst for `TEST_USER_ID`. Ingen token kreves.

**Konsekvens:** En anonym angriper kan POSTe og (a) eksfiltrere TEST_USER_ID sin
profil/historikk via read-tools, (b) **skrive** destruktivt (`create_program`
deaktiverer eksisterende programmer, `log_workout`, `write_observation`), og (c) brenne
Anthropic-kreditt på din nøkkel uten grense. CORS beskytter ikke server-til-server-kallere
(curl). Frontend sender fortsatt dette via `web/src/lib/api.ts` (`sendMessage()`).

**Fiks:** Krev `get_current_user_id(request)` og tre ekte `user_id` inn i `coach_chat`,
ELLER slett endepunktet hvis `/chat/stream` er det eneste frontend bruker (verifiser først).

### K3 — Migrasjon 007: 7 tabeller uten RLS (helse-data + private coach-samtaler)
**Fil:** `api/db/migrations/007_memory_architecture.sql` (hele fila — null `ENABLE ROW LEVEL SECURITY`, null `CREATE POLICY`)
**Tabeller:** `user_injuries`, `user_preferences`, `user_equipment`, `user_constraints`, `coach_sessions`, `coach_messages`, `coach_observations`

Migrasjon 005 og 006 er forbilledlige (RLS + eierskap-policies på alt). Men 007 — som
introduserer hele minne-/coach-arkitekturen — sendte uten RLS i det hele tatt. I Supabase
er en tabell med RLS *av* lese-/skrivbar for **hvem som helst med en gyldig `authenticated`
JWT** via det auto-genererte PostgREST-API-et.

**Konsekvens:** Enhver innlogget bruker kan kjøre `supabase.from('coach_messages').select('*')`
(eller de seks andre) og få **alle andre brukeres** data: fulle coach-samtaler
(`coach_messages.content`), AI-profilering (`coach_observations`), og sensitive helsedata
(`user_injuries` med kroppsdel/beskrivelse/alvorlighet). De kan også INSERT/UPDATE/DELETE i
hvilken som helst brukers rader. `coach_messages` er en barne-tabell (ingen `user_id`) — må
scopes via forelder `coach_sessions`.

**Fiks:** Ny migrasjon `009_rls_memory.sql` som enabler RLS + legger eierskap-policies på
alle 7 (følg mønsteret i 005). For `coach_messages`, scope via parent:
```sql
ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY coach_messages_own ON coach_messages FOR ALL
  USING (session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid()));
```
Husk `WITH CHECK` på alle INSERT/UPDATE. (Akkurat denne fila er grunnen til at
`schema-docs`-gaten + `/new-migration`-skillens RLS-påminnelse ble laget — de kom etter 007.)

### K4 — `log_set_with_note` / `write_observation` skriver mot LLM-leverte IDer uten eierskapssjekk
**Fil:** `api/app/tools/memory_handlers.py:198-204, 235-254` (via `handlers.py:259-268`)

`workout_id` (og `related_workout_id`/`related_session_id`) kommer rett fra tool-input
(LLM-kontrollert, ikke til å stole på) og settes inn som fremmednøkkel **uten** å verifisere
at raden tilhører kalleren. REST-stien gjør det riktig (`workouts.py:91-95`: `WHERE id = %s
AND user_id = %s`); tool-stien mangler det.

**Konsekvens:** En prompt-injisert/manipulert LLM (eller en bruker som gjetter en annen
brukers `workout_id` og ber coachen "logg et sett for workout <uuid>") skriver inn i en
annen brukers økt.

**Fiks:** Verifiser eierskap før insert (`SELECT 1 FROM workouts WHERE id = %s AND user_id = %s`).
Avhenger av K1 (at en betrodd `user_id` faktisk er i scope).

---

## 🟠 Høy

### H1 — Ingen rate-limiting på LLM-endepunktene → finansiell DoS
**Fil:** `api/app/routers/chat.py:34, 41` (ingen limiter i repoet — ingen `slowapi`/`ratelimit`)

Begge chat-endepunktene kaller Anthropic uten per-bruker/IP-grense, samtidighetstak eller
dagsbudsjett. Hver forespørsel kan utløse en fler-turs tool-use-loop (`coach.py:189` `while True`).
Kombinert med K2 (uautentisert `/chat`) er dette en åpen, umålt vei til din betalte LLM-nøkkel.

**Fiks:** Per-bruker rate-limit (f.eks. `slowapi` nøklet på JWT `sub`), samtidighetstak per
bruker, og et hardt tak på tool-loop-iterasjoner (`coach.py:189`).

### H2 — JWT-issuer ikke pinnet; `python-jose` algoritme-eksponering
**Fil:** `api/app/auth.py:27`

Verifiseringen er ellers solid (alg=none blokkert ✓, signatur ✓, audience ✓, exp ✓), men
`issuer` valideres ikke. Pinning av issuer til Supabase-prosjektets URL er billig
forsvar-i-dybden. Vurder `PyJWT` + `PyJWKClient` for klarere algoritme-pinning, og pin/patch
`jose`-versjonen.

**Fiks:** Legg til `issuer=<supabase-issuer>` og `options={"require": ["exp", "sub"]}` i `jwt.decode`.

### H3 — JWKS-henting svelger feil til generisk 401 + kan cache-poisones
**Fil:** `api/app/auth.py:14-17, 31-34`

`_get_jwks()` har ingen feilhåndtering; en transient JWKS-utilgjengelighet → alle 401, og
TTL-cachen (3600s) kan cache et tomt/feilaktig svar i en time → total auth-nedetid.

**Fiks:** Valider responsformen (`assert "keys" in body`) før caching; ikke cache feil;
vurder stale-while-revalidate.

---

## 🟡 Medium

### M1 — Interne feildetaljer lekkes til klient via `str(e)`
**Fil:** `api/app/services/coach.py:276, 239` · `api/app/routers/chat.py:54-55`

Rå unntaksmeldinger strømmes til klienten. psycopg/SQL-/Anthropic-feil inneholder ofte
tabell-/kolonnenavn, stier eller DSN-fragmenter. `auth.py:33` gjør det riktig (logg internt,
returner generisk) — speil det mønsteret her.

### M2 — Ubegrenset meldingsstørrelse → kost-amplifikasjon
**Fil:** `api/app/routers/chat.py:13-15, 18-19, 42`

Ingen øvre grense på meldingslengde, antall meldinger, eller body-størrelse. En klient kan
sende megabytes → blåser opp input-tokens (kost) per request. Forsterker H1.

**Fiks:** `max_length` på `Message.content` og på `messages`-lista; global body-size-grense.

### M3 — `delete_exercise` har ikke-atomisk eierskapssjekk (TOCTOU)
**Fil:** `api/app/routers/programs.py:475-499`

SELECT-sjekk og DELETE er to separate statements; DELETE-en gjentar ikke `user_id`-joinen.
Lav utnyttbarhet, men inkonsistent med de andre handlerne (`delete_program` gjør det riktig).

**Fiks:** Gjør DELETE-en eierskap-scopet i selve spørringen.

### M4 — `/api/social/leaderboard` + `/suggestions` eksponerer alle brukeres PII
**Fil:** `api/app/routers/social.py:259-295, 212-256`

Krever auth (✓) men returnerer fullt navn + avatar + ukentlig treningsvolum for **alle**
brukere, ikke bare kallerens sosiale graf. Personvern-design-avgjørelse — bekreft at det er
ønsket; ellers legg til `leaderboard_opt_in`-flagg og dropp `last_name` for ikke-fulgte.

---

## ⚪ Lav

- **L1** `/chat/stream` tar utypet `dict` (`chat.py:42-48`) — `persona` valideres ikke → `KeyError`
  som lekkes via M1. Bruk en typet `ChatStreamRequest(BaseModel)` med `persona: Literal[...]`.
- **L2** Frontend-middleware bruker `startsWith` prefix-match for public paths (`web/src/middleware.ts:9, 37`)
  → `/loginX` ville bypasse. Lav (backend er den ekte grensa). Bruk eksakt segment-match.
- **L3** `email`/påkrevde strenger mangler `min_length`/format-validering i `upsert_user_profile`
  (`users.py:142-185`) — tomme strenger/ugyldig e-post godtas. Bruk `EmailStr`/`min_length`.
- **L4** `post_comments`/`post_likes` mangler UPDATE-policy (`006_social.sql:42-48`) — fail-safe
  (UPDATE nektes for alle), men legg til policy hvis kommentar-redigering noen gang skal funke.

---

## Secrets / config

**God hygiene bekreftet:** ingen secret-fil er noensinne committet (`settings.local.json`:
0 commits; `.env`/`.en` gitignored). `.env.example` har kun placeholders. Frontend bruker
kun `NEXT_PUBLIC_SUPABASE_ANON_KEY` (aldri service-role). Nøkler leses fra env ved runtime,
logges aldri.

**Likevel å handle på:**
- 🟠 **Rotér Supabase DB-passordet.** En ekte DB-connection-string med passord ligger i
  `.claude/settings.local.json` (lokalt, gitignored — *ikke* i git) og dukket opp i auditen.
  Siden det også var synlig i et delt skjermbilde, rotér det for sikkerhets skyld.
- ⚪ **Slett `api/.en`** — en 337-byte feilstavet env-fil (gitignored) som trolig inneholder en
  stray nøkkel. Rydd den vekk.
- ⚪ **Vurder `detect-secrets` pre-commit-hook** + dokumentér sikkert lokalt oppsett i CONTRIBUTING.md.

---

## ✅ Hva som er gjort bra (balanse)

- **JWT-verifisering er solid:** alg=none blokkert, signatur + audience + expiry sjekket, feil
  logges internt og returnerer generisk 401 (`auth.py:20-34`).
- **Routere henter `user_id` fra verifisert token, aldri fra klient-input** — ingen `user_id`
  godtas fra request-body noe sted i routerne.
- **Parametriserte queries overalt — ingen SQL-injection funnet.** Den ene dynamiske SQL-en
  (`users.py:125`) bygger kun kolonnenavn fra en hardkodet allow-list; verdier er parametriserte.
- **Migrasjon 005/006 RLS er forbilledlig** — barne-tabeller korrekt scopet via foreldre, `WITH CHECK`
  på alle skriv.
- **CORS riktig begrenset** (`main.py:18-41`, ingen `*`-med-credentials). Mass-assignment guardet
  via allow-lists (`users.py:9-14`, `profile.py`).

---

## Anbefalt remediering (rekkefølge)

1. **K1 + K2 + K4** (samme rot: tre `user_id` gjennom tool-laget, fjern TEST_USER_ID, auth-gate `/chat`) — én PR.
2. **K3** — `009_rls_memory.sql` (bruk `/new-migration`; den oppdaterer ARCHITECTURE.md + RLS automatisk).
3. **H1** — rate-limiting på chat-endepunktene.
4. **H2/H3** — auth-herding.
5. **M1–M4, L1–L4** — opprydding, hver liten.
6. **Secrets:** rotér Supabase-passord, slett `api/.en`.
