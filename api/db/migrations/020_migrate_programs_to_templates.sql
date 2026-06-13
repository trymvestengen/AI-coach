-- api/db/migrations/020_migrate_programs_to_templates.sql
-- Flytt eksisterende program-data til mal-modellen (kun testdata i prod).
-- Hvert program -> en mappe; hver program_day -> en mal. PK-er gjenbrukes
-- så workouts.program_day_id mapper rett til template_id. Idempotent.

INSERT INTO template_folders (id, user_id, name, position, created_at)
SELECT p.id, p.user_id, p.name, 0, NOW()
FROM programs p
ON CONFLICT (id) DO NOTHING;

INSERT INTO workout_templates (id, user_id, name, folder_id, position, created_at)
SELECT pd.id, p.user_id, pd.name, p.id, COALESCE(pd.day_number, 0), NOW()
FROM program_days pd
JOIN programs p ON p.id = pd.program_id
ON CONFLICT (id) DO NOTHING;

INSERT INTO template_exercises (id, template_id, exercise_id, position, notes)
SELECT pe.id, pe.program_day_id, pe.exercise_id, COALESCE(pe.order_index, 0), pe.notes
FROM program_exercises pe
ON CONFLICT (id) DO NOTHING;

INSERT INTO template_exercise_sets (id, template_exercise_id, set_number, reps, weight_kg, notes)
SELECT pes.id, pes.program_exercise_id, pes.set_number, pes.reps, pes.weight_kg, pes.notes
FROM program_exercise_sets pes
ON CONFLICT (id) DO NOTHING;

UPDATE workouts w
SET template_id = w.program_day_id
WHERE w.program_day_id IS NOT NULL
  AND w.template_id IS NULL
  AND EXISTS (SELECT 1 FROM workout_templates t WHERE t.id = w.program_day_id);
