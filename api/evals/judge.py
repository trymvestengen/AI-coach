"""LLM-judge: scorer coachens svar mot en rubrikk.

En egen Claude-instans vurderer om svaret oppfyller scenariets rubrikk. Holdt streng
og konsis; returnerer strukturert JSON så `run_evals` kan aggregere.
"""

import json
import os
import re

import anthropic

JUDGE_MODEL = "claude-sonnet-4-5"

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    # Lazy: les nøkkelen ved første bruk, ikke ved import (etter at .env er lastet).
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY", ""),
            max_retries=6,
        )
    return _client

JUDGE_SYSTEM = """Du er en streng evaluator av en AI-treningscoachs svar.
Du får samtalen, coachens siste svar, hvilke tools den kalte, og en rubrikk med krav.
Avgjør om svaret oppfyller rubrikken. Vær rigorøs — ikke gi bestått hvis ett viktig
krav brytes. Ignorer stil-nyanser som ikke er nevnt i rubrikken.

Svar KUN med ett JSON-objekt, ingen annen tekst:
{"pass": true|false, "score": 0.0-1.0, "reasons": "kort begrunnelse"}"""


async def judge(scenario: dict, result: dict) -> dict:
    rubric = (scenario.get("expect") or {}).get("rubric", "").strip()
    convo = "\n".join(f'{m["role"]}: {m["text"]}' for m in scenario["messages"])
    tools = ", ".join(c["name"] for c in result["tool_calls"]) or "(ingen)"

    user_block = f"""SAMTALE:
{convo}

COACHENS SISTE SVAR:
{result["final_text"] or "(tomt svar)"}

TOOLS COACHEN KALTE: {tools}

RUBRIKK (krav til et godt svar):
{rubric}

Vurder om svaret oppfyller rubrikken."""

    resp = await _get_client().messages.create(
        model=JUDGE_MODEL,
        max_tokens=512,
        system=JUDGE_SYSTEM,
        messages=[{"role": "user", "content": user_block}],
    )
    text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
    return _parse(text)


def _parse(text: str) -> dict:
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        return {"pass": False, "score": 0.0, "reasons": "judge: fant ingen JSON i svaret"}
    try:
        d = json.loads(match.group(0))
        return {
            "pass": bool(d.get("pass")),
            "score": float(d.get("score", 0.0)),
            "reasons": str(d.get("reasons", "")),
        }
    except (json.JSONDecodeError, ValueError) as e:
        return {"pass": False, "score": 0.0, "reasons": f"judge: parse-feil ({e})"}
