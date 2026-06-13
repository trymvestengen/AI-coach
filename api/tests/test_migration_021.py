"""Smoke test for migration 021 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "021_drop_program_tables.sql"


def test_exists():
    assert MIGRATION.exists()


def test_drops_program_tables_and_column():
    sql = MIGRATION.read_text()
    assert "DROP COLUMN IF EXISTS program_day_id" in sql
    for table in ("programs", "program_days", "program_exercises", "program_exercise_sets", "program_folders"):
        assert f"DROP TABLE IF EXISTS {table}" in sql
