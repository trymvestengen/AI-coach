-- api/db/migrations/013_workouts_program_day.sql
-- Track which program day a workout was started from, so we can render the
-- correct exercises in the workout-run screen.

ALTER TABLE workouts
    ADD COLUMN IF NOT EXISTS program_day_id UUID
        REFERENCES program_days(id) ON DELETE SET NULL;
