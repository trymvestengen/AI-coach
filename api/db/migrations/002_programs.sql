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
    name       TEXT NOT NULL,
    CONSTRAINT uq_program_day UNIQUE (program_id, day_number)
);

CREATE TABLE IF NOT EXISTS program_exercises (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_day_id UUID NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
    exercise_id    TEXT NOT NULL REFERENCES exercises(id),
    sets           INTEGER NOT NULL CHECK (sets > 0),
    reps           INTEGER NOT NULL CHECK (reps > 0),
    weight_kg      NUMERIC(6, 2),
    order_index    INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_program_exercise_order UNIQUE (program_day_id, order_index)
);
