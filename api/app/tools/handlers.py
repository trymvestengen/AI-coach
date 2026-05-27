import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.db import get_conn
from app.constants import TEST_USER_ID
from app.tools import memory_handlers

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


async def create_program(name: str, days: list) -> dict:
    program_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "UPDATE programs SET is_active = false WHERE user_id = %s",
                (TEST_USER_ID,),
            )
            await conn.execute(
                "INSERT INTO programs (id, user_id, name, is_active) VALUES (%s, %s, %s, true)",
                (program_id, TEST_USER_ID, name),
            )
            for i, day in enumerate(days, start=1):
                day_id = str(uuid.uuid4())
                await conn.execute(
                    "INSERT INTO program_days (id, program_id, day_number, name) VALUES (%s, %s, %s, %s)",
                    (day_id, program_id, i, day["name"]),
                )
                for j, ex in enumerate(day.get("exercises", [])):
                    await conn.execute(
                        "INSERT INTO program_exercises "
                        "(program_day_id, exercise_id, sets, reps, weight_kg, order_index) "
                        "VALUES (%s, %s, %s, %s, %s, %s)",
                        (day_id, ex["exercise_id"], ex["sets"], ex["reps"], ex.get("weight_kg"), j),
                    )
            await conn.commit()
    except Exception as e:
        return {"error": f"Failed to create program: {e}"}
    return {"program_id": program_id, "name": name, "days_count": len(days)}


async def log_workout(
    exercises: list,
    notes: str | None = None,
    rpe: int | None = None,
    coach_summary: str | None = None,
) -> dict:
    workout_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO workouts (id, user_id, started_at, completed_at, notes, rpe, coach_summary) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (workout_id, TEST_USER_ID, datetime.now(timezone.utc), datetime.now(timezone.utc), notes, rpe, coach_summary),
            )
            for ex in exercises:
                for i, s in enumerate(ex.get("sets", []), start=1):
                    await conn.execute(
                        "INSERT INTO workout_sets "
                        "(workout_id, exercise_id, set_number, reps, weight_kg, rpe, coach_note) "
                        "VALUES (%s, %s, %s, %s, %s, %s, %s)",
                        (
                            workout_id,
                            ex["exercise_id"],
                            i,
                            s.get("reps"),
                            s.get("weight_kg"),
                            s.get("rpe"),
                            s.get("coach_note"),
                        ),
                    )
            await conn.commit()
    except Exception as e:
        return {"error": f"Failed to log workout: {e}", "status": "error"}
    return {"workout_id": workout_id, "status": "logged", "message": "Workout logged successfully"}


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
        return await create_program(**inputs)
    if name == "log_workout":
        return await log_workout(**inputs)
    if name == "get_user_history":
        return await get_user_history(**inputs)
    if name == "suggest_progression":
        return await suggest_progression(**inputs)
    if name == "get_user_profile":
        return await memory_handlers.get_user_profile(TEST_USER_ID)
    if name == "get_workout_history":
        return await memory_handlers.get_workout_history(
            TEST_USER_ID,
            exercise_id=inputs.get("exercise_id"),
            limit=inputs.get("limit", 10),
        )
    if name == "get_progression":
        return await memory_handlers.get_progression(
            TEST_USER_ID,
            exercise_id=inputs["exercise_id"],
            weeks=inputs.get("weeks", 12),
        )
    if name == "search_observations":
        return await memory_handlers.search_observations(
            TEST_USER_ID,
            category=inputs.get("category"),
            days=inputs.get("days", 90),
            limit=inputs.get("limit", 20),
        )
    if name == "get_recent_sessions":
        return await memory_handlers.get_recent_sessions(
            TEST_USER_ID,
            days=inputs.get("days", 30),
            limit=inputs.get("limit", 10),
        )
    if name == "write_observation":
        return await memory_handlers.write_observation(
            TEST_USER_ID,
            category=inputs["category"],
            observation=inputs["observation"],
            confidence=inputs.get("confidence", "medium"),
            related_workout_id=inputs.get("related_workout_id"),
        )
    if name == "log_set_with_note":
        return await memory_handlers.log_set_with_note(
            workout_id=inputs["workout_id"],
            exercise_id=inputs["exercise_id"],
            set_number=inputs["set_number"],
            reps=inputs.get("reps"),
            weight_kg=inputs.get("weight_kg"),
            rpe=inputs.get("rpe"),
            coach_note=inputs.get("coach_note"),
        )
    return {"error": f"Unknown tool: {name}"}
