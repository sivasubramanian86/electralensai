"""Unit tests for the Config class and Secret Manager integration."""

from unittest.mock import MagicMock, patch

from api.config import Config


def test_config_get_secret_success() -> None:
    """Verifies that secrets are correctly fetched and decoded."""
    with patch("api.config.secretmanager.SecretManagerServiceClient") as mock_client_class:
        mock_client = mock_client_class.return_value
        mock_response = MagicMock()
        mock_response.payload.data = b"secret-value"
        mock_client.access_secret_version.return_value = mock_response

        # Ensure PROJECT_ID is set
        with patch.object(Config, "PROJECT_ID", "test-project"):
            val = Config.get_secret("test-secret")
            assert val == "secret-value"


def test_config_get_secret_no_project() -> None:
    """Verifies that default is returned if no PROJECT_ID is set."""
    with patch.object(Config, "PROJECT_ID", None):
        val = Config.get_secret("test-secret", default="fallback")
        assert val == "fallback"
