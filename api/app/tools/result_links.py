"""Builds tappable result-link dicts attached to tool_result stream events.

Only tools that produce a navigable entity (program, workout) get a link.
Other tools return None.
"""


def build(tool_name: str, handler_output: dict) -> dict | None:
    if not handler_output.get("ok"):
        return None

    if tool_name == "create_program":
        pid = handler_output.get("program_id")
        name = handler_output.get("name") or "program"
        if pid:
            return {"label": f"Se {name}", "href": f"/program/{pid}"}

    if tool_name == "start_workout_from_day":
        wid = handler_output.get("workout_id")
        if wid:
            return {"label": "Åpne", "href": f"/program/workout/{wid}"}

    if tool_name == "log_workout":
        wid = handler_output.get("workout_id")
        if wid:
            return {"label": "Se økt", "href": f"/program/workout/{wid}"}

    if tool_name == "share_workout":
        return {"label": "Se feed", "href": "/social"}

    return None
