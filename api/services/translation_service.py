"""Translation service module using Gemini LLM for high-quality semantic translation."""

import logging

from api.config import Config
from api.genai_client import client

logger = logging.getLogger(__name__)


class TranslationService:
    """Service wrapper for Gemini-powered Translation."""

    def __init__(self, project_id: str | None = None) -> None:
        """Initialize the TranslationService."""
        self.project_id = project_id

    def translate_text(
        self,
        text: str,
        target_language_code: str,
        source_language_code: str = "en",
    ) -> str:
        """Translates text using Gemini LLM."""
        logger.info(
            "Translation requested to %s for text: %s...",
            target_language_code,
            text[:50],
        )
        if target_language_code == source_language_code:
            return text

        if not client:
            logger.warning("GenAI client not initialized. Returning original text.")
            return text

        try:
            model_id = Config.MODEL_NAME
            prompt = (
                f"Translate the following text to language code '{target_language_code}'.\n"
                "Maintain the tone and context of civic education. "
                "Return ONLY the translated text.\n\n"
                f"Text: {text}"
            )
            response = client.models.generate_content(
                model=model_id,
                contents=prompt,
            )
            return response.text.strip()
        except Exception:  # pragma: no cover
            logger.exception("Gemini Translation failed")
            return text  # Fallback to original text


translation_service = TranslationService()
