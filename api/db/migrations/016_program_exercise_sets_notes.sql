-- Adds per-set notes to program_exercise_sets so users can annotate individual
-- sets in their programs (e.g. "warmup", "felt heavy", "drop set").

ALTER TABLE program_exercise_sets
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN program_exercise_sets.notes IS
  'Optional per-set note (e.g. warmup, RPE, form notes).';
