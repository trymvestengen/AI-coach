-- 017_memory_tables_rls.sql
-- Enable RLS on memory + coach tables introduced in migration 007. Backend uses
-- the service-role key (which bypasses RLS), but this is defense-in-depth so
-- a leaked anon key cannot read or write other users' data.
--
-- All these tables have a `user_id UUID` column referencing users(id).

ALTER TABLE user_injuries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_equipment      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_constraints    ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_observations  ENABLE ROW LEVEL SECURITY;

-- Per-table FOR ALL policies scoped to the row owner.
-- coach_messages references coach_sessions(session_id); we scope via the parent session's user_id.

CREATE POLICY "user_injuries_own"
  ON user_injuries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_preferences_own"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_equipment_own"
  ON user_equipment FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_constraints_own"
  ON user_constraints FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_sessions_own"
  ON coach_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_observations_own"
  ON coach_observations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_messages_own_via_session"
  ON coach_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM coach_sessions cs
      WHERE cs.id = coach_messages.session_id
        AND cs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_sessions cs
      WHERE cs.id = coach_messages.session_id
        AND cs.user_id = auth.uid()
    )
  );
