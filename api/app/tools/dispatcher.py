"""Routes tool calls from the coach to the correct handler."""
from app.tools.handlers import (
    program_handlers,
    folder_handlers,  # NEW
    workout_handlers,
    read_handlers,
    memory_handlers,
)


HANDLERS = {
    # Programs (write)
    "create_program": program_handlers.create_program,
    "update_program": program_handlers.update_program,
    "delete_program": program_handlers.delete_program,
    "add_program_day": program_handlers.add_program_day,
    "remove_program_day": program_handlers.remove_program_day,
    "rename_program_day": program_handlers.rename_program_day,
    "add_exercise_to_day": program_handlers.add_exercise_to_day,
    "remove_exercise_from_day": program_handlers.remove_exercise_from_day,
    "swap_exercise_in_day": program_handlers.swap_exercise_in_day,
    "update_exercise_sets": program_handlers.update_exercise_sets,
    # Folders (write)
    "create_folder": folder_handlers.create_folder,
    "rename_folder": folder_handlers.rename_folder,
    "delete_folder": folder_handlers.delete_folder,
    "list_folders": folder_handlers.list_folders,
    # Workouts (write)
    "log_workout": workout_handlers.log_workout,
    "log_set_with_note": workout_handlers.log_set_with_note,
    # Read-only
    "get_exercise_info": read_handlers.get_exercise_info,
    "search_exercises": read_handlers.search_exercises,
    "get_user_history": read_handlers.get_user_history,
    "suggest_progression": read_handlers.suggest_progression,
    "get_progression": read_handlers.get_progression,
    "get_workout_history": read_handlers.get_workout_history,
    # Memory (read + write)
    "get_user_profile": memory_handlers.get_user_profile,
    "write_observation": memory_handlers.write_observation,
    "search_observations": memory_handlers.search_observations,
    "get_recent_sessions": memory_handlers.get_recent_sessions,
}


async def handle_tool(user_id: str, name: str, tool_input: dict) -> dict:
    handler = HANDLERS.get(name)
    if handler is None:
        return {"ok": False, "error": f"Unknown tool: {name}"}
    try:
        return await handler(user_id, **tool_input)
    except TypeError as e:
        return {"ok": False, "error": f"Invalid arguments: {e}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
