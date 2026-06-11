# Claude Code GitHub Action — engangsoppsett

Workflowen [`claude.yml`](claude.yml) lar deg nevne **`@claude`** i issues, PR-er
og PR-reviews for å be Claude om å reviewe, svare eller gjøre endringer direkte i
en PR. Den kjører kun når noen faktisk skriver `@claude`.

## Det jeg (Claude/agenten) ikke kan gjøre for deg

To steg krever auth/innlogging og må gjøres av deg som eier repoet:

1. **Installer Claude GitHub-appen**
   Gå til <https://github.com/apps/claude> og installer den på `trymvestengen/AI-coach`
   (eller hele org-en). Dette gir appen lov til å lese/skrive PR-er og kommentarer.

2. **Legg til API-nøkkelen som secret**
   GitHub → repo **Settings → Secrets and variables → Actions → New repository secret**:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** din Anthropic API-nøkkel (starter med `sk-ant-`)

   *Alternativ for Claude Pro/Max:* bruk `CLAUDE_CODE_OAUTH_TOKEN` (hentes med
   `claude setup-token` lokalt) i stedet, og bytt ut `anthropic_api_key`-linja i
   `claude.yml` med `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`.

## Slik bruker du den

- I en PR-kommentar: `@claude review denne PR-en for sikkerhetsproblemer`
- I en PR-kommentar: `@claude fiks lint-feilene og push`
- I en ny issue: `@claude foreslå en plan for X`

Claude kjører i Actions, jobber på branchen, og svarer/pusher i PR-en.

## Kostnad

Hver `@claude`-kjøring bruker API-kreditt på Anthropic-kontoen knyttet til nøkkelen.
`if:`-betingelsen sørger for at den bare kjører på eksplisitte `@claude`-mentions,
ikke på all aktivitet.
