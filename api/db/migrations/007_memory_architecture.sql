-- api/db/migrations/007_memory_architecture.sql
-- Lag 1 (Profile) + Lag 2 (Coach memory) per docs/superpowers/specs/2026-05-27-memory-architecture-design.md

-- ============================================================
-- LAG 1: Profile (user-curated)
-- ============================================================

CREATE TABLE user_injuries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body_part    TEXT NOT NULL,
  description  TEXT,
  severity     TEXT,
  started_at   DATE,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_injuries_active ON user_injuries(user_id, is_active);

CREATE TABLE user_preferences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category     TEXT NOT NULL,
  preference   TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

CREATE TABLE user_equipment (
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  equipment    TEXT NOT NULL,
  PRIMARY KEY (user_id, equipment)
);

CREATE TABLE user_constraints (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  description  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_constraints_user ON user_constraints(user_id);

-- ============================================================
-- LAG 2: Coach memory (AI-curated)
-- ============================================================

-- Add coach notes to existing tables (backwards-compatible — both nullable)
ALTER TABLE workout_sets ADD COLUMN coach_note TEXT;
ALTER TABLE workouts ADD COLUMN coach_summary TEXT;

-- Coach session = logical group of messages
CREATE TABLE coach_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  summary          TEXT,
  workout_id       UUID REFERENCES workouts(id)
);

CREATE INDEX idx_coach_sessions_user_activity ON coach_sessions(user_id, last_activity_at DESC);

-- Chat messages
CREATE TABLE coach_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES coach_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool_use', 'tool_result')),
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coach_messages_session ON coach_messages(session_id, created_at);

-- Coach observations
CREATE TABLE coach_observations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category           TEXT NOT NULL CHECK (category IN (
    'pattern', 'injury_hint', 'preference_hint', 'energy_level',
    'form_issue', 'milestone', 'other'
  )),
  observation        TEXT NOT NULL,
  confidence         TEXT CHECK (confidence IN ('low', 'medium', 'high')),
  source_session_id  UUID REFERENCES coach_sessions(id) ON DELETE SET NULL,
  source_workout_id  UUID REFERENCES workouts(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_confirmed_at  TIMESTAMPTZ,
  is_promoted        BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_coach_observations_user_category ON coach_observations(user_id, category, created_at DESC);
CREATE INDEX idx_coach_observations_workout ON coach_observations(user_id, source_workout_id);
