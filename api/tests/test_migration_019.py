"""Smoke test for migration 019 SQL content."""
from pathlib import Path

MIGRATION = Path(__file__).parent.parent / "db" / "migrations" / "019_workout_templates.sql"


def test_migration_019_exists():
    assert MIGRATION.exists()


def test_creates_template_tables():
    sql = MIGRATION.read_text()
    for table in ("template_folders", "workout_templates", "template_exercises", "template_exercise_sets"):
        assert f"CREATE TABLE IF NOT EXISTS {table}" in sql


def test_adds_template_id_to_workouts():
    sql = MIGRATION.read_text()
    assert "ALTER TABLE workouts" in sql
    assert "template_id" in sql


def test_enables_rls_on_all_new_tables():
    sql = MIGRATION.read_text()
    for table in ("template_folders", "workout_templates", "template_exercises", "template_exercise_sets"):
        assert f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY" in sql
    assert "workout_templates t" in sql
