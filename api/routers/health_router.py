"""ElectraLensAI — Health check router.

Provides a lightweight liveness/readiness endpoint for
Cloud Run health probes and monitoring.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str
    version: str
    service: str


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness probe",
    description="Returns service status for Cloud Run health checks.",
)
async def health_check() -> HealthResponse:
    """Return the current health status of the ElectraLensAI API.

    Returns:
        A HealthResponse indicating the service is operational.
    """
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        service="ElectraLensAI",
    )
