# Trinn 1: App-skall + tekst-chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bygge FastAPI-backend med Claude-integrasjon og tool use, pluss Next.js app-skall med 5-tab navigasjon og fungerende tekst-chat UI.

**Architecture:** FastAPI-backend eksponerer `POST /api/chat` som tar meldingshistorikk og returnerer coachens svar. Claude Sonnet brukes med tool use mot en statisk øvelseskatalog (JSON-fil). Next.js-frontend har 5-tab navigasjon og en chat-UI på Hjem-skjermen som kaller backend.

**Tech Stack:** Python 3.11 · FastAPI · Anthropic SDK (claude-sonnet-4-5) · pytest · Next.js 16 · TypeScript · Tailwind · shadcn/ui · lucide-react

---

## Filstruktur som opprettes

```
api/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app, CORS, router-mount
│   ├── routers/
│   │   ├── __init__.py
│   │   └── chat.py                # POST /api/chat
│   ├── services/
│   │   ├── __init__.py
│   │   └── coach.py               # Claude-integrasjon, tool use-loop, prompt caching
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── definitions.py         # Tool-skjemaer for Claude API
│   │   └── handlers.py            # Tool-funksjoner som utfører søk/oppslag
│   └── data/
│       └── exercises.json         # Statisk øvelseskatalog (15 øvelser)
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_tools.py
│   └── test_chat.py
├── requirements.txt
├── pytest.ini
└── .env.example

web/src/
├── app/
│   ├── layout.tsx                 # Oppdateres: metadata
│   ├── page.tsx                   # Erstattes: redirect til /home
│   └── (tabs)/
│       ├── layout.tsx             # Tab-wrapper med BottomNav
│       ├── home/
│       │   └── page.tsx           # Chat UI
│       ├── program/
│       │   └── page.tsx           # Placeholder
│       ├── log/
│       │   └── page.tsx           # Placeholder
│       ├── social/
│       │   └── page.tsx           # Placeholder
│       └── profile/
│           └── page.tsx           # Placeholder
├── components/
│   ├── layout/
│   │   └── BottomNav.tsx          # 5-tab bunnavigasjon
│   └── chat/
│       ├── ChatWindow.tsx         # Meldingsliste med auto-scroll
│       ├── MessageBubble.tsx      # Enkelt melding (user/assistant styling)
│       └── ChatInput.tsx          # Tekstfelt + send-knapp
└── lib/
    └── api.ts                     # fetch-wrapper mot backend (oppdateres)
```

---

## Task 1: FastAPI prosjekt-oppsett

**Files:**
- Create: `api/app/__init__.py`
- Create: `api/app/main.py`
- Create: `api/requirements.txt`
- Create: `api/pytest.ini`
- Create: `api/.env.example`

- [ ] **Step 1: Opprett mappestruktur**

```bash
mkdir -p api/app/routers api/app/services api/app/tools api/app/data api/tests
```

- [ ] **Step 2: Opprett tomme `__init__.py`-filer**

```bash
touch api/app/__init__.py api/app/routers/__init__.py api/app/services/__init__.py api/app/tools/__init__.py api/tests/__init__.py
```

- [ ] **Step 3: Skriv `api/requirements.txt`**

```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
anthropic>=0.40.0
python-dotenv>=1.0.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

- [ ] **Step 4: Skriv `api/pytest.ini`**

```ini
[pytest]
asyncio_mode = auto
```

- [ ] **Step 5: Skriv `api/.env.example`**

```
ANTHROPIC_API_KEY=your_key_here
```

- [ ] **Step 6: Skriv `api/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat

app = FastAPI(title="AI Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")

@app.get("/")
def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Installer avhengigheter og verifiser at appen starter**

```bash
cd api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Forventet output: `Uvicorn running on http://127.0.0.1:8000`

Åpne `http://localhost:8000` i nettleser — skal returnere `{"status": "ok"}`.

- [ ] **Step 8: Commit**

```bash
git add api/
git commit -m "feat: add FastAPI project skeleton"
```

---

## Task 2: Øvelseskatalog

**Files:**
- Create: `api/app/data/exercises.json`

- [ ] **Step 1: Skriv `api/app/data/exercises.json`**

