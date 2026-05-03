"""DLP service module for masking PII."""

import logging
import os

from google.cloud import dlp_v2

logger = logging.getLogger(__name__)


class DLPService:
    """Service wrapper for Google Cloud Data Loss Prevention (DLP) API."""

    def __init__(self, project_id: str | None = None) -> None:
        """Initialize the DLPService."""
        self.project_id = project_id or os.environ.get("GOOGLE_CLOUD_PROJECT")
        if not self.project_id:  # pragma: no cover
            logger.warning(
                "No GOOGLE_CLOUD_PROJECT set. DLP functionality will be disabled locally.",
            )
            self.client = None
        else:
            try:
                self.client = dlp_v2.DlpServiceClient()
            except Exception:  # pragma: no cover
                logger.exception("Failed to initialize DLP client")
                self.client = None

    def mask_text(self, text: str) -> str:
        """Masks Indian PII like Aadhaar, PAN, and common PII like names, emails, phones."""
        logger.info("DLP Masking requested for text: %s...", text[:50])
        if not self.client:
            return text  # fallback for local testing without credentials

        parent = f"projects/{self.project_id}/locations/global"

        item = {"value": text}

        inspect_config = {
            "info_types": [
                {"name": "INDIA_AADHAAR_INDIVIDUAL"},
                {"name": "INDIA_PAN_INDIVIDUAL"},
                {"name": "EMAIL_ADDRESS"},
                {"name": "PHONE_NUMBER"},
                {"name": "PERSON_NAME"},
            ],
            "min_likelihood": dlp_v2.Likelihood.POSSIBLE,
        }

        deidentify_config = {
            "info_type_transformations": {
                "transformations": [
                    {
                        "primitive_transformation": {
                            "character_mask_config": {
                                "masking_character": "*",
                                "number_to_mask": 0,  # Mask everything
                                "reverse_order": False,
                            },
                        },
                    },
                ],
            },
        }

        try:
            response = self.client.deidentify_content(
                request={
                    "parent": parent,
                    "deidentify_config": deidentify_config,
                    "inspect_config": inspect_config,
                    "item": item,
                },
            )
        except Exception:
            logger.exception("DLP Masking failed for project %s", self.project_id)
            # Fail closed: If DLP fails, we don't want to accidentally leak PII.
            # We return a hint about the failure to help debugging during the hackathon.
            return "--- PII MASKING FAILED. CONTENT REDACTED ---"
        else:
            return response.item.value


# Singleton instance
dlp_service = DLPService()
