"""Eval-harness for coachen.

Kjører et scenario mot den EKTE coach-prompten og de EKTE tool-definisjonene
(`BASE_PROMPT`, `PERSONA_BLOCKS`, `TOOL_DEFINITIONS` importeres fra appen), men med
DETERMINISTISKE canned tool-svar i stedet for ekte DB-kall. Slik tester vi coachens
resonnement og tool-valg — og fanger prompt-/tool-regresjoner — uten å avhenge av
databasen. Det eneste ikke-deterministiske er selve LLM-kallet, som er poenget.
"""

import json
import os

import anthropic

from app.services.coach import BASE_PROMPT, PERSONA_BLOCKS
from app.tools.definitions import TOOL_DEFINITIONS

MODEL = "claude-sonnet-4-5"
MAX_TOOL_ITERATIONS = 8

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    # Lazy: les nøkkelen ved første bruk, ikke ved import (etter at .env er lastet).
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))
    return _client


async def run_scenario(scenario: dict) -> dict:
    """Kjør ett scenario. Returnerer {'final_text': str, 'tool_calls': [{name, input}]}."""
    persona = scenario.get("persona", "friend")
    if persona not in PERSONA_BLOCKS:
        raise ValueError(f"Ukjent persona '{persona}' i scenario {scenario.get('id')}")

    system = [{"type": "text", "text": f"{BASE_PROMPT}\n\n{PERSONA_BLOCKS[persona]}"}]
    base_context = scenario.get("base_context")
    if base_context:
        system.append({"type": "text", "text": base_context})

    messages = [{"role": m["role"], "content": m["text"]} for m in scenario["messages"]]
    canned = scenario.get("tool_results") or {}

    tool_calls: list[dict] = []
    final_text = ""

    for _ in range(MAX_TOOL_ITERATIONS):
        resp = await _get_client().messages.create(
            model=MODEL,
            max_tokens=1024,
            system=system,
            messages=messages,
            tools=TOOL_DEFINITIONS,
        )

        if resp.stop_reason == "tool_use":
            tool_result_blocks = []
            for block in resp.content:
                if getattr(block, "type", None) == "tool_use":
                    tool_calls.append({"name": block.name, "input": block.input})
                    # Deterministisk svar: bruk canned per tool-navn, ellers en nøytral ok.
                    result = canned.get(block.name, {"ok": True})
                    tool_result_blocks.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    })
            messages.append({"role": "assistant", "content": resp.content})
            messages.append({"role": "user", "content": tool_result_blocks})
            continue

        # end_turn / annet: samle tekst og avslutt.
        for block in resp.content:
            if getattr(block, "type", None) == "text":
                final_text += block.text
        break

    return {"final_text": final_text, "tool_calls": tool_calls}