```json
[
  {
    "id": "bench-press",
    "name": "Bench Press",
    "muscle_groups": ["chest", "triceps", "front_deltoid"],
    "equipment": ["barbell", "bench"],
    "difficulty": "intermediate",
    "instructions": "Lie flat on bench. Grip bar slightly wider than shoulder-width. Lower bar to chest, press up to full arm extension."
  },
  {
    "id": "squat",
    "name": "Squat",
    "muscle_groups": ["quads", "glutes", "hamstrings"],
    "equipment": ["barbell", "rack"],
    "difficulty": "intermediate",
    "instructions": "Bar on upper back. Feet shoulder-width apart. Squat until thighs parallel to floor, drive back up through heels."
  },
  {
    "id": "deadlift",
    "name": "Deadlift",
    "muscle_groups": ["hamstrings", "glutes", "back", "traps"],
    "equipment": ["barbell"],
    "difficulty": "intermediate",
    "instructions": "Bar over mid-foot. Hip-width stance. Hinge at hips, grip bar, drive through floor to stand tall."
  },
  {
    "id": "overhead-press",
    "name": "Overhead Press",
    "muscle_groups": ["front_deltoid", "triceps", "upper_chest"],
    "equipment": ["barbell"],
    "difficulty": "intermediate",
    "instructions": "Bar at shoulder height. Press straight up, lean head back slightly as bar passes face. Lock out overhead."
  },
  {
    "id": "pull-up",
    "name": "Pull-up",
    "muscle_groups": ["lats", "biceps", "rear_deltoid"],
    "equipment": ["pull-up bar"],
    "difficulty": "intermediate",
    "instructions": "Hang from bar overhand grip. Pull chest to bar, elbows drive down and back. Lower with control."
  },
  {
    "id": "dumbbell-row",
    "name": "Dumbbell Row",
    "muscle_groups": ["lats", "rhomboids", "biceps"],
    "equipment": ["dumbbell", "bench"],
    "difficulty": "beginner",
    "instructions": "One knee and hand on bench. Pull dumbbell to hip, elbow close to body. Lower with control."
  },
  {
    "id": "dip",
    "name": "Dip",
    "muscle_groups": ["chest", "triceps", "front_deltoid"],
    "equipment": ["dip bars"],
    "difficulty": "intermediate",
    "instructions": "Support on bars. Lower until elbows at 90 degrees, press back up. Lean forward slightly for chest focus."
  },
  {
    "id": "romanian-deadlift",
    "name": "Romanian Deadlift",
    "muscle_groups": ["hamstrings", "glutes", "lower_back"],
    "equipment": ["barbell"],
    "difficulty": "intermediate",
    "instructions": "Hold bar at hips. Hinge forward, bar slides down thighs until you feel hamstring stretch. Drive hips forward to stand."
  },
  {
    "id": "incline-dumbbell-press",
    "name": "Incline Dumbbell Press",
    "muscle_groups": ["upper_chest", "front_deltoid", "triceps"],
    "equipment": ["dumbbell", "incline bench"],
    "difficulty": "beginner",
    "instructions": "Set bench to 30-45 degrees. Press dumbbells from shoulder level to full extension overhead. Lower with control."
  },
  {
    "id": "lat-pulldown",
    "name": "Lat Pulldown",
    "muscle_groups": ["lats", "biceps", "rear_deltoid"],
    "equipment": ["cable machine"],
    "difficulty": "beginner",
    "instructions": "Grip bar wider than shoulders. Pull to upper chest, elbows drive down to hips. Slow controlled return."
  },
  {
    "id": "leg-press",
    "name": "Leg Press",
    "muscle_groups": ["quads", "glutes", "hamstrings"],
    "equipment": ["leg press machine"],
    "difficulty": "beginner",
    "instructions": "Feet shoulder-width on platform. Lower until knees at 90 degrees. Press through heels to full extension."
  },
  {
    "id": "face-pull",
    "name": "Face Pull",
    "muscle_groups": ["rear_deltoid", "rotator_cuff", "traps"],
    "equipment": ["cable machine"],
    "difficulty": "beginner",
    "instructions": "Set cable at head height. Pull rope to face, elbows high and wide. Squeeze rear delts at peak contraction."
  },
  {
    "id": "bicep-curl",
    "name": "Bicep Curl",
    "muscle_groups": ["biceps"],
    "equipment": ["dumbbell"],
    "difficulty": "beginner",
    "instructions": "Stand with dumbbells at sides. Curl up keeping elbows fixed at sides. Lower with full control."
  },
  {
    "id": "tricep-pushdown",
    "name": "Tricep Pushdown",
    "muscle_groups": ["triceps"],
    "equipment": ["cable machine"],
    "difficulty": "beginner",
    "instructions": "Grip rope or bar at chest height. Push down to full extension, elbows pinned at sides. Slow return."
  },
  {
    "id": "lunge",
    "name": "Lunge",
    "muscle_groups": ["quads", "glutes", "hamstrings"],
    "equipment": ["bodyweight", "dumbbell"],
    "difficulty": "beginner",
    "instructions": "Step forward, lower until back knee near floor. Push off front foot to return. Alternate legs each rep."
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add api/app/data/exercises.json
git commit -m "feat: add static exercise catalog"
```

