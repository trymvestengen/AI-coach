"""Smoke test for migration 014 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "014_program_day_schedule_and_notes.sql"


def test_migration_014_exists():
    assert MIGRATION.exists()


def test_migration_014_adds_weekdays_column():
    sql = MIGRATION.read_text()
    assert "ALTER TABLE program_days" in sql
    assert "weekdays INTEGER[]" in sql


def test_migration_014_adds_frequency_column():
    sql = MIGRATION.read_text()
    assert "frequency_per_week INTEGER" in sql


def test_migration_014_adds_notes_column():
    sql = MIGRATION.read_text()
    assert "ALTER TABLE program_exercises" in sql
    assert "notes TEXT" in sql


def test_migration_014_is_idempotent():
    sql = MIGRATION.read_text()
    # IF NOT EXISTS clauses make it safe to re-run
    assert sql.count("ADD COLUMN IF NOT EXISTS") >= 3
