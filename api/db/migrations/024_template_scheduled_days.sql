-- api/db/migrations/024_template_scheduled_days.sql
-- Ukedager en mal er planlagt på (ISO 1=man .. 7=søn).
-- Se docs/superpowers/specs/2026-06-14-trening-surface-redesign-design.md.
ALTER TABLE workout_templates
  ADD COLUMN IF NOT EXISTS scheduled_days SMALLINT[] NOT NULL DEFAULT '{}';
ALTER TABLE workout_templates
  ADD CONSTRAINT workout_templates_scheduled_days_valid
  CHECK (scheduled_days <@ ARRAY[1,2,3,4,5,6,7]::smallint[]);
