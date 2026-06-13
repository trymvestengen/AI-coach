"""Heuristikk for å foreslå neste økt-mal (v1, ingen LLM).

Regler:
1. Finn siste fullførte økts mal. Ligger den i en mappe → neste mal i mappen
   (etter position, syklisk).
2. Ellers → malen som er trent for lengst siden (mest "stale").
3. Tom historikk → malen med lavest position.
4. Ingen maler → None.
"""
import logging
from app.db import get_conn

logger = logging.getLogger(__name__)


async def suggest_next_template(user_id: str) -> dict | None:
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT t.id, t.folder_id, t.position
            FROM workouts w
            JOIN workout_templates t ON t.id = w.template_id
            WHERE w.user_id = %s AND w.completed_at IS NOT NULL AND w.template_id IS NOT NULL
            ORDER BY w.completed_at DESC
            LIMIT 1
            """,
            (user_id,),
        )
        last = await cur.fetchone()

        if last is not None:
            last_id, folder_id, last_pos = last
            if folder_id is not None:
                cur = await conn.execute(
                    "SELECT id, position FROM workout_templates "
                    "WHERE folder_id = %s AND user_id = %s AND archived_at IS NULL "
                    "ORDER BY position, created_at",
                    (folder_id, user_id),
                )
                folder_rows = await cur.fetchall()
                if folder_rows and len(folder_rows) > 1:
                    ids = [str(r[0]) for r in folder_rows]
                    try:
                        idx = ids.index(str(last_id))
                    except ValueError:
                        idx = -1
                    nxt = ids[(idx + 1) % len(ids)]
                    return {"template_id": nxt, "reason": "Neste i rotasjon"}

            cur = await conn.execute(
                """
                SELECT t.id
                FROM workout_templates t
                LEFT JOIN (
                    SELECT template_id, MAX(completed_at) AS last_done
                    FROM workouts WHERE user_id = %s AND completed_at IS NOT NULL
                    GROUP BY template_id
                ) w ON w.template_id = t.id
                WHERE t.user_id = %s AND t.archived_at IS NULL
                ORDER BY w.last_done ASC NULLS FIRST, t.position
                LIMIT 1
                """,
                (user_id, user_id),
            )
            stale = await cur.fetchone()
            if stale is not None:
                return {"template_id": str(stale[0]), "reason": "Lengst siden sist"}
            return None

        cur = await conn.execute(
            "SELECT id, name FROM workout_templates "
            "WHERE user_id = %s AND archived_at IS NULL ORDER BY position, created_at LIMIT 1",
            (user_id,),
        )
        first = await cur.fetchone()
        if first is None:
            return None
        return {"template_id": str(first[0]), "reason": "Kom i gang"}
