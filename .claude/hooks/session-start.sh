#!/usr/bin/env bash
#
# SessionStart-hook for Claude Code.
# Setter opp avhengigheter automatisk i remote/cloud-sesjoner (Claude Code web),
# slik at web/ og api/ er klare til bruk uten manuelle steg.
#
# Kjører KUN når CLAUDE_CODE_REMOTE=true. Lokalt er den en no-op, så den ikke
# tråkker på utviklerens eget oppsett.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "[session-start] Installerer web/-avhengigheter (npm install)..."
( cd "$REPO_ROOT/web" && npm install )

echo "[session-start] Setter opp api/.venv fra requirements.txt..."
cd "$REPO_ROOT/api"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/pip install -r requirements.txt

echo "[session-start] Ferdig."
