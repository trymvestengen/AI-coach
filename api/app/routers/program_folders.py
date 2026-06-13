import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from app.db import get_conn
from app.auth import get_current_user_id

router = APIRouter()


class FolderBody(BaseModel):
    name: str = Field(min_length=1, max_length=80)


@router.get("/folders")
async def list_folders(request: Request) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                """
                SELECT f.id, f.name,
                       (SELECT COUNT(*) FROM programs p WHERE p.folder_id = f.id)::int
                FROM program_folders f
                WHERE f.user_id = %s
                ORDER BY f.created_at DESC
                """,
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[list_folders] DB error: {e}")
        return []
    return [{"id": str(r[0]), "name": r[1], "program_count": r[2]} for r in rows]


@router.post("/folders", status_code=201)
async def create_folder(request: Request, body: FolderBody) -> dict:
    user_id = get_current_user_id(request)
    folder_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO program_folders (id, user_id, name) "
                "VALUES (%s, %s, %s) RETURNING id, name",
                (folder_id, user_id, body.name.strip()),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception as e:
        print(f"[create_folder] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": str(row[0]), "name": row[1], "program_count": 0}


@router.patch("/folders/{folder_id}")
async def rename_folder(folder_id: uuid.UUID, request: Request, body: FolderBody) -> dict:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE program_folders SET name = %s "
                "WHERE id = %s AND user_id = %s RETURNING id, name",
                (body.name.strip(), folder_id, user_id),
            )
            row = await cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Folder not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[rename_folder] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {"id": str(row[0]), "name": row[1]}


@router.delete("/folders/{folder_id}", status_code=204)
async def delete_folder(folder_id: uuid.UUID, request: Request) -> None:
    """Slett mappen. Programmer i mappen flyttes til rot via ON DELETE SET NULL."""
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM program_folders WHERE id = %s AND user_id = %s RETURNING id",
                (folder_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Folder not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_folder] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
