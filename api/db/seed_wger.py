import asyncio
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

import psycopg

EXERCISES_PATH = Path(__file__).parent / "exercises_wger.json"


async def seed() -> None:
    conn_str = os.environ["DATABASE_URL"]
    with open(EXERCISES_PATH) as f:
        exercises = json.load(f)

    async with await psycopg.AsyncConnection.connect(conn_str) as conn:
        for ex in exercises:
            await conn.execute(
                """
                INSERT INTO exercises (id, name, muscle_groups, equipment, difficulty, instructions)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name          = EXCLUDED.name,
                    muscle_groups = EXCLUDED.muscle_groups,
                    equipment     = EXCLUDED.equipment,
                    difficulty    = EXCLUDED.difficulty,
                    instructions  = EXCLUDED.instructions
                """,
                (
                    ex["id"],
                    ex["name"],
                    ex["muscle_groups"],
                    ex["equipment"],
                    ex["difficulty"],
                    ex.get("instructions"),
                ),
            )
        await conn.commit()
        print(f"Seeded {len(exercises)} exercises from wger data")


if __name__ == "__main__":
    asyncio.run(seed())
