-- api/db/migrations/009_rls_memory.sql
-- Enable RLS + owner-scoped policies on the Lag 1 / Lag 2 tables from migration 007.
-- Those tables shipped without RLS (security audit K3, docs/follow-ups/security-audit.md):
-- with RLS off, any authenticated user could read/write every other user's health data
-- and private coach conversations via the Supabase data API. Same per-verb style as 005.

-- ────────────────────────────────────────────
-- Enable RLS on all user-owned memory tables
-- ────────────────────────────────────────────
ALTER TABLE user_injuries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_constraints   ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_observations ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────────────
-- user_injuries: own rows
-- ────────────────────────────────────────────
CREATE POLICY "user_injuries_select_own" ON user_injuries
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_injuries_insert_own" ON user_injuries
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_injuries_update_own" ON user_injuries
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_injuries_delete_own" ON user_injuries
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- user_preferences: own rows
-- ────────────────────────────────────────────
CREATE POLICY "user_preferences_select_own" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_preferences_insert_own" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_update_own" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_preferences_delete_own" ON user_preferences
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- user_equipment: own rows (composite PK user_id, equipment)
-- ────────────────────────────────────────────
CREATE POLICY "user_equipment_select_own" ON user_equipment
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_equipment_insert_own" ON user_equipment
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_equipment_update_own" ON user_equipment
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_equipment_delete_own" ON user_equipment
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- user_constraints: own rows
-- ────────────────────────────────────────────
CREATE POLICY "user_constraints_select_own" ON user_constraints
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_constraints_insert_own" ON user_constraints
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_constraints_update_own" ON user_constraints
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_constraints_delete_own" ON user_constraints
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- coach_sessions: own rows
-- ────────────────────────────────────────────
CREATE POLICY "coach_sessions_select_own" ON coach_sessions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "coach_sessions_insert_own" ON coach_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "coach_sessions_update_own" ON coach_sessions
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "coach_sessions_delete_own" ON coach_sessions
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- coach_messages: messages belonging to own sessions
-- (no user_id column — scoped through the parent coach_sessions)
-- ────────────────────────────────────────────
CREATE POLICY "coach_messages_select_own" ON coach_messages
  FOR SELECT USING (
    session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "coach_messages_insert_own" ON coach_messages
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "coach_messages_update_own" ON coach_messages
  FOR UPDATE USING (
    session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid())
  ) WITH CHECK (
    session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "coach_messages_delete_own" ON coach_messages
  FOR DELETE USING (
    session_id IN (SELECT id FROM coach_sessions WHERE user_id = auth.uid())
  );

-- ────────────────────────────────────────────
-- coach_observations: own rows
-- ────────────────────────────────────────────
CREATE POLICY "coach_observations_select_own" ON coach_observations
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "coach_observations_insert_own" ON coach_observations
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "coach_observations_update_own" ON coach_observations
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "coach_observations_delete_own" ON coach_observations
  FOR DELETE USING (user_id = auth.uid());
