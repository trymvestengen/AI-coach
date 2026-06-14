-- api/db/migrations/023_workout_sets_unique.sql
-- Unik-constraint så log_set kan UPSERT (oppdatere et sett ved re-logging i
-- stedet for å duplisere). Se 2026-06-14-trening-surface-redesign-design.md.
DELETE FROM workout_sets a USING workout_sets b
  WHERE a.ctid > b.ctid
    AND a.workout_id = b.workout_id
    AND a.exercise_id = b.exercise_id
    AND a.set_number = b.set_number;
ALTER TABLE workout_sets
  ADD CONSTRAINT workout_sets_unique_per_set
  UNIQUE (workout_id, exercise_id, set_number);
