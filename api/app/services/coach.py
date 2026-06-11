import json
import os
import anthropic
from app.tools.definitions import TOOL_DEFINITIONS
from app.tools.handlers import handle_tool
from app.services.memory import build_base_context

BASE_PROMPT = """You are an AI fitness coach for a mobile/web app.
The user chats with you in text (voice optional). Your replies should feel like a smart friend.

CORE PRINCIPLES
- Adapt to the user's level. Never assume they know jargon. For beginners, give a very brief inline gloss the first time you use a term (e.g. 'markløft (løfte stang fra gulv)'). If there is more worth explaining, OFFER it ("vil du at jeg forklarer mer?") instead of explaining unprompted.
- Safety first. If the user mentions pain (not soreness), dizziness, or injury, stop workout direction and ask one clarifying question.
- Ground yourself in data. Before giving advice about weight or reps, call the appropriate tool.
- Be concise. Keep sentences short. Avoid lists, markdown, or headers in most replies. Max 3 sentences per turn unless the user explicitly asks for detail. When you have more to say, end by offering to elaborate rather than expanding the reply.
- Match the user's language. If they speak Norwegian, reply in Norwegian. If English, English.

TOOLS
You have tools for:
- Reading: get_user_profile, get_workout_history, get_recent_sessions, search_observations, get_progression, get_exercise_info, search_exercises
- Writing: write_observation, log_set_with_note, log_workout (extended), create_program

WHEN TO USE WRITE TOOLS
- write_observation: when you notice something worth remembering for the future — a pattern, a hint about an injury or preference, an energy trend. Be specific and short.
- log_set_with_note: during an active workout when the user describes a set verbally.
- Never modify the user's profile directly. Use write_observation with category="injury_hint" or "preference_hint" and ASK the user before treating it as a profile fact.

WHEN TO USE READ TOOLS
- Call get_workout_history or get_progression BEFORE giving any advice about weight or reps.
- Call search_observations when the user asks about past patterns or themselves.
- Don't call tools unnecessarily — for casual chat or motivation, the base context is enough.

WHAT YOU DO NOT DO
- Do not prescribe medical treatment or diagnose conditions.
- Do not shame the user for missed workouts or eating habits.
- Do not make up exercises, numbers, or research claims. When you mention training or nutrition science, speak in general terms ("a common guideline is...") — never attribute a claim to "research" or "studies", and never state specific numbers as established fact unless a tool gave you that data."""

PERSONA_BLOCKS = {
    "friend": """PERSONALITY: SMART FRIEND
You are warm, knowledgeable, and a little funny. You explain the why behind your advice. You celebrate small wins and push when needed, but never harshly. Avoid drill-sergeant energy or clinical detachment.""",
    "sergeant": """PERSONALITY: DRILL SERGEANT
You are direct, intense, and push hard. Short sentences. High energy. No excuses — but no cruelty. The user opted into this. Still follow safety rules: if the user reports pain, switch to concerned coach mode immediately.""",
    "analyst": """PERSONALITY: DATA ANALYST
You are calm, precise, and quantitative. You reason in numbers: volume, tonnage, RPE trends, progression curves. Assume the user knows or wants to know the jargon. Avoid motivational language or exclamations.""",
}

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


async def chat(messages: list[dict], user_id: str, persona: str = "friend") -> str:
    base_ctx = await build_base_context(user_id)

    system = [
        {
            "type": "text",
            "text": f"{BASE_PROMPT}\n\n{PERSONA_BLOCKS[persona]}",
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": base_ctx,
        },
    ]

    current_messages = list(messages)

    while True:
        response = await client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system=system,
            messages=current_messages,
            tools=TOOL_DEFINITIONS,
        )

        if response.stop_reason == "end_turn":
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return ""

        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = await handle_tool(block.name, block.input, user_id)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    })

            current_messages = current_messages + [
                {"role": "assistant", "content": response.content},
                {"role": "user", "content": tool_results},
            ]


from typing import AsyncGenerator
from app.db import get_conn


async def _ensure_session(user_id: str, session_id: str | None) -> str:
    """Return session id to use. Reuse if recent, else create new."""
    async with get_conn() as conn:
        if session_id:
            cur = await conn.execute(
                "SELECT id FROM coach_sessions "
                "WHERE id = %s AND user_id = %s AND ended_at IS NULL "
                "  AND last_activity_at > now() - interval '30 minutes'",
                (session_id, user_id),
            )
            row = await cur.fetchone()
            if row:
                return session_id

        cur = await conn.execute(
            "INSERT INTO coach_sessions (user_id) VALUES (%s) RETURNING id",
            (user_id,),
        )
        row = await cur.fetchone()
        await conn.commit()
        return row[0]


