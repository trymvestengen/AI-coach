"""Tester for per-bruker rate-limiting på chat-endepunktene (security audit H1)."""

import pytest
from fastapi import HTTPException

from app import rate_limit


def test_allows_up_to_the_limit():
    rate_limit._reset()
    # Nøyaktig MAX_REQUESTS innenfor vinduet skal gå gjennom.
    for i in range(rate_limit.MAX_REQUESTS):
        rate_limit.check_rate_limit("user-A", now=1000.0 + i)


def test_blocks_over_the_limit():
    rate_limit._reset()
    for _ in range(rate_limit.MAX_REQUESTS):
        rate_limit.check_rate_limit("user-A", now=1000.0)
    with pytest.raises(HTTPException) as exc:
        rate_limit.check_rate_limit("user-A", now=1000.0)
    assert exc.value.status_code == 429
    assert "Retry-After" in exc.value.headers


def test_window_slides_and_frees_budget():
    rate_limit._reset()
    for _ in range(rate_limit.MAX_REQUESTS):
        rate_limit.check_rate_limit("user-A", now=1000.0)
    # Etter at vinduet har passert er det rom igjen.
    rate_limit.check_rate_limit("user-A", now=1000.0 + rate_limit.WINDOW_SECONDS + 1)


def test_limits_are_per_user():
    rate_limit._reset()
    for _ in range(rate_limit.MAX_REQUESTS):
        rate_limit.check_rate_limit("user-A", now=1000.0)
    # En annen bruker er upåvirket.
    rate_limit.check_rate_limit("user-B", now=1000.0)
