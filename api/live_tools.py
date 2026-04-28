"""Tools for the Gemini Multimodal Live Agent."""

import logging

from api.services.dlp_service import dlp_service
from api.services.multimedia_service import multimedia_service

logger = logging.getLogger(__name__)


async def generate_inclusive_assets(topic: str, language: str = "en") -> dict:
    """Generates a multimodal package for any electoral topic.

    Use this when a user asks for 'visuals', 'guides', 'mind maps', or 'more details'.
    """
    try:
        logger.info(f"Live Agent triggering asset generation for: {topic}")
        return multimedia_service.generate_multimodal_package(topic, language)
    except Exception as e:
        logger.error(f"Inclusive assets generation failed: {e}")
        return {"error": str(e)}


async def verify_civic_document(document_text: str) -> str:
    """Sanitizes and analyzes document text for PII.

    Call this whenever a user provides sensitive information or ID details.
    """
    return dlp_service.mask_text(document_text)


# List of tools to be passed to Gemini Live
LIVE_TOOLS = [generate_inclusive_assets, verify_civic_document]
