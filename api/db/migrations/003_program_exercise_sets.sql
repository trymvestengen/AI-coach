-- 003_program_exercise_sets.sql
CREATE TABLE IF NOT EXISTS program_exercise_sets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_exercise_id UUID NOT NULL REFERENCES program_exercises(id) ON DELETE CASCADE,
    set_number          INTEGER NOT NULL,
    reps                INTEGER NOT NULL CHECK (reps > 0),
    weight_kg           NUMERIC(6, 2),
    CONSTRAINT uq_exercise_set_order UNIQUE (program_exercise_id, set_number)
);

-- Migrate existing aggregate rows into individual set rows
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'program_exercises' AND column_name = 'sets'
    ) THEN
        INSERT INTO program_exercise_sets (program_exercise_id, set_number, reps, weight_kg)
        SELECT
            pe.id,
            generate_series(1, pe.sets) AS set_number,
            pe.reps,
            pe.weight_kg
        FROM program_exercises pe
        WHERE pe.sets > 0
        ON CONFLICT ON CONSTRAINT uq_exercise_set_order DO NOTHING;
    END IF;
END $$;

-- Drop aggregate columns superseded by program_exercise_sets
ALTER TABLE program_exercises DROP COLUMN IF EXISTS sets;
ALTER TABLE program_exercises DROP COLUMN IF EXISTS reps;
ALTER TABLE program_exercises DROP COLUMN IF EXISTS weight_kg;
