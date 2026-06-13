import logging
import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

logger = logging.getLogger(__name__)
router = APIRouter()


class FolderBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)


@router.get("/template-folders")
async def list_folders(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT f.id, f.name,
                       (SELECT COUNT(*) FROM workout_templates t
                          WHERE t.folder_id = f.id AND t.archived_at IS NULL)::int
                FROM template_folders f
                WHERE f.user_id = %s
                ORDER BY f.position, f.created_at
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception:
        logger.exception("list_folders failed")
        return []
    return [{"id": str(r[0]), "name": r[1], "template_count": r[2]} for r in rows]


@router.post("/template-folders", status_code=201)
async def create_folder(request: Request, body: FolderBody) -> dict:
    user_id = get_current_user_id(request)
    folder_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO template_folders (id, user_id, name) "
                "VALUES (%s, %s, %s) RETURNING id, name",
                (folder_id, user_id, body.name.strip()),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception:
        logger.exception("create_folder failed")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": str(row[0]), "name": row[1], "template_count": 0}


@router.patch("/template-folders/{folder_id}")
async def rename_folder(folder_id: str, request: Request, body: FolderBody) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "UPDATE template_folders SET name = %s WHERE id = %s AND user_id = %s "
            "RETURNING id, name",
            (body.name.strip(), folder_id, user_id),
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"id": str(row[0]), "name": row[1]}


@router.delete("/template-folders/{folder_id}", status_code=200)
async def delete_folder(folder_id: str, request: Request) -> dict:
    user_id = get_current_user_id(request)
    async with get_conn() as conn:
        cur = await conn.execute(
            "DELETE FROM template_folders WHERE id = %s AND user_id = %s RETURNING id",
            (folder_id, user_id),
        )
        row = await cur.fetchone()
        await conn.commit()
    if row is None:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"status": "deleted"}
