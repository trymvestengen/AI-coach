# Coach-evals

Kvalitetstester for **coachen** — ikke unit-tester. De kjører realistiske scenarioer
mot den ekte coach-prompten og fanger regresjoner i *coaching-kvalitet* (tone,
sikkerhet, tool-valg, datadekning) når du endrer `prompts`/`api/app/services/coach.py`
eller tool-definisjonene.

## Hvorfor separat fra `api/tests/`
`api/tests/` er deterministiske unit-tester som mock'er bort Claude. Evals gjør det
motsatte: de kaller **ekte Claude** (koster API-kall, er ikke-deterministiske). Derfor
ligger de her og kjøres **manuelt/lokalt — ikke i CI**.

## Kjøre
```bash
make eval                 # fra repo-roten, alle scenarioer
# eller fra api/:
.venv/bin/python -m evals.run_evals
.venv/bin/python -m evals.run_evals weight-advice-grounded   # ett scenario
```
Krever `ANTHROPIC_API_KEY` i miljøet (samme nøkkel som coachen bruker). Hver kjøring er
~N × (1 coach-kall + 1 judge-kall), så noen få cents.

## Hvordan det virker
1. **`harness.py`** importerer de *ekte* `BASE_PROMPT`, `PERSONA_BLOCKS` og
   `TOOL_DEFINITIONS`, bygger samme system-prompt som coachen, og kjører tool-loopen —
   men med **deterministiske canned tool-svar** fra scenariet i stedet for DB-kall.
   Vi tester altså coachens resonnement/tool-valg, ikke databasen.
2. **`judge.py`** lar en egen Claude vurdere svaret mot scenariets rubrikk og gir
   `{pass, score, reasons}`.
3. **`run_evals.py`** kjører alt, gjør deterministiske hard-checks på tool-valg
   (`should_call_tools` / `should_call_any`), kombinerer med judge-dommen, og skriver
   en tabell. Exit-kode 0 = alt bestått, 1 = minst én feil.

## Legge til et scenario
Lag en ny `scenarios/<id>.yaml`:
```yaml
id: min-test
description: Kort beskrivelse
persona: friend            # friend | sergeant | analyst
base_context: |            # valgfri "brukerkontekst" coachen får
  Brukerprofil: ...
messages:
  - role: user
    text: "Brukerens melding"
tool_results:              # valgfritt: canned svar når coachen kaller en tool
  get_progression: { ... }
expect:
  should_call_any: [get_progression, get_workout_history]   # valgfri hard-check
  should_call_tools: [log_set_with_note]                    # valgfri hard-check (alle må kalles)
  rubric: |                # det judge'en vurderer mot
    - Krav 1
    - Krav 2
```

## Merk
Evals er ikke-deterministiske — én rød kjøring kan være støy. Se etter *mønstre* og
kjør et scenario på nytt før du konkluderer med en regresjon. Juster rubrikkene når
coachens ønskede oppførsel endrer seg.
