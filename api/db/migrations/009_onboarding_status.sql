-- api/db/migrations/009_onboarding_status.sql
-- Track onboarding completion state per user, and mark coach sessions
-- that were used for onboarding.

ALTER TABLE users
  ADD COLUMN onboarding_status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'complete'));

ALTER TABLE coach_sessions
  ADD COLUMN is_onboarding BOOLEAN NOT NULL DEFAULT false;
