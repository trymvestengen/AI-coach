import pytest
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_build_base_context_includes_profile_and_recent_workouts(monkeypatch):
    async def fake_profile(user_id):
        return {
            "id": user_id,
            "name": "Trym",
            "locale": "no",
            "persona_mode": "friend",
            "goals": "Bygge muskler",
            "injuries": [{"body_part": "venstre kne", "description": "vondt ved dyp knebøy"}],
            "preferences": [{"category": "exercise", "preference": "liker ikke beinpress"}],
            "equipment": ["barbell", "dumbbells_20kg"],
            "constraints": [{"type": "schedule", "description": "kun tirs/tors/lør"}],
        }

    async def fake_history(user_id, exercise_id=None, limit=3):
        return {"ok": True, "data": [
            {"id": "w1", "started_at": "2026-05-26", "coach_summary": "Good day"},
        ]}

    async def fake_templates(user_id):
        return [{"name": "3-day split", "exercise_count": 5}]

    monkeypatch.setattr("app.services.memory.get_user_profile", fake_profile)
    monkeypatch.setattr("app.services.memory.get_workout_history", fake_history)
    monkeypatch.setattr("app.services.memory.get_template_summary", fake_templates)

    from app.services.memory import build_base_context
    ctx = await build_base_context("user-1")

    assert "Trym" in ctx
    assert "Bygge muskler" in ctx
    assert "venstre kne" in ctx
    assert "liker ikke beinpress" in ctx
    assert "barbell" in ctx
    assert "kun tirs/tors/lør" in ctx
    assert "Good day" in ctx
    assert "3-day split" in ctx


@pytest.mark.asyncio
async def test_build_base_context_stays_under_2000_tokens(monkeypatch):
    """Sanity check: even with rich data, base context must fit in budget."""
    async def fake_profile(user_id):
        return {
            "id": user_id,
            "name": "Trym",
            "locale": "no",
            "persona_mode": "friend",
            "goals": "x" * 200,
            "injuries": [{"body_part": "x" * 50, "description": "x" * 200}] * 5,
            "preferences": [{"category": "exercise", "preference": "x" * 100}] * 10,
            "equipment": ["x" * 30] * 10,
            "constraints": [{"type": "x", "description": "x" * 100}] * 5,
        }
    async def fake_history(user_id, exercise_id=None, limit=3):
        return {"ok": True, "data": [{"id": f"w{i}", "started_at": "2026-05-26", "coach_summary": "x" * 300} for i in range(3)]}
    async def fake_templates(user_id):
        return [{"name": "x" * 50, "exercise_count": 3}]

    monkeypatch.setattr("app.services.memory.get_user_profile", fake_profile)
    monkeypatch.setattr("app.services.memory.get_workout_history", fake_history)
    monkeypatch.setattr("app.services.memory.get_template_summary", fake_templates)

    from app.services.memory import build_base_context
    ctx = await build_base_context("user-1")

    # Rough proxy: 4 chars ≈ 1 token. Budget is 2000 tokens ≈ 8000 chars.
    assert len(ctx) < 8000, f"Base context too large: {len(ctx)} chars"