---

## Task 3: Tool handlers

**Files:**
- Create: `api/app/tools/handlers.py`
- Create: `api/tests/test_tools.py`

- [ ] **Step 1: Skriv testene — `api/tests/test_tools.py`**

```python
from app.tools.handlers import get_exercise_info, search_exercises, handle_tool


def test_get_exercise_info_returns_known_exercise():
    result = get_exercise_info("bench-press")
    assert result["id"] == "bench-press"
    assert "chest" in result["muscle_groups"]
    assert "instructions" in result


def test_get_exercise_info_unknown_returns_error():
    result = get_exercise_info("made-up-exercise")
    assert "error" in result


def test_search_exercises_by_muscle_group():
    results = search_exercises(muscle_group="chest")
    assert len(results) > 0
    assert all(any("chest" in mg.lower() for mg in r["muscle_groups"]) for r in results)


def test_search_exercises_by_equipment():
    results = search_exercises(equipment="dumbbell")
    assert len(results) > 0


def test_search_exercises_no_filters_returns_all():
    results = search_exercises()
    assert len(results) == 15


def test_search_exercises_by_difficulty():
    results = search_exercises(difficulty="beginner")
    assert len(results) > 0
    assert all(r["difficulty"] == "beginner" for r in results)


def test_handle_tool_get_exercise_info():
    result = handle_tool("get_exercise_info", {"exercise_id": "squat"})
    assert result["id"] == "squat"


def test_handle_tool_search_exercises():
    result = handle_tool("search_exercises", {"muscle_group": "back"})
    assert isinstance(result, list)


def test_handle_tool_unknown_returns_error():
    result = handle_tool("nonexistent_tool", {})
    assert "error" in result
```

- [ ] **Step 2: Kjør tester — bekreft at de feiler**

```bash
cd api
source .venv/bin/activate
pytest tests/test_tools.py -v
```

Forventet: `ERROR` — `ModuleNotFoundError: No module named 'app.tools.handlers'`

- [ ] **Step 3: Skriv `api/app/tools/handlers.py`**

```python
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
```

- [ ] **Step 4: Kjør tester — bekreft at de passerer**

```bash
pytest tests/test_tools.py -v
```

Forventet: `9 passed`

- [ ] **Step 5: Commit**

```bash
git add api/app/tools/handlers.py api/tests/test_tools.py
git commit -m "feat: add exercise tool handlers"
```

---

## Task 4: Tool-definisjoner for Claude

**Files:**
- Create: `api/app/tools/definitions.py`

- [ ] **Step 1: Skriv `api/app/tools/definitions.py`**

