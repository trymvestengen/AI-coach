"""Verify ON DELETE CASCADE wipes all Lag 1 + Lag 2 data when a user is deleted."""
import asyncio
import uuid
from dotenv import load_dotenv
load_dotenv()

from app.db import get_conn


async def main() -> None:
    user_id = str(uuid.uuid4())
    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO users (id, email) VALUES (%s, %s)",
            (user_id, f"cascade-test-{user_id}@example.com"),
        )
        await conn.execute(
            "INSERT INTO user_injuries (user_id, body_part) VALUES (%s, %s)",
            (user_id, "test injury"),
        )
        await conn.execute(
            "INSERT INTO coach_observations (user_id, category, observation) VALUES (%s, %s, %s)",
            (user_id, "pattern", "test observation"),
        )
        await conn.commit()

        cur = await conn.execute("SELECT count(*) FROM user_injuries WHERE user_id = %s", (user_id,))
        injuries_before = (await cur.fetchone())[0]
        cur = await conn.execute("SELECT count(*) FROM coach_observations WHERE user_id = %s", (user_id,))
        observations_before = (await cur.fetchone())[0]

        await conn.execute("DELETE FROM users WHERE id = %s", (user_id,))
        await conn.commit()

        cur = await conn.execute("SELECT count(*) FROM user_injuries WHERE user_id = %s", (user_id,))
        injuries_after = (await cur.fetchone())[0]
        cur = await conn.execute("SELECT count(*) FROM coach_observations WHERE user_id = %s", (user_id,))
        observations_after = (await cur.fetchone())[0]

    print(f"Before delete: injuries={injuries_before}, observations={observations_before}")
    print(f"After delete:  injuries={injuries_after}, observations={observations_after}")
    assert injuries_before == 1 and observations_before == 1, "Seeded data not present"
    assert injuries_after == 0 and observations_after == 0, "CASCADE did not work"
    print("\n✓ CASCADE delete works correctly")


asyncio.run(main())
