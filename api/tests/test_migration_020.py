"""Smoke test for migration 020 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "020_migrate_programs_to_templates.sql"


def test_exists():
    assert MIGRATION.exists()


def test_maps_programs_to_folders_and_days_to_templates():
    sql = MIGRATION.read_text()
    assert "INSERT INTO template_folders" in sql
    assert "FROM programs" in sql
    assert "INSERT INTO workout_templates" in sql
    assert "FROM program_days" in sql


def test_reuses_source_pks_and_is_idempotent():
    sql = MIGRATION.read_text()
    assert "ON CONFLICT" in sql
    assert "pd.id" in sql


def test_maps_workouts_program_day_to_template():
    sql = MIGRATION.read_text()
    assert "UPDATE workouts" in sql
    assert "template_id = " in sql
    assert "program_day_id" in sql
