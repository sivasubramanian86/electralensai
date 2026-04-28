"""API router for Imagen content generation."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from api.services.multimedia_service import multimedia_service

router = APIRouter(prefix="/imagen", tags=["imagen"])
logger = logging.getLogger(__name__)


class ImagenRequest(BaseModel):
    """Request schema for Imagen generation."""

    concept: str
    prompt: str
    style: str = "infographic"


@router.post("/generate")
async def generate_image(request: ImagenRequest) -> dict:
    """Bridge for the frontend imagenService to Vertex AI Imagen 3."""
    try:
        url = multimedia_service.generate_infographic(request.prompt)
        return {"imageUrl": url, "concept": request.concept}
    except Exception as e:
        logger.error("Imagen generation endpoint failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
