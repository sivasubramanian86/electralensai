"""ElectraLensAI — FastAPI application factory.

Creates and configures the FastAPI app instance with CORS,
health check, and agent router endpoints.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

import vertexai
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

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
    # Initialize Vertex AI for production only when explicitly requested.
    # Do NOT fall back to Vertex mode just because an API key is absent —
    # that causes failures in Cloud Run where ADC paths are local-only.
    api_key = os.getenv("GEMINI_API_KEY")
    adc_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    adc_present = bool(adc_path) and Path(adc_path).is_file()
    use_vertex = (
        os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "1"
        or adc_present
    )
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

    if use_vertex and project_id:
        logger.info("Initializing Vertex AI Mode (Enterprise Auth) for project: %s", project_id)
        vertexai.init(
            project=project_id, location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
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

    @app.get("/", include_in_schema=False)
    async def root_redirect() -> RedirectResponse:
        """Redirect the root endpoint to the OpenAPI documentation."""
        return RedirectResponse(url="/docs")

    @app.exception_handler(Exception)
    async def global_exception_handler(_request: Request, _exc: Exception) -> JSONResponse:
        """Catch-all for any unhandled backend exceptions."""
        logger.exception("Unhandled server error")

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": (
                    "The ElectraLensAI backend encountered an unexpected condition. "
                    "Our engineers have been notified."
                ),
            },
        )

    # Security Hardening: Restrict CORS origins in production.
    # Read from ALLOWED_ORIGINS env var; defaults to wildcard for hackathon dev mode.
    cors_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
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
