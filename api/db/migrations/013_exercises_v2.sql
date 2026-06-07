-- api/db/migrations/013_exercises_v2.sql
-- Adds Free Exercise DB fields to the exercises table.
-- See docs/superpowers/specs/2026-06-06-exercise-library-upgrade-design.md.

ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS force            TEXT,
    ADD COLUMN IF NOT EXISTS mechanic         TEXT,
    ADD COLUMN IF NOT EXISTS category         TEXT,
    ADD COLUMN IF NOT EXISTS primary_muscles  TEXT[],
    ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[],
    ADD COLUMN IF NOT EXISTS image_urls       TEXT[];
