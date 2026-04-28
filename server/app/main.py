import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from .database import init_db
from .routers import volumes, lessons, characters, learning, review, lookup

app = FastAPI(title="SmartBase", description="小学识字学习工具", version="1.0.0")

# CORS - allow all origins in production (nginx handles HTTPS)
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(volumes.router)
app.include_router(lessons.router)
app.include_router(characters.router)
app.include_router(learning.router)
app.include_router(review.router)
app.include_router(lookup.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.on_event("startup")
def startup():
    init_db()


# Serve built frontend if exists
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    assets_dir = static_dir / "assets"

    @app.get("/assets/{path:path}")
    async def serve_assets(path: str):
        file = assets_dir / path
        if file.exists():
            return FileResponse(file)
        return FileResponse(static_dir / "index.html")

    @app.get("/{path:path}")
    async def serve_spa(path: str):
        if path.startswith("api/"):
            return {"detail": "Not Found"}, 404
        file = static_dir / path
        if file.exists() and file.is_file():
            return FileResponse(file)
        return FileResponse(static_dir / "index.html")
