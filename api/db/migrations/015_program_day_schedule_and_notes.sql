-- api/db/migrations/015_program_day_schedule_and_notes.sql
--
-- Adds schedule fields to program_days (for build-from-scratch wizard) and
-- a notes column on program_exercises (per-exercise notes in programs).
--
-- weekdays: array of Postgres DOW integers (0=Sunday, 6=Saturday).
-- frequency_per_week: alternative — pick a count instead of specific days.
-- The two are mutually exclusive in the application layer; we do not enforce
-- with a CHECK constraint to keep migrations forward-compatible.

ALTER TABLE program_days
  ADD COLUMN IF NOT EXISTS weekdays INTEGER[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS frequency_per_week INTEGER;

ALTER TABLE program_exercises
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN program_days.weekdays IS
  'Array of weekday integers (0=Sunday, 6=Saturday). Empty = no specific days.';
COMMENT ON COLUMN program_days.frequency_per_week IS
  'Alternative to weekdays: just count per week. Null when weekdays is used.';
COMMENT ON COLUMN program_exercises.notes IS
  'Optional per-exercise note in a program (e.g. tempo cues, form notes).';
