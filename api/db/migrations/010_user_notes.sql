-- api/db/migrations/010_user_notes.sql
-- Free-text notes captured during onboarding for injuries and preferences.
-- Coach can reference these via get_user_profile; user can edit via Profile-tab later.

ALTER TABLE users
  ADD COLUMN injury_notes      TEXT,
  ADD COLUMN preference_notes  TEXT;