```python
TOOL_DEFINITIONS = [
    {
        "name": "get_exercise_info",
        "description": "Get details about a specific exercise by ID. Returns muscle groups, equipment, difficulty, and instructions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_id": {
                    "type": "string",
                    "description": "The exercise ID, e.g. 'bench-press', 'squat', 'deadlift'",
                }
            },
            "required": ["exercise_id"],
        },
    },
    {
        "name": "search_exercises",
        "description": "Search exercises by muscle group, equipment, or difficulty. Use this before recommending exercises to ensure they exist.",
        "input_schema": {
            "type": "object",
            "properties": {
                "muscle_group": {
                    "type": "string",
                    "description": "Filter by muscle group, e.g. 'chest', 'back', 'quads', 'biceps'",
                },
                "equipment": {
                    "type": "string",
                    "description": "Filter by equipment, e.g. 'barbell', 'dumbbell', 'bodyweight', 'cable machine'",
                },
                "difficulty": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                    "description": "Filter by difficulty level",
                },
            },
        },
    },
    {
        "name": "create_program",
        "description": "Generate a structured training program based on the user's goals and available equipment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "goal": {
                    "type": "string",
                    "description": "User's training goal, e.g. 'build muscle', 'lose weight', 'increase strength'",
                },
                "days_per_week": {
                    "type": "integer",
                    "description": "How many days per week the user wants to train",
                    "minimum": 2,
                    "maximum": 6,
                },
                "equipment": {
                    "type": "string",
                    "description": "Available equipment, e.g. 'full gym', 'home dumbbells', 'bodyweight only'",
                },
                "experience_level": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                },
            },
            "required": ["goal", "days_per_week", "equipment", "experience_level"],
        },
    },
]
```

- [ ] **Step 2: Commit**

```bash
git add api/app/tools/definitions.py
git commit -m "feat: add Claude tool definitions"
```

---

## Task 5: Coach-service og chat-endpoint

**Files:**
- Create: `api/app/services/coach.py`
- Create: `api/app/routers/chat.py`
- Create: `api/tests/conftest.py`
- Create: `api/tests/test_chat.py`

- [ ] **Step 1: Skriv `api/tests/conftest.py`**

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
```

- [ ] **Step 2: Skriv testene — `api/tests/test_chat.py`**

```python
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _mock_response(text: str):
    block = MagicMock()
    block.type = "text"
    block.text = text
    response = MagicMock()
    response.stop_reason = "end_turn"
    response.content = [block]
    return response


@patch("app.services.coach.client")
def test_chat_returns_message(mock_client):
    mock_client.messages.create = AsyncMock(return_value=_mock_response("Let's build a program!"))

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "I want to build muscle"}],
        "persona": "friend",
    })

    assert response.status_code == 200
    assert response.json()["message"] == "Let's build a program!"


@patch("app.services.coach.client")
def test_chat_default_persona_is_friend(mock_client):
    mock_client.messages.create = AsyncMock(return_value=_mock_response("Sure!"))

    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Hello"}],
    })

    assert response.status_code == 200


def test_chat_invalid_persona_returns_422():
    response = client.post("/api/chat", json={
        "messages": [{"role": "user", "content": "Hello"}],
        "persona": "invalid_persona",
    })
    assert response.status_code == 422


def test_chat_empty_messages_returns_422():
    response = client.post("/api/chat", json={
        "messages": [],
        "persona": "friend",
    })
    assert response.status_code == 422
```

- [ ] **Step 3: Kjør tester — bekreft at de feiler**

```bash
pytest tests/test_chat.py -v
```

Forventet: `ERROR` — `ModuleNotFoundError: No module named 'app.routers.chat'`

- [ ] **Step 4: Skriv `api/app/services/coach.py`**

```python
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
```

- [ ] **Step 5: Skriv `api/app/routers/chat.py`**

```python
from typing import Literal
from fastapi import APIRouter
from pydantic import BaseModel, field_validator
from app.services.coach import chat as coach_chat

router = APIRouter()


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    persona: Literal["friend", "sergeant", "analyst"] = "friend"

    @field_validator("messages")
    @classmethod
    def messages_not_empty(cls, v: list) -> list:
        if len(v) == 0:
            raise ValueError("messages must not be empty")
        return v


class ChatResponse(BaseModel):
    message: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    messages = [m.model_dump() for m in request.messages]
    reply = await coach_chat(messages, request.persona)
    return ChatResponse(message=reply)
```

- [ ] **Step 6: Kjør tester — bekreft at de passerer**

```bash
pytest tests/test_chat.py -v
```

Forventet: `4 passed`

- [ ] **Step 7: Test manuelt med curl**

```bash
cp .env.example .env
# Rediger .env og legg inn din ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

