"""Tools for managing program folders."""
import uuid
from app.db import get_conn


async def create_folder(user_id: str, name: str) -> dict:
    folder_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO program_folders (id, user_id, name) VALUES (%s, %s, %s)",
                (folder_id, user_id, name.strip()),
            )
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "folder_id": folder_id, "name": name}


async def rename_folder(user_id: str, folder_id: str, name: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE program_folders SET name = %s "
                "WHERE id = %s AND user_id = %s RETURNING id",
                (name.strip(), folder_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Folder not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "folder_id": folder_id, "name": name}


async def delete_folder(user_id: str, folder_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM program_folders WHERE id = %s AND user_id = %s RETURNING id",
                (folder_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Folder not found"}
            await conn.commit()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {"ok": True, "folder_id": folder_id}


async def list_folders(user_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT f.id, f.name, "
                "       (SELECT COUNT(*) FROM programs p WHERE p.folder_id = f.id)::int "
                "FROM program_folders f WHERE f.user_id = %s "
                "ORDER BY f.created_at DESC",
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    return {
        "ok": True,
        "folders": [
            {"id": str(r[0]), "name": r[1], "program_count": r[2]} for r in rows
        ],
    }
