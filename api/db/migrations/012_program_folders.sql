-- api/db/migrations/012_program_folders.sql
-- Adds user-managed folders for organizing programs in the library.

CREATE TABLE IF NOT EXISTS program_folders (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_folders_user
    ON program_folders (user_id, created_at DESC);

ALTER TABLE programs
    ADD COLUMN IF NOT EXISTS folder_id UUID
        REFERENCES program_folders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_programs_folder
    ON programs (folder_id) WHERE folder_id IS NOT NULL;

-- RLS — match pattern from 005_rls.sql
ALTER TABLE program_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_folders_select_own" ON program_folders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "program_folders_insert_own" ON program_folders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_folders_update_own" ON program_folders
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "program_folders_delete_own" ON program_folders
  FOR DELETE USING (user_id = auth.uid());
