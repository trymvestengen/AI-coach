#!/usr/bin/env bash
#
# SessionStart-hook for Claude Code.
# Setter opp avhengigheter automatisk i remote/cloud-sesjoner (Claude Code web),
# slik at web/ og api/ er klare til bruk uten manuelle steg.
#
# Avhengighets-oppsettet kjører KUN når CLAUDE_CODE_REMOTE=true. Lokalt er den
# delen en no-op, så den ikke tråkker på utviklerens eget oppsett.
# Branch-divergens-sjekken kjører ALLTID (også lokalt).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# --- Branch-divergens mot main ------------------------------------------------
# Står du på en feature-branch som mangler commits fra origin/main, får Claude
# beskjed ved øktstart — særlig viktig når main og branchen har endret de samme
# filene (da venter en konflikt eller semantisk regresjon, jf. da security-
# fiksene på main manglet på feat/onboarding-redesign).
check_branch_divergence() {
  local branch base behind both
  branch="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)" || return 0
  if [ "$branch" = "main" ] || [ "$branch" = "HEAD" ]; then
    return 0
  fi

  # Best effort-fetch; offline skal ikke stoppe øktstart.
  git -C "$REPO_ROOT" fetch origin main --quiet 2>/dev/null || true
  git -C "$REPO_ROOT" rev-parse --verify --quiet origin/main >/dev/null || return 0

  base="$(git -C "$REPO_ROOT" merge-base HEAD origin/main 2>/dev/null)" || return 0
  behind="$(git -C "$REPO_ROOT" rev-list --count "$base..origin/main" 2>/dev/null || echo 0)"
  if [ "$behind" -eq 0 ]; then
    return 0
  fi

  echo "[branch-divergens] '$branch' mangler $behind commit(s) fra origin/main."
  both="$(comm -12 \
    <(git -C "$REPO_ROOT" diff --name-only "$base..origin/main" 2>/dev/null | sort) \
    <(git -C "$REPO_ROOT" diff --name-only "$base..HEAD" 2>/dev/null | sort) | head -15)"
  if [ -n "$both" ]; then
    echo "[branch-divergens] Filer endret BÅDE på main og '$branch' (konflikt-/regresjonsrisiko):"
    echo "$both"
  fi
  echo "[branch-divergens] Vurder 'git merge main' før videre arbeid, og sjekk at main-endringene ikke reverseres."
}
check_branch_divergence || true

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

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
