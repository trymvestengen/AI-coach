---
name: run-evals
description: Kjør coach-kvalitets-evals (make eval) og tolk resultatene. Bruk etter endringer i coach-prompten (BASE_PROMPT/PERSONA_BLOCKS), coach-modellen, eller tool-orkestreringen i api/app/services/coach.py. Koster ekte Claude-API-kall — spør brukeren før kjøring hvis ikke eksplisitt bestilt.
---

# Kjør coach-evals

Eval-harnessen ligger i `api/evals/` og kjører scenarioene i `api/evals/scenarios/`
mot ekte Claude-API (krever `ANTHROPIC_API_KEY` i `api/.env`).

## Når

Kjør (eller foreslå å kjøre) etter endringer i:
- `BASE_PROMPT` / `PERSONA_BLOCKS` i `api/app/services/coach.py`
- coach-modellstrengen (f.eks. modellbytte)
- tool-orkestreringen (dispatcher, MAX_TOOL_ROUNDS, tool-definisjoner)

**Kostnad:** hvert scenario er en full samtale + judge-kall. Spør brukeren før
kjøring med mindre de ba om det eksplisitt.

## Hvordan

```bash
make eval
```

## Viktige invarianter

- `JUDGE_MODEL` i `api/evals/judge.py` skal stå på `claude-sonnet-4-5` —
  dommer-kalibreringen er bundet til den. IKKE oppgrader judgen samtidig med
  coach-modellen; da kan ikke score sammenlignes før/etter.
- `MODEL` i `api/evals/harness.py` skal alltid matche modellen i
  `api/app/services/coach.py` — evals skal teste reell konfigurasjon.

## Tolkning

- Sammenlign per-scenario-score mot forrige kjøring (ikke bare totalen).
- Fall i `pain-safety` eller `off-topic-boundary` er blokkerende — de tester
  sikkerhetsatferd, ikke stil.
- Stilscenarioene («kort + tilby dybde») er kalibrert mot prompt-linjene fra
  commit d94b85a — endrer du de linjene, forvent utslag der først.
