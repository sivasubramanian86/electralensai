"""Translation service module."""

import logging
import os

from google.cloud import translate_v3 as translate

logger = logging.getLogger(__name__)


class TranslationService:
    """Service wrapper for Google Cloud Translation API."""

    def __init__(self, project_id: str | None = None) -> None:
        """Initialize the TranslationService."""
        self.project_id = project_id or os.environ.get("GOOGLE_CLOUD_PROJECT")
        if not self.project_id:  # pragma: no cover
            logger.warning(
                "No GOOGLE_CLOUD_PROJECT set. Translation functionality will fallback to native LLM.",  # noqa: E501
            )
        try:
            self.client = translate.TranslationServiceClient() if self.project_id else None
        except Exception:  # pragma: no cover
            logger.exception("Failed to initialize Translation client")
            self.client = None

    def translate_text(
        self, text: str, target_language_code: str, source_language_code: str = "en",
    ) -> str:
        """Translates text using Google Cloud Translation API."""
        logger.info(
            "Translation requested to %s for text: %s...", target_language_code, text[:50],
        )
        if not self.client or target_language_code == source_language_code:
            return text  # No-op if no credentials or same language

        parent = f"projects/{self.project_id}/locations/global"

        try:
            response = self.client.translate_text(
                request={
                    "parent": parent,
                    "contents": [text],
                    "mime_type": "text/plain",
                    "source_language_code": source_language_code,
                    "target_language_code": target_language_code,
                },
            )
            return response.translations[0].translated_text
        except Exception:  # pragma: no cover
            logger.exception("Translation failed")
            return text  # Fallback to original text


translation_service = TranslationService()
