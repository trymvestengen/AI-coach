import json
import logging
from typing import Literal
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from app.services.coach import chat as coach_chat
from app.services.coach import chat_stream
from app.auth import get_current_user_id
from app.rate_limit import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter()

# Tak på input (security audit M2): hindrer at en klient blåser opp input-tokens
# (kost/DoS) med svære meldinger eller endeløse historikk-lister.
MAX_MESSAGE_CHARS = 8000
MAX_MESSAGES = 50


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)


class ChatRequest(BaseModel):
    messages: list[Message] = Field(min_length=1, max_length=MAX_MESSAGES)
    persona: Literal["friend", "sergeant", "analyst"] = "friend"


class ChatStreamRequest(BaseModel):
    # Typet body (security audit L1) + størrelsestak (M2).
    message: str = Field(min_length=1, max_length=MAX_MESSAGE_CHARS)
    session_id: str | None = None
    persona: Literal["friend", "sergeant", "analyst"] = "friend"


class ChatResponse(BaseModel):
    message: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest) -> ChatResponse:
    user_id = get_current_user_id(request)
    check_rate_limit(user_id)
    messages = [m.model_dump() for m in body.messages]
    reply = await coach_chat(messages, user_id, body.persona)
    return ChatResponse(message=reply)


@router.post("/chat/stream")
async def chat_stream_endpoint(request: Request, body: ChatStreamRequest):
    user_id = get_current_user_id(request)
    check_rate_limit(user_id)

    async def event_generator():
        try:
            async for event in chat_stream(
                user_id, body.session_id, body.message, persona=body.persona
            ):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception:
            # Logg internt, lekk aldri interne feildetaljer til klienten (M1).
            logger.exception("chat_stream endpoint failed")
            generic = {"type": "error", "message": "Noe gikk galt. Prøv igjen."}
            yield f"data: {json.dumps(generic)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
