import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()


@router.post("/social/follow/{target_id}", status_code=204)
async def follow_user(target_id: uuid.UUID, request: Request):
    user_id = get_current_user_id(request)
    if str(target_id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT 1 FROM follows WHERE follower_id = %s AND following_id = %s",
                (user_id, target_id),
            )
            if await cur.fetchone():
                raise HTTPException(status_code=409, detail="Already following")
            await conn.execute(
                "INSERT INTO follows (follower_id, following_id) VALUES (%s, %s)",
                (user_id, target_id),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[follow_user] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/social/follow/{target_id}", status_code=204)
async def unfollow_user(target_id: uuid.UUID, request: Request):
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM follows WHERE follower_id = %s AND following_id = %s RETURNING follower_id",
                (user_id, target_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Not following")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[unfollow_user] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/social/feed")
async def get_feed(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            # Shared workouts from followed users
            cur = await conn.execute(
                """
                SELECT
                    w.id, w.shared_at, w.completed_at, w.started_at, w.rpe,
                    u.id, u.first_name, u.last_name, u.avatar_url,
                    (SELECT COUNT(*) FROM post_likes pl WHERE pl.workout_id = w.id),
                    (SELECT COUNT(*) FROM post_likes pl WHERE pl.workout_id = w.id AND pl.user_id = %s) > 0,
                    (SELECT COUNT(*) FROM post_comments pc WHERE pc.workout_id = w.id)
                FROM workouts w
                JOIN follows f ON f.following_id = w.user_id AND f.follower_id = %s
                JOIN users u ON u.id = w.user_id
                WHERE w.shared_at IS NOT NULL
                ORDER BY w.shared_at DESC
                LIMIT 20
                """,
                (user_id, user_id),
            )
            workout_rows = await cur.fetchall()
            if not workout_rows:
                return []

            workout_ids = [str(r[0]) for r in workout_rows]

            # Sets + exercise info per workout
            cur = await conn.execute(
                """
                SELECT
                    ws.workout_id, ws.exercise_id, e.name, e.muscle_groups,
                    COUNT(*) AS set_count,
                    MAX(ws.weight_kg::float) AS max_weight,
                    MAX(ws.reps) AS max_reps,
                    SUM(COALESCE(ws.weight_kg::float, 0) * COALESCE(ws.reps, 0)) AS exercise_volume
                FROM workout_sets ws
                JOIN exercises e ON e.id = ws.exercise_id
                WHERE ws.workout_id = ANY(%s)
                GROUP BY ws.workout_id, ws.exercise_id, e.name, e.muscle_groups
                """,
                (workout_ids,),
            )
            set_rows = await cur.fetchall()

            # All-time max weight per (user_id, exercise_id) for PR detection
            followed_user_ids = list({str(r[5]) for r in workout_rows})
            cur = await conn.execute(
                """
                SELECT w.user_id, ws.exercise_id, MAX(ws.weight_kg::float)
                FROM workout_sets ws
                JOIN workouts w ON w.id = ws.workout_id
                WHERE w.user_id = ANY(%s) AND ws.weight_kg IS NOT NULL
                GROUP BY w.user_id, ws.exercise_id
                """,
                (followed_user_ids,),
            )
            pr_rows = await cur.fetchall()
    except Exception as e:
        print(f"[get_feed] DB error: {e}")
        return []

    from collections import defaultdict

    sets_by_workout: dict = defaultdict(list)
    for r in set_rows:
        sets_by_workout[str(r[0])].append({
            "exercise_id": r[1],
            "name": r[2],
            "muscle_groups": r[3] or [],
            "set_count": int(r[4]),
            "max_weight": float(r[5]) if r[5] else None,
            "max_reps": int(r[6]) if r[6] else None,
            "volume": float(r[7]) if r[7] else 0.0,
        })

    alltime_max: dict = {}
    for r in pr_rows:
        alltime_max[(str(r[0]), r[1])] = float(r[2]) if r[2] else None

    result = []
    for r in workout_rows:
        workout_id   = str(r[0])
        shared_at    = r[1]
        completed_at = r[2]
        started_at   = r[3]
        workout_rpe  = r[4]
        uid          = str(r[5])
        first_name   = r[6]
        last_name    = r[7]
        avatar_url   = r[8]
        like_count   = int(r[9])
        liked_by_me  = bool(r[10])
        comment_count = int(r[11])

        exercises = sets_by_workout[workout_id]

        total_volume_kg = sum(e["volume"] for e in exercises)
        total_set_count = sum(e["set_count"] for e in exercises)

        # Unique muscle group tags preserving insertion order
        seen_tags: set = set()
        tags = []
        for e in exercises:
            for mg in e["muscle_groups"]:
                if mg not in seen_tags:
                    seen_tags.add(mg)
                    tags.append(mg)

        duration_min = 0
        if started_at and completed_at:
            duration_min = round((completed_at - started_at).total_seconds() / 60)

        top_exercises = [
            {
                "name": e["name"],
                "sets": e["set_count"],
                "reps": e["max_reps"] or 0,
                "weight_kg": e["max_weight"] or 0.0,
            }
            for e in sorted(exercises, key=lambda x: x["volume"], reverse=True)[:3]
        ]

        is_pr = any(
            e["max_weight"] is not None
            and alltime_max.get((uid, e["exercise_id"])) is not None
            and abs(e["max_weight"] - alltime_max[(uid, e["exercise_id"])]) < 0.01
            for e in exercises
        )

        result.append({
            "workout_id": workout_id,
            "shared_at": shared_at.isoformat(),
            "user": {
                "id": uid,
                "first_name": first_name,
                "last_name": last_name,
                "avatar_url": avatar_url,
            },
            "workout": {
                "name": " · ".join(tags[:3]) if tags else "Treningsøkt",
                "duration_min": duration_min,
                "tags": tags[:5],
                "volume_kg": round(total_volume_kg, 1),
                "set_count": total_set_count,
                "avg_rpe": float(workout_rpe) if workout_rpe else None,
                "is_pr": is_pr,
                "top_exercises": top_exercises,
            },
            "likes": {"count": like_count, "liked_by_me": liked_by_me},
            "comments": {"count": comment_count},
        })

    return result
