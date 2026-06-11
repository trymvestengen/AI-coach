---
name: new-migration
description: Scaffold a new Postgres-migrasjon i api/db/migrations/ sammen med matchende oppdatering av docs/ARCHITECTURE.md og en RLS-påminnelse. Bruk når du legger til eller endrer DB-skjema (ny tabell, ny kolonne, indeks, policy).
---

# Ny migrasjon

Mål: lage en migrasjon **og** holde `docs/ARCHITECTURE.md` i sync i samme endring.
Både CI-jobben `schema-docs` og den lokale Stop-hooken blokkerer hvis migrasjoner
endres uten at ARCHITECTURE.md også endres — denne skillen gjør begge delene riktig.

## Steg

### 1. Finn neste nummer
```bash
ls api/db/migrations/ | grep -E '^[0-9]{3}_' | sort | tail -1
```
Neste fil er forrige nummer + 1, nullpolstret til tre siffer:
`009_<kort_beskrivende_navn>.sql` (snake_case, engelsk filnavn).

### 2. Lag migrasjonsfila
Følg stilen i eksisterende migrasjoner: kommentar med filsti + én linje som
forklarer *hvorfor*, deretter ren SQL. Eksempel (`008_profile_fields.sql`):

```sql
-- api/db/migrations/009_<navn>.sql
-- <Én setning: hva og hvorfor.>

ALTER TABLE users
  ADD COLUMN <kolonne> <type>;
```

- Idempotens er en bonus (`ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`) men ikke påkrevd — følg nabofilene.
- Hold én migrasjon = én logisk endring.

### 3. RLS — IKKE glem
Hvis du lager en **ny tabell**, må den ha RLS-policies. Se mønsteret i
`api/db/migrations/005_rls.sql` (enable RLS + policy per rolle). En ny tabell uten
RLS er et sikkerhetshull — legg policies i samme migrasjon eller en `_rls`-oppfølger.

### 4. Oppdater docs/ARCHITECTURE.md (PÅKREVD)
Oppdater seksjonen **«Database-skjema»** så den reflekterer endringen:
- Ny tabell → legg til tabellblokken i `sql`-eksempelet.
- Ny/endret kolonne → oppdater den aktuelle tabellblokken.
- Behold den eksisterende kommentar-stilen (`-- 'no' | 'en'`).

Dette steget er det CI-gaten håndhever. Hopp ikke over det.

### 5. Verifiser
```bash
git diff --name-only            # skal vise BÅDE migrasjonsfila OG docs/ARCHITECTURE.md
```
Hvis bare migrasjonsfila vises, mangler du steg 4.

## Når du IKKE skal bruke denne
Rene seed-/data-endringer (`api/db/seed*.py`, `seed_*.sql`) er ikke skjema og
trenger ikke ARCHITECTURE.md-oppdatering.
