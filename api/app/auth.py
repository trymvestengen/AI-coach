import logging
import os

import httpx
from jose import jwt
from fastapi import Request, HTTPException
from cachetools import cached, TTLCache

logger = logging.getLogger(__name__)

_jwks_cache: TTLCache = TTLCache(maxsize=1, ttl=3600)


@cached(_jwks_cache)
def _get_jwks() -> dict:
    url = os.environ["SUPABASE_JWKS_URL"]
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    # H3: ikke cache et ugyldig svar. Et 200 med feil body (HTML/feilmelding) ville
    # ellers blitt cachet i opptil TTL (1 time) og låst ute ALLE brukere. Ved å raise
    # her lagrer @cached ingenting, så neste forespørsel prøver på nytt.
    if not isinstance(data, dict) or not data.get("keys"):
        raise ValueError("JWKS response missing 'keys'")
    return data


def get_current_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = auth.removeprefix("Bearer ")
    try:
        jwks = _get_jwks()
        # H2: pinn issuer hvis SUPABASE_ISSUER er satt (opt-in for å ikke risikere å
        # brekke prod-auth uten verifisering mot en ekte token). Forventet verdi er
        # "<SUPABASE_URL>/auth/v1". issuer=None → jose hopper over iss-sjekk.
        # require_exp avviser tokens uten utløp (Supabase-tokens har alltid exp).
        issuer = os.environ.get("SUPABASE_ISSUER") or None
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
            issuer=issuer,
            options={"require_exp": True},
        )
        return payload["sub"]
    except HTTPException:
        raise
    except Exception as e:
        # Log the underlying cause so it shows up in Railway logs without leaking 500 to clients.
        logger.warning("token verification failed: %s: %s", type(e).__name__, e)
        raise HTTPException(status_code=401, detail="Invalid token")
