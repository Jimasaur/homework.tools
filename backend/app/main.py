from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.api import submissions, health
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("🚀 Starting homework.tools backend...")

    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    print("✅ Backend ready!")

    yield

    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title="Homework.tools API",
    description="Adaptive homework guidance platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["submissions"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Homework.tools API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }
