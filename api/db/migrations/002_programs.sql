-- api/db/migrations/002_programs.sql
CREATE TABLE IF NOT EXISTS programs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id),
    name       TEXT NOT NULL,
    is_active  BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_days (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    name       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS program_exercises (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_day_id UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
    exercise_id    TEXT NOT NULL REFERENCES exercises(id),
    sets           INTEGER NOT NULL,
    reps           INTEGER NOT NULL,
    weight_kg      NUMERIC(6, 2),
    order_index    INTEGER NOT NULL DEFAULT 0
);
