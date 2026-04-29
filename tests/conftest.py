from unittest.mock import patch

import pytest


@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    """Set dummy environment variables for tests."""
    monkeypatch.setenv("GOOGLE_CLOUD_PROJECT", "test-project")
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("USE_ALLOYDB", "false")

@pytest.fixture(autouse=True, scope="session")
def mock_clients():
    """Mock Google Cloud clients at the session level to prevent auth errors."""
    with patch("google.cloud.dlp_v2.DlpServiceClient"), \
         patch("google.cloud.translate_v3.TranslationServiceClient"), \
         patch("google.cloud.logging.Client"), \
         patch("vertexai.init"):
        yield
