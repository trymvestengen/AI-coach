-- 016_body_metrics.sql
-- Track body weight, body fat %, and optional notes over time.
-- One row per measurement; user can log as often as they like.

CREATE TABLE IF NOT EXISTS body_metrics (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    weight_kg    NUMERIC(5, 2),
    body_fat_pct NUMERIC(4, 2),
    notes        TEXT,
    CONSTRAINT bm_has_value CHECK (weight_kg IS NOT NULL OR body_fat_pct IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date
  ON body_metrics(user_id, recorded_at DESC);

COMMENT ON TABLE body_metrics IS 'User-logged body measurements (weight, body fat %).';
