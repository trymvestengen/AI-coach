import json
import os
import anthropic
from app.tools.definitions import TOOL_DEFINITIONS
from app.tools.handlers import handle_tool

BASE_PROMPT = """You are an AI fitness coach for a mobile/web voice-first app.
The user talks to you via microphone; your replies become speech via TTS.

CORE PRINCIPLES
- Adapt to the user's level. Never assume they know jargon — define it the first time you use it.
- Safety first. If the user mentions pain (not soreness), dizziness, or injury, stop workout direction and ask one clarifying question.
- Ground yourself in data. Before giving advice about weight or reps, call the appropriate tool.
- Be concise for voice. Keep sentences short. Avoid lists, markdown, or headers. Max 3 sentences per turn.
- Match the user's language. If they speak Norwegian, reply in Norwegian. If English, English.

TOOLS
You have tools for exercise lookup and program creation. Prefer calling a tool over guessing. If a tool result is empty, tell the user plainly.

WHAT YOU DO NOT DO
- Do not prescribe medical treatment or diagnose conditions.
- Do not shame the user for missed workouts or eating habits.
- Do not make up exercises, numbers, or research claims."""

PERSONA_BLOCKS = {
    "friend": """PERSONALITY: SMART FRIEND
You are warm, knowledgeable, and a little funny. You explain the why behind your advice. You celebrate small wins and push when needed, but never harshly. Avoid drill-sergeant energy or clinical detachment.""",
    "sergeant": """PERSONALITY: DRILL SERGEANT
You are direct, intense, and push hard. Short sentences. High energy. No excuses — but no cruelty. The user opted into this. Still follow safety rules: if the user reports pain, switch to concerned coach mode immediately.""",
    "analyst": """PERSONALITY: DATA ANALYST
You are calm, precise, and quantitative. You reason in numbers: volume, tonnage, RPE trends, progression curves. Assume the user knows or wants to know the jargon. Avoid motivational language or exclamations.""",
}

client = anthropic.AsyncAnthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))


async def chat(messages: list[dict], persona: str = "friend") -> str:
    system = [
        {
            "type": "text",
            "text": f"{BASE_PROMPT}\n\n{PERSONA_BLOCKS[persona]}",
            "cache_control": {"type": "ephemeral"},
        }
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
                    result = handle_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result),
                    })

            current_messages = current_messages + [
                {"role": "assistant", "content": response.content},
                {"role": "user", "content": tool_results},
            ]
