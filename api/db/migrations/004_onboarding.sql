-- api/db/migrations/004_onboarding.sql

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name              TEXT,
  ADD COLUMN IF NOT EXISTS last_name               TEXT,
  ADD COLUMN IF NOT EXISTS experience_level        TEXT,
  ADD COLUMN IF NOT EXISTS training_days_per_week  INTEGER,
  ADD COLUMN IF NOT EXISTS gender                  TEXT,
  ADD COLUMN IF NOT EXISTS height_cm               INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg               NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS birth_date              DATE,
  ADD COLUMN IF NOT EXISTS avatar_url              TEXT;

-- Change goals from TEXT to TEXT[] so multi-select values can be stored
ALTER TABLE users
  ALTER COLUMN goals TYPE TEXT[]
  USING CASE WHEN goals IS NULL THEN NULL ELSE ARRAY[goals] END;
