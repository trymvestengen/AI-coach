from fastapi import APIRouter, HTTPException, Request
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()


@router.get("/exercises")
async def get_exercises(muscle_group: str | None = None) -> list:
    sql = (
        "SELECT id, name, primary_muscles, equipment, difficulty, "
        "       primary_muscles, secondary_muscles, image_urls "
        "FROM exercises"
    )
    params: tuple = ()
    if muscle_group:
        sql += " WHERE %s = ANY(primary_muscles)"
        params = (muscle_group,)
    sql += " ORDER BY name"
    try:
        async with get_conn() as conn:
            cur = await conn.execute(sql, params)
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_exercises] DB error: {e}")
        return []
    return [
        {
            "id": r[0],
            "name": r[1],
            "muscle_groups": r[2],  # alias for back-compat
            "equipment": r[3],
            "difficulty": r[4],
            "primary_muscles": r[5],
            "secondary_muscles": r[6],
            "image_urls": r[7] or [],
        }
        for r in rows
    ]


@router.get("/exercises/{exercise_id}")
async def get_exercise_by_id(exercise_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, name, primary_muscles, equipment, difficulty, "
                "       instructions, force, mechanic, category, "
                "       primary_muscles, secondary_muscles, image_urls "
                "FROM exercises WHERE id = %s",
                (exercise_id,),
            )
            row = await cur.fetchone()
    except Exception as e:
        print(f"[get_exercise_by_id] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    if row is None:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return {
        "id": row[0],
        "name": row[1],
        "muscle_groups": row[2],
        "equipment": row[3],
        "difficulty": row[4],
        "instructions": row[5] or "",
        "force": row[6],
        "mechanic": row[7],
        "category": row[8],
        "primary_muscles": row[9],
        "secondary_muscles": row[10],
        "image_urls": row[11] or [],
    }


@router.get("/exercises/{exercise_id}/progression")
async def get_exercise_progression(exercise_id: str, request: Request) -> dict:
    """Per-workout best set and total volume for this exercise (last 100 workouts).

    Returns oldest-first data points so frontend charts read left-to-right naturally.
    `estimated_1rm_kg` uses the Brzycki formula (weight × 36 / (37 - reps)),
    kun for 1–12 reps (formelens gyldige område); ellers None.
    """
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT name FROM exercises WHERE id = %s",
                (exercise_id,),
            )
            ex_row = await cur.fetchone()
            if ex_row is None:
                raise HTTPException(status_code=404, detail="Exercise not found")
            exercise_name = ex_row[0]

            cur = await conn.execute(
                """
                SELECT
                  w.completed_at,
                  MAX(COALESCE(ws.weight_kg, 0))::float AS best_weight,
                  MAX(ws.reps) AS best_reps,
                  SUM(ws.reps * COALESCE(ws.weight_kg, 0))::float AS total_volume,
                  COUNT(ws.id)::int AS set_count
                FROM workout_sets ws
                JOIN workouts w ON w.id = ws.workout_id
                WHERE w.user_id = %s
                  AND ws.exercise_id = %s
                  AND w.completed_at IS NOT NULL
                GROUP BY w.id, w.completed_at
                ORDER BY w.completed_at DESC
                LIMIT 100
                """,
                (user_id, exercise_id),
            )
            rows = await cur.fetchall()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[get_exercise_progression] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

    data_points = [
        {
            "completed_at": r[0].isoformat() if r[0] else None,
            "best_weight_kg": r[1],
            "best_reps": r[2],
            "total_volume_kg": r[3],
            "set_count": r[4],
            # Brzycki er kun gyldig opp til ~12 reps (over det divergerer den og gir
            # absurde verdier, f.eks. 36×vekt ved 37 reps). Ikke estimer utenfor det.
            "estimated_1rm_kg": round(r[1] * (36 / (37 - r[2])), 1) if r[1] > 0 and r[2] and 1 <= r[2] <= 12 else None,
        }
        for r in reversed(rows)
    ]
    return {
        "exercise_id": exercise_id,
        "exercise_name": exercise_name,
        "data_points": data_points,
    }
