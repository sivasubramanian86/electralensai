"""ElectraLensAI — FastAPI application factory.

Creates and configures the FastAPI app instance with CORS,
health check, and agent router endpoints.
"""

from __future__ import annotations

import logging
import os

import vertexai
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import (
    agent_router,
    audit_router,
    health_router,
    imagen_router,
    live_router,
    multimedia_router,
)

load_dotenv(override=True)


# Setup logging
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure the ElectraLensAI FastAPI application.

    Returns:
        A fully configured FastAPI instance ready for ASGI serving.
    """
    # Initialize Vertex AI for production if requested or if no API Key is provided
    use_vertex = os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "1" or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    api_key = os.getenv("GEMINI_API_KEY")
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

    if use_vertex and project_id:
        logger.info(f"Initializing Vertex AI Mode (Enterprise Auth) for project: {project_id}")
        vertexai.init(
            project=project_id, location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        )
    elif api_key:
        logger.info("Initializing Developer API Mode (AI Studio Auth)")
    else:
        logger.warning("Neither GEMINI_API_KEY nor GOOGLE_CLOUD_PROJECT found. Auth may fail.")


    app = FastAPI(
        title="ElectraLensAI API",
        description="Civic election education platform powered by Google ADK multi-agent system.",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Restrict in production via Secret Manager config
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router.router, prefix="/v1", tags=["Health"])
    app.include_router(agent_router.router, prefix="/v1", tags=["Agents"])
    app.include_router(multimedia_router.router, prefix="/v1", tags=["Multimedia"])
    app.include_router(imagen_router.router, prefix="/v1", tags=["Imagen"])
    app.include_router(live_router.router, tags=["Live"])
    app.include_router(audit_router.router, prefix="/v1", tags=["Audit"])

    return app
