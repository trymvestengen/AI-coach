"""Smoke test for migration 016 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "016_program_exercise_sets_notes.sql"


def test_migration_016_exists():
    assert MIGRATION.exists()


def test_migration_016_adds_notes_column():
    sql = MIGRATION.read_text()
    assert "ALTER TABLE program_exercise_sets" in sql
    assert "notes TEXT" in sql
    assert "ADD COLUMN IF NOT EXISTS" in sql
