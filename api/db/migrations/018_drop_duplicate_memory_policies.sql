-- api/db/migrations/018_drop_duplicate_memory_policies.sql
-- Rydder bort dupliserte RLS-policies på minne-tabellene: både 009_rls_memory
-- (per-verb-policies, fra security-audit K3 på main) og branchens tidligere
-- 017_memory_tables_rls (FOR ALL-policies) ble applisert i prod. Begge har
-- identisk eierskap-scoping; per-verb-settet fra 009 beholdes som dokumentert
-- fasit, FOR ALL-duplikatene droppes.

DROP POLICY IF EXISTS "user_injuries_own"              ON user_injuries;
DROP POLICY IF EXISTS "user_preferences_own"           ON user_preferences;
DROP POLICY IF EXISTS "user_equipment_own"             ON user_equipment;
DROP POLICY IF EXISTS "user_constraints_own"           ON user_constraints;
DROP POLICY IF EXISTS "coach_sessions_own"             ON coach_sessions;
DROP POLICY IF EXISTS "coach_observations_own"         ON coach_observations;
DROP POLICY IF EXISTS "coach_messages_own_via_session" ON coach_messages;
