import asyncio
import os
from contextlib import asynccontextmanager
from psycopg import AsyncConnection
from psycopg_pool import AsyncConnectionPool

_pool: AsyncConnectionPool | None = None
_pool_lock = asyncio.Lock()


async def _disable_prepared_statements(conn: AsyncConnection) -> None:
    # Supabase routes us through PgBouncer in transaction-pool mode, which
    # doesn't persist prepared statements across reused connections.
    # Setting threshold to None disables auto-preparation entirely.
    conn.prepare_threshold = None


async def _get_pool() -> AsyncConnectionPool:
    global _pool
    if _pool is not None:
        return _pool
    async with _pool_lock:
        if _pool is None:
            _pool = AsyncConnectionPool(
                os.environ["DATABASE_URL"],
                open=False,
                configure=_disable_prepared_statements,
            )
            await _pool.open()
    return _pool


@asynccontextmanager
async def get_conn():
    pool = await _get_pool()
    async with pool.connection() as conn:
        yield conn
