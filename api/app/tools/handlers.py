import json
from pathlib import Path

_exercises: list[dict] | None = None


def _load_exercises() -> list[dict]:
    global _exercises
    if _exercises is None:
        data_path = Path(__file__).parent.parent / "data" / "exercises.json"
        with open(data_path) as f:
            _exercises = json.load(f)
    return _exercises


def get_exercise_info(exercise_id: str) -> dict:
    for ex in _load_exercises():
        if ex["id"] == exercise_id:
            return ex
    return {"error": f"Exercise '{exercise_id}' not found"}


def search_exercises(
    muscle_group: str | None = None,
    equipment: str | None = None,
    difficulty: str | None = None,
) -> list[dict]:
    results = _load_exercises()
    if muscle_group:
        results = [e for e in results if any(muscle_group.lower() in mg.lower() for mg in e["muscle_groups"])]
    if equipment:
        results = [e for e in results if any(equipment.lower() in eq.lower() for eq in e["equipment"])]
    if difficulty:
        results = [e for e in results if e["difficulty"] == difficulty]
    return [{"id": e["id"], "name": e["name"], "muscle_groups": e["muscle_groups"], "difficulty": e["difficulty"]} for e in results]


def create_program(goal: str, days_per_week: int, equipment: str, experience_level: str) -> dict:
    return {
        "name": f"{days_per_week}-day {goal} program",
        "goal": goal,
        "days_per_week": days_per_week,
        "equipment": equipment,
        "experience_level": experience_level,
        "note": "Program structure created. Describing exercises for each day now.",
    }


def handle_tool(name: str, inputs: dict) -> dict | list:
    if name == "get_exercise_info":
        return get_exercise_info(**inputs)
    if name == "search_exercises":
        return search_exercises(**inputs)
    if name == "create_program":
        return create_program(**inputs)
    return {"error": f"Unknown tool: {name}"}
