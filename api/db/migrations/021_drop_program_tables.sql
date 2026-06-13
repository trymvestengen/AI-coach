-- api/db/migrations/021_drop_program_tables.sql
-- Slett program-modellen etter at data er migrert (020) og app-laget ikke
-- lenger refererer den (9a/9b). Kjøres SIST.
ALTER TABLE workouts DROP COLUMN IF EXISTS program_day_id;
DROP TABLE IF EXISTS program_exercise_sets;
DROP TABLE IF EXISTS program_exercises;
DROP TABLE IF EXISTS program_days;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS program_folders;
