---
name: new-tool
description: Scaffold en ny coach-tool (Claude tool use) med alle fire obligatoriske stedene i sync — definitions, handler, dispatcher og tester, pluss norsk label i frontend. Bruk når en ny tool skal legges til eller en eksisterende får endret signatur.
---

# Ny coach-tool

En tool berører ALLTID disse stedene. Glemmer du ett, feiler det stille
(ukjent tool → generisk feil mot modellen).

## Steg

### 1. Definisjon — `api/app/tools/definitions.py`
Legg til tool-schema i `TOOL_DEFINITIONS`. Følg nabodefinisjonene: `name`,
`description` (engelsk, én setning, si NÅR den skal brukes), `input_schema`
med `required`-liste. Ikke ta med `user_id` i schemaet — den injiseres av
dispatcheren.

### 2. Handler — `api/app/tools/handlers/<domene>_handlers.py`
Velg riktig domenefil (program/workout/memory/profile/injury/equipment/
preference/constraint/folder/social/body_metric/read). Signatur:

```python
async def my_tool(user_id: str, <params>) -> dict:
```

- ALLE queries scopet med `WHERE user_id = %s` (eller eier-join).
- LLM-leverte ID-er: verifiser eierskap før skriving.
- Returner `{"ok": True, ...}` eller `{"ok": False, "error": "<trygg melding>"}`.
  Aldri `str(e)` i error-feltet — logg internt.

### 3. Dispatcher — `api/app/tools/dispatcher.py`
Legg til i `HANDLERS`-dicten under riktig kommentar-seksjon.

### 4. Tester — `api/tests/test_tools_<domene>.py`
Minst: happy path, eierskap-avvisning (LLM-levert ID som ikke tilhører bruker),
og ugyldig input. Bruk `mock_conn`/`make_mock_get_conn` fra conftest.

### 5. System-prompt — `api/app/services/coach.py`
Legg toolen inn i `TOOLS YOU CAN CALL`-blokka i `BASE_PROMPT` under riktig
kategori. Er den destruktiv (delete/remove/discard): legg den OGSÅ i
`CONFIRM-REGEL FOR DESTRUKTIVE HANDLINGER`-lista.

### 6. Frontend-label — `web/src/lib/tool-labels.ts`
Norsk label for ToolUsePill (+ test i `tool-labels.test.ts`). Uten denne vises
rå tool-navnet i chat-UI-et.

### 7. Verifiser
```bash
make check
```
Vurder også `security-reviewer`-agenten på handleren, og `/run-evals` hvis
toolen endrer coach-atferd vesentlig.
