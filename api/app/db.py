import os
from contextlib import asynccontextmanager
from psycopg_pool import AsyncConnectionPool

_pool: AsyncConnectionPool | None = None


async def _get_pool() -> AsyncConnectionPool:
    global _pool
    if _pool is None:
        _pool = AsyncConnectionPool(os.environ["DATABASE_URL"], open=False)
        await _pool.open()
    return _pool


@asynccontextmanager
async def get_conn():
    pool = await _get_pool()
    async with pool.connection() as conn:
        yield conn
