-- Users
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    name        TEXT,
    locale      TEXT NOT NULL DEFAULT 'no',
    persona_mode TEXT NOT NULL DEFAULT 'friend',
    goals       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises (seeded from exercises.json)
CREATE TABLE IF NOT EXISTS exercises (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    muscle_groups TEXT[] NOT NULL,
    equipment     TEXT[] NOT NULL,
    difficulty    TEXT NOT NULL,
    instructions  TEXT,
    source        TEXT
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS workouts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes        TEXT,
    rpe          INTEGER CHECK (rpe BETWEEN 1 AND 10)
);

-- Individual sets within a workout
CREATE TABLE IF NOT EXISTS workout_sets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id  UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    set_number  INTEGER NOT NULL,
    reps        INTEGER,
    weight_kg   NUMERIC(6, 2),
    rpe         INTEGER CHECK (rpe BETWEEN 1 AND 10)
);
