-- api/db/migrations/019_workout_templates.sql
-- Strong-modell: flate "økt-maler" erstatter program→dager→øvelser.
-- Se docs/superpowers/specs/2026-06-13-trening-templates-design.md.
-- Per-verb RLS-policies som 005_rls.sql / 012_program_folders.sql.

CREATE TABLE IF NOT EXISTS template_folders (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
    position   INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_template_folders_user ON template_folders (user_id, position);

CREATE TABLE IF NOT EXISTS workout_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
    folder_id   UUID REFERENCES template_folders(id) ON DELETE SET NULL,
    position    INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user ON workout_templates (user_id, position);
CREATE INDEX IF NOT EXISTS idx_workout_templates_folder ON workout_templates (folder_id) WHERE folder_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS template_exercises (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    position    INT NOT NULL DEFAULT 0,
    notes       TEXT
);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises (template_id, position);

CREATE TABLE IF NOT EXISTS template_exercise_sets (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_exercise_id UUID NOT NULL REFERENCES template_exercises(id) ON DELETE CASCADE,
    set_number           INT NOT NULL,
    reps                 INT,
    weight_kg            NUMERIC,
    notes                TEXT
);
CREATE INDEX IF NOT EXISTS idx_template_exercise_sets_te ON template_exercise_sets (template_exercise_id, set_number);

ALTER TABLE workouts
    ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_workouts_template ON workouts (template_id) WHERE template_id IS NOT NULL;

-- RLS ------------------------------------------------------------------
ALTER TABLE template_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercise_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_folders_select_own" ON template_folders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "template_folders_insert_own" ON template_folders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "template_folders_update_own" ON template_folders FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "template_folders_delete_own" ON template_folders FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "workout_templates_select_own" ON workout_templates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "workout_templates_insert_own" ON workout_templates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "workout_templates_update_own" ON workout_templates FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "workout_templates_delete_own" ON workout_templates FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "template_exercises_all_own" ON template_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_templates t WHERE t.id = template_exercises.template_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_templates t WHERE t.id = template_exercises.template_id AND t.user_id = auth.uid()));

CREATE POLICY "template_exercise_sets_all_own" ON template_exercise_sets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM template_exercises te JOIN workout_templates t ON t.id = te.template_id
    WHERE te.id = template_exercise_sets.template_exercise_id AND t.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM template_exercises te JOIN workout_templates t ON t.id = te.template_id
    WHERE te.id = template_exercise_sets.template_exercise_id AND t.user_id = auth.uid()));
