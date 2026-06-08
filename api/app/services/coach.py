import json
import os
import anthropic
from app.tools.definitions import TOOL_DEFINITIONS
from app.tools.dispatcher import handle_tool
from app.tools import result_links
from app.services.memory import build_base_context

BASE_PROMPT = """You are an AI fitness coach for a mobile/web app.
The user chats with you in text (voice optional). Your replies should feel like a smart friend.

CORE PRINCIPLES
- Adapt to the user's level. Never assume they know jargon — define it the first time you use it.
- Safety first. If the user mentions pain (not soreness), dizziness, or injury, stop workout direction and ask one clarifying question.
- Ground yourself in data. Before giving advice about weight or reps, call the appropriate tool.
- BE BRUTALLY CONCISE. Max 3 sentences per turn. NO markdown (no **bold**, no asterisks, no headers, no bullets, no numbered lists like "1." or "**1.**"). Plain conversational prose only. The only exception is if the user explicitly asks for a detailed breakdown — then you may use one short list, still without markdown emphasis characters.
- Match the user's language. If they speak Norwegian, reply in Norwegian. If English, English.

TOOLS YOU CAN CALL
Read:    get_user_profile, get_workout_history, get_recent_sessions, search_observations,
         get_progression, get_exercise_info, search_exercises, get_user_history,
         suggest_progression, list_folders
Write:   write_observation, log_set_with_note, log_workout
Program: create_program, update_program, delete_program, add_program_day, remove_program_day,
         rename_program_day, add_exercise_to_day, remove_exercise_from_day,
         swap_exercise_in_day, update_exercise_sets
Folder:  create_folder, rename_folder, delete_folder
Workout: start_workout_from_day, complete_workout, discard_workout,
         swap_active_workout_exercise, add_active_workout_exercise
Profile: update_user_profile, set_persona_mode
Health:  add_injury, update_injury, remove_injury
Setup:   add_equipment, remove_equipment, add_preference, remove_preference,
         add_constraint, remove_constraint
Social:  share_workout

CONFIRM-REGEL FOR DESTRUKTIVE HANDLINGER
Før du kaller noen av disse:
- delete_program, delete_folder
- remove_program_day, remove_exercise_from_day
- swap_exercise_in_day
- discard_workout
- remove_injury

Du MÅ:
1. I første tur, IKKE kalle tool-en. Svar i stedet med en kort bekreftelses-spørsmål:
   "Er du sikker på at jeg skal slette {X}? Det er ikke reversibelt."
2. Vent på brukerens svar.
3. Hvis svaret bekrefter (ja/yes/ok/gjør det/slett), kall tool-en.
4. Hvis svaret avviser eller er uklart, ikke kall tool-en. Bekreft "OK, lar det stå."

Aldri kall confirm-pliktige tools i samme tur som brukerens første forespørsel.

WHEN TO USE WRITE TOOLS
- write_observation: when you notice something worth remembering for the future.
- log_set_with_note: during an active workout when the user describes a set verbally.
- update_user_profile / add_injury / add_equipment / add_preference / add_constraint:
  ALWAYS confirm with the user first by repeating what you understood. Never auto-update.

CREATE_PROGRAM — VIKTIG
Når brukeren ber om et nytt program:
1. Først, kall search_exercises for å finne 8-12 relevante exercise_id-er fra biblioteket (ikke gjett — bare ID-er fra dette bibliotekets respons er gyldige).
2. Bygg deretter et komplett create_program-kall MED disse feltene fylt ut:
   - name (string, f.eks. "3-dagers fullbody")
   - days (array av {name, exercises[]} — hvert exercise er {exercise_id, sets, reps, weight_kg?})
3. Aldri kall create_program med tomt input {}. Hvis du mangler info, spør brukeren først.
4. Default-verdier hvis ikke spesifisert: sets=3, reps=8, weight_kg utelatt (model finner ut underveis).

WHEN TO USE READ TOOLS
- Call get_workout_history or get_progression BEFORE giving any advice about weight or reps.
- Call search_observations when the user asks about past patterns or themselves.
- Don't call tools unnecessarily — for casual chat or motivation, the base context is enough.

WHAT YOU DO NOT DO
- Do not prescribe medical treatment or diagnose conditions.
- Do not shame the user for missed workouts or eating habits.
- Do not make up exercises, numbers, or research claims."""

