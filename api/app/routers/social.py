import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()


@router.post("/social/follow/{target_id}", status_code=204)
async def follow_user(target_id: uuid.UUID, request: Request):
    user_id = get_current_user_id(request)
    if str(target_id) == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT 1 FROM follows WHERE follower_id = %s AND following_id = %s",
                (user_id, target_id),
            )
            if await cur.fetchone():
                raise HTTPException(status_code=409, detail="Already following")
            await conn.execute(
                "INSERT INTO follows (follower_id, following_id) VALUES (%s, %s)",
                (user_id, target_id),
            )
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[follow_user] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/social/follow/{target_id}", status_code=204)
async def unfollow_user(target_id: uuid.UUID, request: Request):
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM follows WHERE follower_id = %s AND following_id = %s RETURNING follower_id",
                (user_id, target_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Not following")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[unfollow_user] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
