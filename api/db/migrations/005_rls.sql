-- api/db/migrations/005_rls.sql

-- ────────────────────────────────────────────
-- Enable RLS on all user-owned tables
-- ────────────────────────────────────────────
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_days         ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_exercises    ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_exercise_sets ENABLE ROW LEVEL SECURITY;

-- exercises is a shared public library — no RLS needed

-- ────────────────────────────────────────────
-- users: own row only (no DELETE — rows are never deleted via API)
-- ────────────────────────────────────────────
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_insert_own" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- ────────────────────────────────────────────
-- workouts: own rows
-- ────────────────────────────────────────────
CREATE POLICY "workouts_select_own" ON workouts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "workouts_insert_own" ON workouts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "workouts_update_own" ON workouts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "workouts_delete_own" ON workouts
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- workout_sets: sets belonging to own workouts
-- ────────────────────────────────────────────
CREATE POLICY "workout_sets_select_own" ON workout_sets
  FOR SELECT USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "workout_sets_insert_own" ON workout_sets
  FOR INSERT WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "workout_sets_update_own" ON workout_sets
  FOR UPDATE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

CREATE POLICY "workout_sets_delete_own" ON workout_sets
  FOR DELETE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
  );

-- ────────────────────────────────────────────
-- programs: own rows
-- ────────────────────────────────────────────
CREATE POLICY "programs_select_own" ON programs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "programs_insert_own" ON programs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "programs_update_own" ON programs
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "programs_delete_own" ON programs
  FOR DELETE USING (user_id = auth.uid());

-- ────────────────────────────────────────────
-- program_days: days belonging to own programs
-- ────────────────────────────────────────────
CREATE POLICY "program_days_select_own" ON program_days
  FOR SELECT USING (
    program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())
  );

CREATE POLICY "program_days_insert_own" ON program_days
  FOR INSERT WITH CHECK (
    program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())
  );

CREATE POLICY "program_days_update_own" ON program_days
  FOR UPDATE USING (
    program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())
  );

CREATE POLICY "program_days_delete_own" ON program_days
  FOR DELETE USING (
    program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())
  );

-- ────────────────────────────────────────────
-- program_exercises: exercises belonging to own program days
-- ────────────────────────────────────────────
CREATE POLICY "program_exercises_select_own" ON program_exercises
  FOR SELECT USING (
    program_day_id IN (
      SELECT pd.id FROM program_days pd
      JOIN programs p ON p.id = pd.program_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "program_exercises_insert_own" ON program_exercises
  FOR INSERT WITH CHECK (
    program_day_id IN (
      SELECT pd.id FROM program_days pd
      JOIN programs p ON p.id = pd.program_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "program_exercises_update_own" ON program_exercises
  FOR UPDATE USING (
    program_day_id IN (
      SELECT pd.id FROM program_days pd
      JOIN programs p ON p.id = pd.program_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "program_exercises_delete_own" ON program_exercises
  FOR DELETE USING (
    program_day_id IN (
      SELECT pd.id FROM program_days pd
      JOIN programs p ON p.id = pd.program_id
      WHERE p.user_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────
-- program_exercise_sets: sets belonging to own program exercises
-- ────────────────────────────────────────────
CREATE POLICY "program_exercise_sets_select_own" ON program_exercise_sets
  FOR SELECT USING (
    program_exercise_id IN (
      SELECT pe.id FROM program_exercises pe
      JOIN program_days pd ON pd.id = pe.program_day_id
      JOIN programs p ON p.id = pd.program_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "program_exercise_sets_insert_own" ON program_exercise_sets
  FOR INSERT WITH CHECK (
    program_exercise_id IN (
      SELECT pe.id FROM program_exercises pe
      JOIN program_days pd ON pd.id = pe.program_day_id
      JOIN programs p ON p.id = pd.program_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "program_exercise_sets_update_own" ON program_exercise_sets
  FOR UPDATE USING (
    program_exercise_id IN (
      SELECT pe.id FROM program_exercises pe
      JOIN program_days pd ON pd.id = pe.program_day_id
      JOIN programs p ON p.id = pd.program_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "program_exercise_sets_delete_own" ON program_exercise_sets
  FOR DELETE USING (
    program_exercise_id IN (
      SELECT pe.id FROM program_exercises pe
      JOIN program_days pd ON pd.id = pe.program_day_id
      JOIN programs p ON p.id = pd.program_id
      WHERE p.user_id = auth.uid()
    )
  );
