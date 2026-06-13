"""Routes tool calls from the coach to the correct handler."""
from app.tools.handlers import (
    template_handlers,
    folder_handlers,
    workout_handlers,
    read_handlers,
    memory_handlers,
    profile_handlers,
    injury_handlers,
    equipment_handlers,
    preference_handlers,
    constraint_handlers,
    social_handlers,
    body_metric_handlers,
)


HANDLERS = {
    # Templates (write)
    "create_template": template_handlers.create_template,
    "update_template": template_handlers.update_template,
    "delete_template": template_handlers.delete_template,
    "add_exercise_to_template": template_handlers.add_exercise_to_template,
    "remove_exercise_from_template": template_handlers.remove_exercise_from_template,
    "swap_exercise_in_template": template_handlers.swap_exercise_in_template,
    "update_exercise_sets": template_handlers.update_exercise_sets,
    # Folders (write)
    "create_folder": folder_handlers.create_folder,
    "rename_folder": folder_handlers.rename_folder,
    "delete_folder": folder_handlers.delete_folder,
    "list_folders": folder_handlers.list_folders,
    # Workouts (write)
    "log_workout": workout_handlers.log_workout,
    "log_set_with_note": workout_handlers.log_set_with_note,
    "start_workout_from_day": workout_handlers.start_workout_from_day,
    "complete_workout": workout_handlers.complete_workout,
    "discard_workout": workout_handlers.discard_workout,
    "swap_active_workout_exercise": workout_handlers.swap_active_workout_exercise,
    "add_active_workout_exercise": workout_handlers.add_active_workout_exercise,
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
    # Profile
    "update_user_profile": profile_handlers.update_user_profile,
    "set_persona_mode": profile_handlers.set_persona_mode,
    # Injuries
    "add_injury": injury_handlers.add_injury,
    "update_injury": injury_handlers.update_injury,
    "remove_injury": injury_handlers.remove_injury,
    # Equipment
    "add_equipment": equipment_handlers.add_equipment,
    "remove_equipment": equipment_handlers.remove_equipment,
    # Preferences
    "add_preference": preference_handlers.add_preference,
    "remove_preference": preference_handlers.remove_preference,
    # Constraints
    "add_constraint": constraint_handlers.add_constraint,
    "remove_constraint": constraint_handlers.remove_constraint,
    # Social
    "share_workout": social_handlers.share_workout,
    # Body metrics + stats
    "log_body_metric": body_metric_handlers.log_body_metric,
    "get_body_metrics": body_metric_handlers.get_body_metrics,
    "get_user_stats": body_metric_handlers.get_user_stats,
}


async def handle_tool(user_id: str, name: str, tool_input: dict) -> dict:
    handler = HANDLERS.get(name)
    if handler is None:
        print(f"[dispatcher] Unknown tool: {name}")
        return {"ok": False, "error": f"Unknown tool: {name}"}
    try:
        result = await handler(user_id, **tool_input)
        if isinstance(result, dict) and result.get("ok") is False:
            print(f"[dispatcher] {name} returned not-ok: {result.get('error')}")
        return result
    except TypeError as e:
        print(f"[dispatcher] {name} TypeError: {e} | input={tool_input}")
        return {"ok": False, "error": f"Invalid arguments: {e}"}
    except Exception as e:
        # Logg detaljer internt; aldri str(e) videre — den kan inneholde
        # interne detaljer som modellen kan gjenta til brukeren (jf. M1).
        print(f"[dispatcher] {name} EXCEPTION: {e!r} | input={tool_input}")
        return {"ok": False, "error": "tool execution failed"}
