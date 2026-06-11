import json
import logging
from typing import Literal
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from app.services.coach import chat as coach_chat
from app.services.coach import chat_stream
from app.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    persona: Literal["friend", "sergeant", "analyst"] = "sergeant"

    @field_validator("messages")
    @classmethod
    def messages_not_empty(cls, v: list) -> list:
        if len(v) == 0:
            raise ValueError("messages must not be empty")
        return v


class ChatResponse(BaseModel):
    message: str


@router.post("/chat", response_model=ChatResponse)
async def chat(http_request: Request, request: ChatRequest) -> ChatResponse:
    user_id = get_current_user_id(http_request)
    messages = [m.model_dump() for m in request.messages]
    reply = await coach_chat(user_id, messages, request.persona)
    return ChatResponse(message=reply)


@router.post("/chat/stream")
async def chat_stream_endpoint(request: Request, body: dict):
    user_id = get_current_user_id(request)
    session_id = body.get("session_id")
    message = body.get("message")
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    persona = body.get("persona", "sergeant")

    async def event_generator():
        try:
            async for event in chat_stream(user_id, session_id, message, persona=persona):
                yield f"data: {json.dumps(event, default=str)}\n\n"
        except Exception:
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
