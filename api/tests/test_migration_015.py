"""Smoke test for migration 015 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "015_program_exercise_sets_notes.sql"


def test_migration_015_exists():
    assert MIGRATION.exists()


def test_migration_015_adds_notes_column():
    sql = MIGRATION.read_text()
    assert "ALTER TABLE program_exercise_sets" in sql
    assert "notes TEXT" in sql
    assert "ADD COLUMN IF NOT EXISTS" in sql