I en annen terminal:
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hei! Jeg vil bygge muskler. Har tilgang til fullt gym og trener 4 dager i uken."}]}'
```

Forventet: JSON med `message`-felt som inneholder coachens svar på norsk.

- [ ] **Step 8: Commit**

```bash
git add api/app/services/ api/app/routers/ api/tests/
git commit -m "feat: add coach service and /api/chat endpoint"
```

---

## Task 6: Next.js 5-tab app-skall

**Files:**
- Modify: `web/src/app/layout.tsx`
- Modify: `web/src/app/page.tsx`
- Create: `web/src/app/(tabs)/layout.tsx`
- Create: `web/src/app/(tabs)/home/page.tsx`
- Create: `web/src/app/(tabs)/program/page.tsx`
- Create: `web/src/app/(tabs)/log/page.tsx`
- Create: `web/src/app/(tabs)/social/page.tsx`
- Create: `web/src/app/(tabs)/profile/page.tsx`
- Create: `web/src/components/layout/BottomNav.tsx`

- [ ] **Step 1: Oppdater `web/src/app/layout.tsx` — metadata**

Erstatt hele filen med:

```tsx
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "AI Coach",
  description: "Din personlige AI-trener",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground font-sans">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Erstatt `web/src/app/page.tsx` med redirect**

```tsx
import { redirect } from "next/navigation"

export default function Root() {
  redirect("/home")
}
```

- [ ] **Step 3: Opprett `web/src/app/(tabs)/layout.tsx`**

```tsx
import BottomNav from "@/components/layout/BottomNav"

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto pb-16">{children}</main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Opprett `web/src/components/layout/BottomNav.tsx`**

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ClipboardList, PlusCircle, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"

const tabs = [
  { href: "/home", icon: Home, label: "Hjem" },
  { href: "/program", icon: ClipboardList, label: "Program" },
  { href: "/log", icon: PlusCircle, label: "Logg" },
  { href: "/social", icon: Users, label: "Sosialt" },
  { href: "/profile", icon: User, label: "Profil" },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-around px-2 z-50">
      {tabs.map(({ href, icon: Icon, label }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 5: Opprett placeholder-sider**

`web/src/app/(tabs)/program/page.tsx`:
```tsx
export default function ProgramPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Program</h1>
      <p className="text-muted-foreground mt-2">Treningsprogrammer kommer i Trinn 3.</p>
    </div>
  )
}
```

`web/src/app/(tabs)/log/page.tsx`:
```tsx
export default function LogPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Logg</h1>
      <p className="text-muted-foreground mt-2">Treningslogg kommer i Trinn 2.</p>
    </div>
  )
}
```

`web/src/app/(tabs)/social/page.tsx`:
```tsx
export default function SocialPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Sosialt</h1>
      <p className="text-muted-foreground mt-2">Sosialt feed kommer i Trinn 7.</p>
    </div>
  )
}
```

`web/src/app/(tabs)/profile/page.tsx`:
```tsx
export default function ProfilePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Profil</h1>
      <p className="text-muted-foreground mt-2">Profil og innstillinger kommer i Trinn 7.</p>
    </div>
  )
}
```

`web/src/app/(tabs)/home/page.tsx` (placeholder — erstattes i Task 8):
```tsx
export default function HomePage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Hjem</h1>
      <p className="text-muted-foreground mt-2">Chat kommer i Task 8.</p>
    </div>
  )
}
```

- [ ] **Step 6: Sjekk at TypeScript er feilfritt**

```bash
cd web
npx tsc --noEmit
```

Forventet: ingen output (ingen feil)

- [ ] **Step 7: Start dev-server og verifiser navigasjon**

```bash
npm run dev
```

Åpne `http://localhost:3000`. Verifiser:
- Siden redirecter til `/home` automatisk
- Bunnavigasjon viser 5 tabs
- Alle 5 tabs er klikkbare og viser riktig innhold
- Aktiv tab viser tykkere ikon-stroke

- [ ] **Step 8: Commit**

```bash
git add web/src/
git commit -m "feat: add 5-tab app shell with bottom navigation"
```

---

## Task 7: Chat UI-komponenter

**Files:**
- Create: `web/src/components/chat/MessageBubble.tsx`
- Create: `web/src/components/chat/ChatWindow.tsx`
- Create: `web/src/components/chat/ChatInput.tsx`

- [ ] **Step 1: Opprett `web/src/components/chat/MessageBubble.tsx`**

