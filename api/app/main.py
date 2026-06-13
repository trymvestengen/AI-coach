import os
from typing import Mapping

from dotenv import load_dotenv
# override=True so .env wins over shell env vars (e.g. Claude Code CLI exports
# ANTHROPIC_API_KEY pointing at its own credentials, which we don't want here).
load_dotenv(override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat
from app.routers import workouts
from app.routers import programs
from app.routers import users
from app.routers import social
from app.routers import profile
from app.routers import chat_sessions
from app.routers import program_folders
from app.routers import body_metrics
from app.routers import template_folders
from app.routers import templates


def build_cors_config(env: Mapping[str, str] = os.environ) -> dict:
    origins_raw = env.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:3001",
    )
    allow_origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
    regex = env.get("CORS_ORIGIN_REGEX")
    return {
        "allow_origins": allow_origins,
        "allow_origin_regex": regex if regex else None,
    }


app = FastAPI(title="AI Coach API")

_cors = build_cors_config()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors["allow_origins"],
    allow_origin_regex=_cors["allow_origin_regex"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(workouts.router, prefix="/api")
app.include_router(programs.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(social.router, prefix="/api")
app.include_router(profile.router)
app.include_router(chat_sessions.router)
app.include_router(program_folders.router, prefix="/api")
app.include_router(body_metrics.router, prefix="/api")
app.include_router(template_folders.router, prefix="/api")
app.include_router(templates.router, prefix="/api")

@app.get("/")
def health():
    return {"status": "ok"}
