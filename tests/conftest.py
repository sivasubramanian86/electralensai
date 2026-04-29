"""Pytest configuration and global fixtures for ElectraLensAI.

This module provides session-level mocks for Google Cloud services and
Vertex AI to ensure tests run in an isolated environment without
requiring real credentials.
"""

from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True, scope="session")
def mock_clients():
    """Mock Google Cloud clients at the session level to prevent auth errors.

    This fixture automatically patches all major GCP client libraries used
    across the application to prevent network calls and authentication failures
    during test execution.
    """
    with (
        patch("google.cloud.dlp_v2.DlpServiceClient"),
        patch("google.cloud.translate_v3.TranslationServiceClient"),
        patch("google.cloud.logging.Client"),
        patch("google.cloud.storage.Client"),
        patch("google.cloud.texttospeech.TextToSpeechClient"),
        patch("google.cloud.pubsub_v1.PublisherClient"),
        patch("google.auth.default", return_value=(MagicMock(), "test-project")),
        patch("vertexai.init"),
        patch("api.genai_client.client"),
    ):
        yield
