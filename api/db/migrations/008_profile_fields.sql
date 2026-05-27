-- api/db/migrations/008_profile_fields.sql
-- Add 4 new fields to users for finer-grained coach context.

ALTER TABLE users
  ADD COLUMN activity_level             TEXT,
  ADD COLUMN years_training             INTEGER,
  ADD COLUMN preferred_training_time    TEXT,
  ADD COLUMN max_session_duration_min   INTEGER;
