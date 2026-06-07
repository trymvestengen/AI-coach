"""Wipe and reimport the exercises table from yuhonas/free-exercise-db.

Run manually:
    cd api && .venv/bin/python db/seed_free_exercise_db.py
"""
import asyncio
import json
import sys
import urllib.request
from pathlib import Path

# Allow running this script directly: add the api/ root to sys.path so
# `from app.db import get_conn` resolves.
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import get_conn  # noqa: E402

JSON_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises"


def fetch_json() -> list:
    with urllib.request.urlopen(JSON_URL) as r:
        return json.loads(r.read())


def build_image_urls(ex: dict) -> list[str]:
    return [f"{IMAGE_BASE}/{img}" for img in ex.get("images", [])]


def build_row_params(ex: dict) -> tuple:
    """Tuple of INSERT params in column order matching the SQL in main()."""
    return (
        ex["id"],
        ex["name"],
        ex.get("primaryMuscles", []),
        [ex["equipment"]] if ex.get("equipment") else [],
        ex.get("level"),
        "\n\n".join(ex.get("instructions", [])),
        ex.get("force"),
        ex.get("mechanic"),
        ex.get("category"),
        ex.get("primaryMuscles", []),
        ex.get("secondaryMuscles", []),
        build_image_urls(ex),
    )


async def main():
    data = fetch_json()
    print(f"Fetched {len(data)} exercises from Free Exercise DB")

    async with get_conn() as conn:
        # Clear FK-dependent rows first.
        await conn.execute("DELETE FROM program_exercise_sets")
        await conn.execute("DELETE FROM program_exercises")
        await conn.execute("DELETE FROM workout_sets")
        await conn.execute("DELETE FROM exercises")

        for ex in data:
            await conn.execute(
                """
                INSERT INTO exercises (
                    id, name, muscle_groups, equipment, difficulty, instructions,
                    force, mechanic, category,
                    primary_muscles, secondary_muscles, image_urls
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                build_row_params(ex),
            )
        await conn.commit()
    print(f"Imported {len(data)} exercises")


if __name__ == "__main__":
    asyncio.run(main())
