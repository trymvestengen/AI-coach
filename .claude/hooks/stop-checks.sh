#!/usr/bin/env bash
#
# Stop-hook: kjører når Claude er ferdig med en tur.
# To raske, git-baserte sjekker (ingen testkjøring — skal være umerkelig rask):
#
#   1) Lokal speiling av schema-docs CI-gaten: blokkerer hvis api/db/migrations/
#      er endret uten at docs/ARCHITECTURE.md også er det. Feiler lokalt før CI.
#   2) Push-påminnelse: minner om push-tidlig-regelen hvis branchen har
#      commits som ikke er pushet.
#
set -uo pipefail

INPUT="$(cat 2>/dev/null || true)"

# Unngå loop: ikke blokkér på nytt hvis vi allerede er i en stop-hook-fortsettelse.
case "$INPUT" in
  *'"stop_hook_active": true'* | *'"stop_hook_active":true'*) exit 0 ;;
esac

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." 2>/dev/null && pwd)" || exit 0
cd "$REPO_ROOT" || exit 0

command -v git >/dev/null 2>&1 || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

BASE="origin/main"
git rev-parse --verify --quiet "$BASE" >/dev/null 2>&1 || BASE=""

# Endrede filer: committet (mot base) + staged + unstaged, deduplisert.
CHANGED="$(
  { [ -n "$BASE" ] && git diff --name-only "$BASE...HEAD" 2>/dev/null
    git diff --name-only 2>/dev/null
    git diff --name-only --cached 2>/dev/null
  } | sort -u
)"

BLOCK_REASON=""
NOTE=""

# --- Gate 1: migrasjon endret uten ARCHITECTURE.md ---
if printf '%s\n' "$CHANGED" | grep -q '^api/db/migrations/'; then
  if ! printf '%s\n' "$CHANGED" | grep -qx 'docs/ARCHITECTURE.md'; then
    BLOCK_REASON="Lokal schema-gate: api/db/migrations/ er endret uten at docs/ARCHITECTURE.md er oppdatert. Oppdater skjemadokumentasjonen i samme endring — ellers feiler schema-docs-jobben i CI. Tips: /new-migration lager begge deler samtidig."
  fi
fi

# --- Påminnelse: upushede commits (ikke relevant på main) ---
if [ -z "$BLOCK_REASON" ]; then
  BRANCH="$(git branch --show-current 2>/dev/null || true)"
  if [ -n "$BRANCH" ] && [ "$BRANCH" != "main" ]; then
    UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"
    if [ -z "$UPSTREAM" ]; then
      if [ -n "$(git log --oneline -1 2>/dev/null)" ]; then
        NOTE="Branchen '$BRANCH' er ikke pushet enda. Push tidlig (branch + draft-PR ved oppstart) jf. push-regelen i CLAUDE.md."
      fi
    else
      AHEAD="$(git rev-list --count "${UPSTREAM}..HEAD" 2>/dev/null || echo 0)"
      if [ "${AHEAD:-0}" -gt 0 ] 2>/dev/null; then
        NOTE="$AHEAD commit(s) på '$BRANCH' er ikke pushet. Push etter hver fullførte task jf. CLAUDE.md."
      fi
    fi
  fi
fi

if [ -n "$BLOCK_REASON" ]; then
  BLOCK_REASON="$BLOCK_REASON" python3 -c 'import json,os; print(json.dumps({"decision":"block","reason":os.environ["BLOCK_REASON"]}))'
elif [ -n "$NOTE" ]; then
  NOTE="$NOTE" python3 -c 'import json,os; print(json.dumps({"systemMessage":os.environ["NOTE"]}))'
fi

exit 0
