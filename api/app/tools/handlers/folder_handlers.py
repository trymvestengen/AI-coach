"""Tools for managing template folders."""
import logging
import uuid
from app.db import get_conn

logger = logging.getLogger(__name__)


async def create_folder(user_id: str, name: str) -> dict:
    folder_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            await conn.execute(
                "INSERT INTO template_folders (id, user_id, name) VALUES (%s, %s, %s)",
                (folder_id, user_id, name.strip()),
            )
            await conn.commit()
    except Exception:
        logger.exception("create_folder failed")
        return {"ok": False, "error": "Kunne ikke lage mappen."}
    return {"ok": True, "folder_id": folder_id, "name": name}


async def rename_folder(user_id: str, folder_id: str, name: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "UPDATE template_folders SET name = %s "
                "WHERE id = %s AND user_id = %s RETURNING id",
                (name.strip(), folder_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Folder not found"}
            await conn.commit()
    except Exception:
        logger.exception("rename_folder failed")
        return {"ok": False, "error": "Kunne ikke gi nytt navn til mappen."}
    return {"ok": True, "folder_id": folder_id, "name": name}


async def delete_folder(user_id: str, folder_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM template_folders WHERE id = %s AND user_id = %s RETURNING id",
                (folder_id, user_id),
            )
            if await cur.fetchone() is None:
                return {"ok": False, "error": "Folder not found"}
            await conn.commit()
    except Exception:
        logger.exception("delete_folder failed")
        return {"ok": False, "error": "Kunne ikke slette mappen."}
    return {"ok": True, "folder_id": folder_id}


async def list_folders(user_id: str) -> dict:
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT f.id, f.name, "
                "       (SELECT COUNT(*) FROM workout_templates t WHERE t.folder_id = f.id)::int "
                "FROM template_folders f WHERE f.user_id = %s "
                "ORDER BY f.created_at DESC",
                (user_id,),
            )
            rows = await cur.fetchall()
    except Exception:
        logger.exception("list_folders failed")
        return {"ok": False, "error": "Kunne ikke hente mapper."}
    return {
        "ok": True,
        "folders": [
            {"id": str(r[0]), "name": r[1], "template_count": r[2]} for r in rows
        ],
    }
