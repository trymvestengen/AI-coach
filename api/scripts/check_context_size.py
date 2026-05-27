"""Verify base context size for the seeded test user."""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from app.services.memory import build_base_context

TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


async def main() -> None:
    ctx = await build_base_context(TEST_USER_ID)
    print(f"Length: {len(ctx)} chars (~{len(ctx)//4} tokens)")
    print("---")
    print(ctx)


asyncio.run(main())
