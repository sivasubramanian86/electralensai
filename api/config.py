"""Configuration management for the ElectraLensAI API."""

import os
from functools import lru_cache

from google.cloud import secretmanager


class Config:
    """Base configuration."""

    PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
    LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
    MODEL_NAME = os.getenv("GOOGLE_MODEL", "gemini-2.5-flash")

    # Firebase (Optional: backend might need some keys if using admin SDK)
    FIREBASE_PROJECT_ID = os.getenv("VITE_FIREBASE_PROJECT_ID")

    @classmethod
    def get_secret(cls, secret_id: str, default: str | None = None) -> str | None:
        """Fetch a secret from Google Cloud Secret Manager."""
        if not cls.PROJECT_ID:  # pragma: no cover
            return default

        try:
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/{cls.PROJECT_ID}/secrets/{secret_id}/versions/latest"
            response = client.access_secret_version(request={"name": name})
            return response.payload.data.decode("UTF-8")  # pragma: no cover
        except Exception:  # pragma: no cover
            return default


@lru_cache
def get_config() -> Config:
    """Return a cached config instance."""
    return Config()
