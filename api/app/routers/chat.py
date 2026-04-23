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
