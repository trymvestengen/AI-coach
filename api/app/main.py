from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat
from app.routers import workouts
from app.routers import programs
from app.routers import users
from app.routers import social

app = FastAPI(title="AI Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(workouts.router, prefix="/api")
app.include_router(programs.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(social.router, prefix="/api")

@app.get("/")
def health():
    return {"status": "ok"}
