"""Body metrics tracking — weight, body fat %, notes over time."""
import uuid
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field, model_validator
from app.db import get_conn
from app.auth import get_current_user_id


router = APIRouter()


class BodyMetricBody(BaseModel):
    weight_kg: float | None = Field(default=None, ge=20, le=400)
    body_fat_pct: float | None = Field(default=None, ge=2, le=70)
    notes: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def _at_least_one(self):
        if self.weight_kg is None and self.body_fat_pct is None:
            raise ValueError("Provide at least weight_kg or body_fat_pct")
        return self


@router.get("/users/me/body-metrics")
async def list_body_metrics(request: Request, limit: int = 100) -> list:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "SELECT id, recorded_at, weight_kg::float, body_fat_pct::float, notes "
                "FROM body_metrics WHERE user_id = %s "
                "ORDER BY recorded_at DESC LIMIT %s",
                (user_id, min(max(limit, 1), 500)),
            )
            rows = await cur.fetchall()
    except Exception as e:
        print(f"[list_body_metrics] DB error: {e}")
        return []
    return [
        {
            "id": str(r[0]),
            "recorded_at": r[1].isoformat() if r[1] else None,
            "weight_kg": r[2],
            "body_fat_pct": r[3],
            "notes": r[4],
        }
        for r in rows
    ]


@router.post("/users/me/body-metrics", status_code=201)
async def create_body_metric(request: Request, body: BodyMetricBody) -> dict:
    user_id = get_current_user_id(request)
    metric_id = str(uuid.uuid4())
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "INSERT INTO body_metrics (id, user_id, weight_kg, body_fat_pct, notes) "
                "VALUES (%s, %s, %s, %s, %s) "
                "RETURNING id, recorded_at, weight_kg::float, body_fat_pct::float, notes",
                (metric_id, user_id, body.weight_kg, body.body_fat_pct, body.notes),
            )
            row = await cur.fetchone()
            await conn.commit()
    except Exception as e:
        print(f"[create_body_metric] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    return {
        "id": str(row[0]),
        "recorded_at": row[1].isoformat(),
        "weight_kg": row[2],
        "body_fat_pct": row[3],
        "notes": row[4],
    }


@router.delete("/users/me/body-metrics/{metric_id}", status_code=204)
async def delete_body_metric(metric_id: uuid.UUID, request: Request) -> None:
    user_id = get_current_user_id(request)
    try:
        async with get_conn() as conn:
            cur = await conn.execute(
                "DELETE FROM body_metrics WHERE id = %s AND user_id = %s RETURNING id",
                (metric_id, user_id),
            )
            if await cur.fetchone() is None:
                raise HTTPException(status_code=404, detail="Metric not found")
            await conn.commit()
    except HTTPException:
        raise
    except Exception as e:
        print(f"[delete_body_metric] DB error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
