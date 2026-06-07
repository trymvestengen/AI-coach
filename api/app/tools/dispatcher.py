"""Routes tool calls from the coach to the correct handler.

In Task 2, this file is updated to import from the split handler modules
under `app.tools.handlers.*_handlers`. For now it delegates to the
monolithic `handlers` module to preserve behavior during refactor.
"""
from app.tools import handlers as _legacy_handlers


async def handle_tool(user_id: str, name: str, tool_input: dict) -> dict:
    """Route a tool call. Returns dict with 'ok' field plus tool-specific data.

    On unknown tool: {"ok": False, "error": "Unknown tool: ..."}.
    On handler exception: {"ok": False, "error": str(e)}.
    """
    try:
        # Legacy entry point expects (name, tool_input) and ignores user_id internally.
        # Task 2 replaces this with explicit handler lookups that pass user_id.
        result = await _legacy_handlers.handle_tool(name, tool_input)
    except Exception as e:
        return {"ok": False, "error": str(e)}

    # Normalize: legacy handlers return either a dict with data, or {"error": ...}.
    # We standardize on {"ok": bool, ...rest}.
    if isinstance(result, dict) and "error" in result:
        return {"ok": False, **result}
    if isinstance(result, dict):
        return {"ok": True, **result}
    return {"ok": True, "data": result}
