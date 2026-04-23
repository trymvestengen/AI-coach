-- Seed: 3-dagers styrkeprogram for test user
INSERT INTO programs (id, user_id, name, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '3-dagers styrkeprogram',
    true
)
ON CONFLICT (id) DO NOTHING;

-- Day 1: Ben
INSERT INTO program_days (id, program_id, day_number, name)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 1, 'Ben')
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercises (program_day_id, exercise_id, sets, reps, weight_kg, order_index) VALUES
('00000000-0000-0000-0000-000000000010', 'squat',             4, 5,  80, 0),
('00000000-0000-0000-0000-000000000010', 'leg-press',         3, 10, 100, 1),
('00000000-0000-0000-0000-000000000010', 'lunge',             3, 12, 20, 2),
('00000000-0000-0000-0000-000000000010', 'romanian-deadlift', 3, 10, 60, 3)
ON CONFLICT ON CONSTRAINT uq_program_exercise_order DO NOTHING;

-- Day 2: Overkropp
INSERT INTO program_days (id, program_id, day_number, name)
VALUES ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', 2, 'Overkropp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercises (program_day_id, exercise_id, sets, reps, weight_kg, order_index) VALUES
('00000000-0000-0000-0000-000000000011', 'bench-press',     4, 5,  70, 0),
('00000000-0000-0000-0000-000000000011', 'overhead-press',  3, 8,  50, 1),
('00000000-0000-0000-0000-000000000011', 'dumbbell-row',    3, 10, 30, 2),
('00000000-0000-0000-0000-000000000011', 'bicep-curl',      3, 12, 15, 3),
('00000000-0000-0000-0000-000000000011', 'tricep-pushdown', 3, 12, 20, 4)
ON CONFLICT ON CONSTRAINT uq_program_exercise_order DO NOTHING;

-- Day 3: Helkropp
INSERT INTO program_days (id, program_id, day_number, name)
VALUES ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', 3, 'Helkropp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO program_exercises (program_day_id, exercise_id, sets, reps, weight_kg, order_index) VALUES
('00000000-0000-0000-0000-000000000012', 'deadlift',     4, 5,  100, 0),
('00000000-0000-0000-0000-000000000012', 'pull-up',      3, 8,  null, 1),
('00000000-0000-0000-0000-000000000012', 'lat-pulldown', 3, 10, 60,  2),
('00000000-0000-0000-0000-000000000012', 'face-pull',    3, 15, 20,  3),
('00000000-0000-0000-0000-000000000012', 'dip',          3, 10, null, 4)
ON CONFLICT ON CONSTRAINT uq_program_exercise_order DO NOTHING;