async def _save_message(session_id: str, role: str, content: dict) -> None:
    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO coach_messages (session_id, role, content) VALUES (%s, %s, %s)",
            (session_id, role, json.dumps(content)),
        )
        await conn.execute(
            "UPDATE coach_sessions SET last_activity_at = now() WHERE id = %s",
            (session_id,),
        )
        await conn.commit()


async def _load_history(session_id: str) -> list[dict]:
    """Return last messages formatted for Anthropic SDK input."""
    async with get_conn() as conn:
        cur = await conn.execute(
            "SELECT role, content FROM coach_messages "
            "WHERE session_id = %s ORDER BY created_at ASC",
            (session_id,),
        )
        rows = await cur.fetchall()

    out: list[dict] = []
    for role, content in rows:
        if isinstance(content, str):
            content = json.loads(content)
        if role == "user":
            out.append({"role": "user", "content": content.get("text", "")})
        elif role == "assistant":
            out.append({"role": "assistant", "content": content.get("text", "")})
    return out


async def chat_stream(
    user_id: str,
    session_id: str | None,
    user_message: str,
    persona: str = "friend",
) -> AsyncGenerator[dict, None]:
    """Async generator yielding SSE events for the chat UI."""
    try:
        sid = await _ensure_session(user_id, session_id)
        yield {"type": "session_id", "id": sid}

        await _save_message(sid, "user", {"text": user_message})

        history = await _load_history(sid)
        base_ctx = await build_base_context(user_id)
        system = [
            {"type": "text", "text": f"{BASE_PROMPT}\n\n{PERSONA_BLOCKS[persona]}",
             "cache_control": {"type": "ephemeral"}},
            {"type": "text", "text": base_ctx},
        ]

        # Add the just-saved user message to current_messages so model sees it
        current_messages = list(history)
        if not current_messages or current_messages[-1].get("role") != "user":
            current_messages.append({"role": "user", "content": user_message})

        assistant_text_accum = ""

        while True:
            tool_uses_in_this_turn: list[dict] = []
            stream_ctx = client.messages.stream(
                model="claude-sonnet-4-5",
                max_tokens=1024,
                system=system,
                messages=current_messages,
                tools=TOOL_DEFINITIONS,
            )

            async with stream_ctx as stream:
                async for event in stream:
                    etype = getattr(event, "type", None)
                    if etype == "content_block_start":
                        block = getattr(event, "content_block", None)
                        if block is not None and getattr(block, "type", None) == "tool_use":
                            tool_uses_in_this_turn.append({
                                "id": block.id,
                                "name": block.name,
                                "input": block.input,
                            })
                    elif etype == "content_block_delta":
                        delta = getattr(event, "delta", None)
                        if delta is not None and getattr(delta, "type", None) == "text_delta":
                            assistant_text_accum += delta.text
                            yield {"type": "text_delta", "text": delta.text}
                    elif etype == "message_stop":
                        break

            if not tool_uses_in_this_turn:
                break

            tool_result_blocks = []
            for tu in tool_uses_in_this_turn:
                yield {
                    "type": "tool_use",
                    "tool_use_id": tu["id"],
                    "name": tu["name"],
                    "input": tu["input"],
                }
                await _save_message(sid, "tool_use", {
                    "tool_use_id": tu["id"],
                    "tool_name": tu["name"],
                    "input": tu["input"],
                })

                try:
                    result = await handle_tool(tu["name"], tu["input"], user_id)
                    ok = not (isinstance(result, dict) and "error" in result)
                except Exception as e:
                    result = {"error": str(e)}
                    ok = False

                yield {
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "name": tu["name"],
                    "ok": ok,
                }
                await _save_message(sid, "tool_result", {
                    "tool_use_id": tu["id"],
                    "tool_name": tu["name"],
                    "result": result,
                    "ok": ok,
                })

                tool_result_blocks.append({
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "content": json.dumps(result),
                })

            current_messages.append({
                "role": "assistant",
                "content": [
                    {"type": "tool_use", "id": tu["id"], "name": tu["name"], "input": tu["input"]}
                    for tu in tool_uses_in_this_turn
                ],
            })
            current_messages.append({"role": "user", "content": tool_result_blocks})

        if assistant_text_accum:
            await _save_message(sid, "assistant", {"text": assistant_text_accum})

        yield {"type": "done"}

    except Exception as e:
        yield {"type": "error", "message": str(e)}
