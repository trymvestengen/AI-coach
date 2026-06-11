"""Per-bruker rate-limiting for de LLM-baserte chat-endepunktene.

Security audit H1: uten dette kan en autentisert bruker fyre forespørsler i loop og
løpe opp ubegrenset Anthropic-kost (finansiell DoS). En enkel sliding-window-teller
per bruker holder det i sjakk.

NB: tellingen er in-memory → per prosess/instans. For flere Railway-instanser bør den
flyttes til Postgres/Redis. Som førstelinje-vern mot kost/abuse er per-prosess greit.
"""

import os
import time
from collections import defaultdict, deque

from fastapi import HTTPException

WINDOW_SECONDS = int(os.environ.get("CHAT_RATE_WINDOW_SECONDS", "60"))
MAX_REQUESTS = int(os.environ.get("CHAT_RATE_MAX_REQUESTS", "20"))

_hits: dict[str, deque] = defaultdict(deque)


def check_rate_limit(user_id: str, *, now: float | None = None) -> None:
    """Raise 429 hvis brukeren har oversteget budsjettet i vinduet.

    `now` kan injiseres i tester for determinisme.
    """
    t = time.monotonic() if now is None else now
    dq = _hits[user_id]

    cutoff = t - WINDOW_SECONDS
    while dq and dq[0] <= cutoff:
        dq.popleft()

    if len(dq) >= MAX_REQUESTS:
        retry_after = int(dq[0] + WINDOW_SECONDS - t) + 1
        raise HTTPException(
            status_code=429,
            detail="For mange forespørsler. Vent litt og prøv igjen.",
            headers={"Retry-After": str(max(retry_after, 1))},
        )

    dq.append(t)


def _reset() -> None:
    """Kun for tester."""
    _hits.clear()
