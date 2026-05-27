import os
import anthropic
from app.db import get_conn

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


async def generate_workout_summary(workout_id: str) -> str:
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, user_id, started_at, completed_at, notes, rpe "
            "FROM workouts WHERE id = %s",
            (workout_id,),
        )
        workout = await cur.fetchone()
        if workout is None:
            return ""

        cur = await conn.execute(
            "SELECT exercise_id, set_number, reps, weight_kg, rpe, coach_note "
            "FROM workout_sets WHERE workout_id = %s ORDER BY exercise_id, set_number",
            (workout_id,),
        )
        sets = await cur.fetchall()

        lines = [f"Workout {workout[0]} on {workout[2]}"]
        if workout[4]:
            lines.append(f"User notes: {workout[4]}")
        if workout[5]:
            lines.append(f"Overall RPE: {workout[5]}")
        lines.append("Sets:")
        for s in sets:
            ex, sn, reps, w, rpe, note = s
            line = f"  {ex} set {sn}: {reps}x{w}kg" + (f" RPE{rpe}" if rpe else "")
            if note:
                line += f" — {note}"
            lines.append(line)

        prompt = (
            "Summarize this workout in 2-3 sentences for the user's training history. "
            "Focus on: what went well, anything notable about effort or form, and any pattern worth remembering. "
            "Do NOT include set-by-set detail. Write in the user's locale (Norwegian if data looks Norwegian, else English).\n\n"
            + "\n".join(lines)
        )

        resp = await client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        summary_text = ""
        for block in resp.content:
            if hasattr(block, "text"):
                summary_text = block.text
                break

        await conn.execute(
            "UPDATE workouts SET coach_summary = %s WHERE id = %s",
            (summary_text, workout_id),
        )
        await conn.commit()

    return summary_text
