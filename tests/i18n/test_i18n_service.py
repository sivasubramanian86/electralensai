from pathlib import Path
from unittest.mock import mock_open, patch

from api.services.i18n_service import I18nService


def test_get_app_strings_success():
    service = I18nService()
    mock_data = '{"app": {"lang_name": "Telugu", "live_greeting": "Namaskaram"}}'
    with patch("pathlib.Path.exists", return_value=True):
        with patch("builtins.open", mock_open(read_data=mock_data)):
            strings = service.get_app_strings("te")
            assert strings["lang_name"] == "Telugu"


def test_get_app_strings_missing_file():
    service = I18nService()
    with patch("pathlib.Path.exists", return_value=False):
        strings = service.get_app_strings("invalid")
        assert strings == {}


def test_get_app_strings_exception():
    service = I18nService()
    with patch("pathlib.Path.exists", return_value=True):
        with patch("builtins.open", side_effect=Exception("Read error")):
            strings = service.get_app_strings("te")
            assert strings == {}


def test_get_live_metadata_defaults():
    service = I18nService()
    with patch.object(service, "get_app_strings", return_value={}):
        name, greeting = service.get_live_metadata("en")
        assert name == "English"
        assert "Hello" in greeting


def test_get_live_metadata_unsupported():
    """Verify fallback for unsupported locale."""
    service = I18nService()
    lang_name, greeting = service.get_live_metadata("unknown")
    assert lang_name == "English"
    assert "Hello" in greeting


def test_i18n_service_custom_dir():
    """Verify initialization with a custom locales directory."""
    custom_dir = Path("tmp_locales")
    service = I18nService(locales_dir=str(custom_dir))
    assert service.locales_dir == custom_dir