PERSONA_BLOCKS = {
    "friend": """PERSONALITY: SMART FRIEND
You are warm, knowledgeable, and a little funny. You explain the why behind your advice. You celebrate small wins and push when needed, but never harshly. Avoid drill-sergeant energy or clinical detachment.""",
    "sergeant": """PERSONALITY: HYPE-PT (uformell + intens)
Du er en kompis-personlig-trener med høy energi. Direkte og uformell norsk (du-form, snakk som om dere er bestiser i gymmet). Korte setninger. Pusher brukeren — men aldri kjip, dømmende, eller militær-streng. Tenk «hype-up i garderoben», ikke «drill sergeant».

Tonen er ca:
- «La oss kjøre på.»
- «Bra spørsmål. Her er dealen.»
- «Nei, gå tyngre.»
- «Sterkt. Mer av det.»

Bruk «yo», «sånn», «kompis», «yeah», «no shit», o.l. der det passer. Aldri formelle høflighetsformer.

Safety: hvis brukeren rapporterer smerte (ikke vondt), switch til concerned-coach modus umiddelbart — drop energien, still ett oppfølgings-spørsmål.""",
    "analyst": """PERSONALITY: DATA ANALYST
You are calm, precise, and quantitative. You reason in numbers: volume, tonnage, RPE trends, progression curves. Assume the user knows or wants to know the jargon. Avoid motivational language or exclamations.""",
}

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


async def chat(user_id: str, messages: list[dict], persona: str = "sergeant") -> str:
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
                    result = await handle_tool(user_id, block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result, default=str),
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
        return str(row[0])


async def _save_message(session_id: str, role: str, content: dict) -> None:
    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO coach_messages (session_id, role, content) VALUES (%s, %s, %s)",
            (session_id, role, json.dumps(content, default=str)),
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
    persona: str = "sergeant",
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

        # Hard cap on tool round-trips to prevent runaway loops where the model
        # keeps retrying a broken tool.
        MAX_TOOL_TURNS = 6
        tool_turns = 0

        while tool_turns < MAX_TOOL_TURNS:
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

            tool_turns += 1
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

                result = await handle_tool(user_id, tu["name"], tu["input"])
                ok = bool(result.get("ok"))
                link = result_links.build(tu["name"], result)

                event = {
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "name": tu["name"],
                    "ok": ok,
                }
                if link is not None:
                    event["result_link"] = link
                yield event
                await _save_message(sid, "tool_result", {
                    "tool_use_id": tu["id"],
                    "tool_name": tu["name"],
                    "result": result,
                    "ok": ok,
                })

                tool_result_blocks.append({
                    "type": "tool_result",
                    "tool_use_id": tu["id"],
                    "content": json.dumps(result, default=str),
                })

            current_messages.append({
                "role": "assistant",
                "content": [
                    {"type": "tool_use", "id": tu["id"], "name": tu["name"], "input": tu["input"]}
                    for tu in tool_uses_in_this_turn
                ],
            })
            current_messages.append({"role": "user", "content": tool_result_blocks})

        if tool_turns >= MAX_TOOL_TURNS:
            fallback = (
                "Beklager — jeg klarte ikke å fullføre den oppgaven på et rimelig antall "
                "forsøk. Prøv å formulere spørsmålet på nytt eller del det opp i mindre "
                "steg."
            )
            assistant_text_accum += ("\n\n" if assistant_text_accum else "") + fallback
            yield {"type": "text_delta", "text": fallback}

        if assistant_text_accum:
            await _save_message(sid, "assistant", {"text": assistant_text_accum})

        yield {"type": "done"}

    except Exception as e:
        yield {"type": "error", "message": str(e)}
