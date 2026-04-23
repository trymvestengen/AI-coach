import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

import psycopg

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
EXERCISES_PATH = Path(__file__).parent.parent / "app" / "data" / "exercises.json"


async def seed() -> None:
    conn_str = os.environ["DATABASE_URL"]
    async with await psycopg.AsyncConnection.connect(conn_str) as conn:
        await conn.execute(
            """
            INSERT INTO users (id, email, name)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (TEST_USER_ID, "test@aicoach.no", "Test User"),
        )

        with open(EXERCISES_PATH) as f:
            exercises = json.load(f)

        for ex in exercises:
            await conn.execute(
                """
                INSERT INTO exercises (id, name, muscle_groups, equipment, difficulty, instructions)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
                """,
                (
                    ex["id"],
                    ex["name"],
                    ex["muscle_groups"],
                    ex.get("equipment", []),
                    ex["difficulty"],
                    ex.get("instructions"),
                ),
            )

        await conn.commit()
        print(f"Seeded {len(exercises)} exercises and test user {TEST_USER_ID}")


if __name__ == "__main__":
    asyncio.run(seed())
