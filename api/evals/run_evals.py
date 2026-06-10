"""Kjør coach-evals.

Bruk (fra api/):
    .venv/bin/python -m evals.run_evals            # alle scenarioer
    .venv/bin/python -m evals.run_evals <id>       # ett scenario

Eller fra repo-roten: `make eval`.

Krever ANTHROPIC_API_KEY i miljøet (evals kaller ekte Claude — koster API-kall og er
ikke-deterministisk; derfor lokalt/manuelt, ikke en CI-gate).
"""

import asyncio
import glob
import os
import sys

import yaml
from dotenv import load_dotenv

from evals.harness import run_scenario
from evals.judge import judge

# Last api/.env (samme som appen gjør) så ANTHROPIC_API_KEY plukkes opp av `make eval`.
load_dotenv()

SCENARIO_DIR = os.path.join(os.path.dirname(__file__), "scenarios")


def load_scenarios(filter_id: str | None = None) -> list[dict]:
    scenarios = []
    for path in sorted(glob.glob(os.path.join(SCENARIO_DIR, "*.yaml"))):
        with open(path, encoding="utf-8") as f:
            scenario = yaml.safe_load(f)
        scenario["_file"] = os.path.basename(path)
        if filter_id and scenario.get("id") != filter_id:
            continue
        scenarios.append(scenario)
    return scenarios


async def run_one(scenario: dict) -> dict:
    result = await run_scenario(scenario)
    expect = scenario.get("expect") or {}
    called = [c["name"] for c in result["tool_calls"]]

    # Deterministiske hard-checks på tool-valg (uavhengig av LLM-judge).
    must_all = expect.get("should_call_tools") or []
    must_any = expect.get("should_call_any") or []
    tool_ok = all(t in called for t in must_all) and (
        not must_any or any(t in called for t in must_any)
    )

    verdict = await judge(scenario, result)
    return {
        "id": scenario.get("id", scenario.get("_file")),
        "passed": bool(verdict["pass"]) and tool_ok,
        "tool_ok": tool_ok,
        "must_all": must_all,
        "must_any": must_any,
        "called": called,
        "verdict": verdict,
    }


async def main() -> int:
    filter_id = sys.argv[1] if len(sys.argv) > 1 else None

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("⚠️  ANTHROPIC_API_KEY er ikke satt — evals trenger ekte API-tilgang.")
        print("    Sett den i miljøet (samme nøkkel som coachen bruker) og prøv igjen.")
        return 2

    scenarios = load_scenarios(filter_id)
    if not scenarios:
        print(f"Ingen scenarioer funnet{f' med id={filter_id}' if filter_id else ''}.")
        return 1

    print(f"Kjører {len(scenarios)} scenario(er) mot coachen...\n")
    results = await asyncio.gather(*(run_one(s) for s in scenarios))

    n_pass = sum(r["passed"] for r in results)
    for r in sorted(results, key=lambda x: x["id"]):
        mark = "✅" if r["passed"] else "❌"
        called = ", ".join(r["called"]) or "—"
        print(f"{mark}  {r['id']:<26} score={r['verdict']['score']:.2f}  tools=[{called}]")
        if not r["passed"]:
            if not r["tool_ok"]:
                exp = r["must_all"] or r["must_any"]
                print(f"      ⮑ forventet tool-bruk {exp}, fikk {r['called'] or '—'}")
            if not r["verdict"]["pass"]:
                print(f"      ⮑ judge: {r['verdict']['reasons']}")

    print(f"\n{n_pass}/{len(results)} bestått")
    return 0 if n_pass == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
