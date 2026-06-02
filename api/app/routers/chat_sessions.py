from fastapi import APIRouter, Request, HTTPException
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter(prefix="/api/chat")


@router.get("/sessions/recent")
async def list_recent_sessions(request: Request) -> list[dict]:
    """Recent past chat sessions with the user's first message as preview.
    Excludes onboarding sessions and sessions without user messages."""
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            """
            SELECT s.id, s.last_activity_at,
                   (
                     SELECT m.content->>'text'
                     FROM coach_messages m
                     WHERE m.session_id = s.id AND m.role = 'user'
                     ORDER BY m.created_at ASC LIMIT 1
                   ) AS preview
            FROM coach_sessions s
            WHERE s.user_id = %s
              AND s.is_onboarding = false
            ORDER BY s.last_activity_at DESC
            LIMIT 50
            """,
            (user_id,),
        )
        rows = await cur.fetchall()
    return [
        {"id": str(r[0]), "last_activity_at": str(r[1]), "preview": r[2]}
        for r in rows
        if r[2] is not None
    ]


@router.get("/sessions/current")
async def get_current_session(request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT id, last_activity_at FROM coach_sessions "
            "WHERE user_id = %s AND ended_at IS NULL "
            "  AND last_activity_at > now() - interval '30 minutes' "
            "ORDER BY last_activity_at DESC LIMIT 1",
            (user_id,),
        )
        row = await cur.fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="No active session")
    return {"id": row[0], "last_activity_at": str(row[1])}


@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str, request: Request) -> list[dict]:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT m.id, m.role, m.content, m.created_at "
            "FROM coach_messages m JOIN coach_sessions s ON s.id = m.session_id "
            "WHERE m.session_id = %s AND s.user_id = %s "
            "ORDER BY m.created_at ASC",
            (session_id, user_id),
        )
        rows = await cur.fetchall()
    return [
        {"id": r[0], "role": r[1], "content": r[2], "created_at": str(r[3])}
        for r in rows
    ]


@router.post("/sessions/new")
async def create_new_session(request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        await conn.execute(
            "UPDATE coach_sessions SET ended_at = now() "
            "WHERE user_id = %s AND ended_at IS NULL",
            (user_id,),
        )
        cur = await conn.execute(
            "INSERT INTO coach_sessions (user_id) VALUES (%s) RETURNING id",
            (user_id,),
        )
        row = await cur.fetchone()
        await conn.commit()
    return {"id": row[0]}
