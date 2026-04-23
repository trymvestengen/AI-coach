import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.db import get_conn
from app.constants import TEST_USER_ID

_exercises: list[dict] | None = None


def _load_exercises() -> list[dict]:
    global _exercises
    if _exercises is None:
        data_path = Path(__file__).parent.parent / "data" / "exercises.json"
        with open(data_path) as f:
            _exercises = json.load(f)
    return _exercises


def get_exercise_info(exercise_id: str) -> dict:
    for ex in _load_exercises():
        if ex["id"] == exercise_id:
            return ex
    return {"error": f"Exercise '{exercise_id}' not found"}


def search_exercises(
    muscle_group: str | None = None,
    equipment: str | None = None,
    difficulty: str | None = None,
) -> list[dict]:
    results = _load_exercises()
    if muscle_group:
        results = [e for e in results if any(muscle_group.lower() in mg.lower() for mg in e["muscle_groups"])]
    if equipment:
        results = [e for e in results if any(equipment.lower() in eq.lower() for eq in e["equipment"])]
    if difficulty:
        results = [e for e in results if e["difficulty"] == difficulty]
    return [{"id": e["id"], "name": e["name"], "muscle_groups": e["muscle_groups"], "difficulty": e["difficulty"]} for e in results]


def create_program(goal: str, days_per_week: int, equipment: str, experience_level: str) -> dict:
    return {
        "name": f"{days_per_week}-day {goal} program",
        "goal": goal,
        "days_per_week": days_per_week,
        "equipment": equipment,
        "experience_level": experience_level,
        "note": "Program structure created. Describing exercises for each day now.",
    }


async def log_workout(
    exercises: list,
    notes: str | None = None,
    rpe: int | None = None,
) -> dict:
    workout_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO workouts (id, user_id, completed_at, notes, rpe) VALUES (%s, %s, %s, %s, %s)",
                (workout_id, TEST_USER_ID, datetime.now(timezone.utc), notes, rpe),
            )
            for exercise in exercises:
                for i, s in enumerate(exercise["sets"], start=1):
                    await conn.execute(
                        "INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, rpe) "
                        "VALUES (%s, %s, %s, %s, %s, %s)",
                        (workout_id, exercise["exercise_id"], i, s["reps"], s.get("weight_kg"), s.get("rpe")),
                    )
            await conn.commit()
    except Exception as e:
        return {"error": f"Failed to log workout: {e}"}
    return {"workout_id": workout_id, "message": "Workout logged successfully"}


async def get_user_history(limit: int = 5) -> list:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.id, w.completed_at, w.notes, w.rpe,
                       json_agg(
                           json_build_object(
                               'exercise_id', ws.exercise_id,
                               'set_number', ws.set_number,
                               'reps', ws.reps,
                               'weight_kg', ws.weight_kg::float,
                               'rpe', ws.rpe
                           ) ORDER BY ws.exercise_id, ws.set_number
                       ) AS sets
                FROM workouts w
                JOIN workout_sets ws ON ws.workout_id = w.id
                WHERE w.user_id = %s AND w.completed_at IS NOT NULL
                GROUP BY w.id, w.completed_at, w.notes, w.rpe
                ORDER BY w.completed_at DESC
                LIMIT %s
                """,
                (TEST_USER_ID, limit),
            )
            rows = await cur.fetchall()
    except Exception as e:
        return [{"error": f"Failed to fetch history: {e}"}]
    return [
        {
            "workout_id": str(r[0]),
            "date": r[1].isoformat() if r[1] else None,
            "notes": r[2],
            "rpe": r[3],
            "sets": r[4] or [],
        }
        for r in rows
    ]


async def suggest_progression(exercise_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT w.completed_at, ws.weight_kg, ws.rpe
                FROM workout_sets ws
                JOIN workouts w ON w.id = ws.workout_id
                WHERE ws.exercise_id = %s AND w.user_id = %s AND w.completed_at IS NOT NULL
                ORDER BY w.completed_at DESC
                LIMIT 10
                """,
                (exercise_id, TEST_USER_ID),
            )
            rows = await cur.fetchall()
    except Exception as e:
        return {"exercise_id": exercise_id, "error": f"Failed to fetch progression: {e}", "suggested_weight_kg": None}

    if not rows:
        return {
            "exercise_id": exercise_id,
            "suggestion": "No history found. Start with a comfortable weight for 10 reps.",
            "suggested_weight_kg": None,
        }

    last_date = rows[0][0]
    last_rows = [r for r in rows if r[0] == last_date]
    weight = max((r[1] for r in last_rows if r[1] is not None), default=None)
    rpe_vals = [r[2] for r in last_rows if r[2] is not None]
    avg_rpe = sum(rpe_vals) / len(rpe_vals) if rpe_vals else None

    if weight is None:
        return {
            "exercise_id": exercise_id,
            "suggestion": "No weight logged yet. Log a session first.",
            "suggested_weight_kg": None,
        }

    weight = float(weight)

    if avg_rpe is None or avg_rpe >= 10:
        return {
            "exercise_id": exercise_id,
            "suggestion": f"Last session: {weight}kg. Keep the same weight.",
            "suggested_weight_kg": weight,
        }
    elif avg_rpe <= 7:
        new_weight = weight + 2.5
        return {
            "exercise_id": exercise_id,
            "suggestion": f"Last: {weight}kg at RPE {avg_rpe:.0f}. Try {new_weight}kg today!",
            "suggested_weight_kg": new_weight,
        }
    else:
        return {
            "exercise_id": exercise_id,
            "suggestion": f"Last: {weight}kg at RPE {avg_rpe:.0f}. Keep same weight.",
            "suggested_weight_kg": weight,
        }


async def handle_tool(name: str, inputs: dict) -> dict | list:
    if name == "get_exercise_info":
        return get_exercise_info(**inputs)
    if name == "search_exercises":
        return search_exercises(**inputs)
    if name == "create_program":
        return create_program(**inputs)
    if name == "log_workout":
        return await log_workout(**inputs)
    if name == "get_user_history":
        return await get_user_history(**inputs)
    if name == "suggest_progression":
        return await suggest_progression(**inputs)
    return {"error": f"Unknown tool: {name}"}