```tsx
import { cn } from "@/lib/utils"

export type Message = {
  role: "user" | "assistant"
  content: string
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Opprett `web/src/components/chat/ChatWindow.tsx`**

```tsx
"use client"

import { useEffect, useRef } from "react"
import MessageBubble, { type Message } from "./MessageBubble"

export default function ChatWindow({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col gap-3 p-4">
      {messages.length === 0 && (
        <p className="text-center text-muted-foreground text-sm mt-16">
          Si hei til coachen din
        </p>
      )}
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 3: Opprett `web/src/components/chat/ChatInput.tsx`**

```tsx
"use client"

import { useState, type KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { SendHorizontal } from "lucide-react"

type Props = {
  onSend: (text: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("")

  function submit() {
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue("")
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 border-t border-border bg-background">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Skriv til coachen..."
        disabled={disabled}
        className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
      />
      <Button
        onClick={submit}
        size="icon"
        disabled={disabled || !value.trim()}
        className="rounded-full shrink-0"
      >
        <SendHorizontal size={18} />
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/components/chat/
git commit -m "feat: add ChatWindow, MessageBubble, ChatInput components"
```

---

## Task 8: Koble frontend til backend

**Files:**
- Modify: `web/src/lib/api.ts`
- Modify: `web/src/app/(tabs)/home/page.tsx`
- Create: `web/.env.local`

- [ ] **Step 1: Opprett `web/.env.local`**

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **Step 2: Oppdater `web/src/lib/api.ts`**

Erstatt hele filen med:

```ts
export type Message = {
  role: "user" | "assistant"
  content: string
}

export type Persona = "friend" | "sergeant" | "analyst"

export async function sendMessage(messages: Message[], persona: Persona = "friend"): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/chat`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, persona }),
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}`)
  }

  const data = await res.json()
  return data.message as string
}
```

- [ ] **Step 3: Skriv `web/src/app/(tabs)/home/page.tsx`**

```tsx
"use client"

import { useState } from "react"
import ChatWindow from "@/components/chat/ChatWindow"
import ChatInput from "@/components/chat/ChatInput"
import { sendMessage, type Message } from "@/lib/api"

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSend(text: string) {
    const userMsg: Message = { role: "user", content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setLoading(true)

    try {
      const reply = await sendMessage(next)
      setMessages([...next, { role: "assistant", content: reply }])
    } catch {
      setMessages([...next, { role: "assistant", content: "Noe gikk galt. Prøv igjen." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-3 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">AI Coach</h1>
        {loading && <p className="text-xs text-muted-foreground">Coachen tenker...</p>}
      </header>
      <div className="flex-1 overflow-y-auto">
        <ChatWindow messages={messages} />
      </div>
      <div className="shrink-0">
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Sjekk TypeScript**

```bash
cd web
npx tsc --noEmit
```

Forventet: ingen output

- [ ] **Step 5: End-to-end test**

Sørg for at backend kjører (`uvicorn app.main:app --reload` i `api/`-mappen med `.env` satt).

Start frontend:
```bash
cd web
npm run dev
```

Åpne `http://localhost:3000`. Test:
1. Skriv "Hei, jeg vil begynne å trene" → coachen svarer på norsk
2. Skriv "Lag et program for meg, 4 dager i uken, fullt gym, vil bygge muskler" → coachen bruker tools og returnerer et strukturert program
3. Skriv "What muscles does the bench press work?" → coachen svarer på engelsk

- [ ] **Step 6: Commit**

```bash
git add web/src/app/(tabs)/home/ web/src/lib/api.ts web/.env.local
git commit -m "feat: wire chat UI to backend, complete Trinn 1"
```

---

## Verifikasjonskrav for Trinn 1

Trinn 1 er ferdig når:

- [ ] `pytest` i `api/` kjører 13 tester uten feil
- [ ] `npx tsc --noEmit` i `web/` gir ingen feil
- [ ] Bruker kan skrive "lag et program for meg, vil bygge muskler, 4 dager, fullt gym" og få et strukturert program tilbake fra Claude
- [ ] Alle 5 tabs i bunnavigasjonen er klikkbare
- [ ] Coachen svarer på norsk når man skriver norsk, engelsk når man skriver engelsk
