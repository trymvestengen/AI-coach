-- api/db/migrations/022_exercise_customs_and_favorites.sql
-- Egne øvelser + favoritter for øvelse-pickeren.
-- Se docs/superpowers/specs/2026-06-14-trening-surface-redesign-design.md.

-- Egne øvelser: nullbar user_id (NULL = seedet/global, non-null = brukerens egen).
ALTER TABLE exercises
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_exercises_user ON exercises (user_id) WHERE user_id IS NOT NULL;

-- RLS (forsvar-i-dybden; backend forbygår, men håndhever user_id i WHERE).
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises_select_global_or_own" ON exercises
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "exercises_insert_own" ON exercises
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "exercises_update_own" ON exercises
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "exercises_delete_own" ON exercises
    FOR DELETE USING (user_id = auth.uid());

-- Favoritter.
CREATE TABLE IF NOT EXISTS user_exercise_favorites (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, exercise_id)
);
ALTER TABLE user_exercise_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uef_select_own" ON user_exercise_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "uef_insert_own" ON user_exercise_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "uef_delete_own" ON user_exercise_favorites FOR DELETE USING (user_id = auth.uid());
