"""Seed test-user profile data for Lag 1 verification."""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from app.db import get_conn

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


async def main() -> None:
    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO user_injuries (user_id, body_part, description, severity, started_at) "
            "VALUES (%s, %s, %s, %s, %s) ON CONFLICT DO NOTHING",
            (TEST_USER_ID, "venstre kne", "vondt ved dyp knebøy", "moderat", "2019-03-01"),
        )
        await conn.execute(
            "INSERT INTO user_preferences (user_id, category, preference) "
            "VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
            (TEST_USER_ID, "exercise", "liker ikke beinpress"),
        )
        for eq in ("barbell", "dumbbells_20kg"):
            await conn.execute(
                "INSERT INTO user_equipment (user_id, equipment) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (TEST_USER_ID, eq),
            )
        await conn.execute(
            "INSERT INTO user_constraints (user_id, type, description) "
            "VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
            (TEST_USER_ID, "schedule", "kun tirs/tors/lør"),
        )
        await conn.commit()

        for table in ("user_injuries", "user_preferences", "user_equipment", "user_constraints"):
            cur = await conn.execute(f"SELECT count(*) FROM {table} WHERE user_id = %s", (TEST_USER_ID,))
            row = await cur.fetchone()
            print(f"{table}: {row[0]}")


asyncio.run(main())
