"""Tests for maximizing multimedia service coverage and error handling saturation."""

from unittest.mock import MagicMock, patch

import pytest

from api.services.multimedia_service import MultimediaService


@pytest.fixture
def service():
    """Mocked multimedia service instance without real GCP credentials."""
    svc = MultimediaService()
    svc._storage_client = MagicMock()
    svc._tts_client = MagicMock()
    svc._imagen_model = MagicMock()
    return svc


def test_multimedia_no_client(service):
    """Cover 'if not client' branches."""
    with patch("api.services.multimedia_service.client", None):
        # 1. _generate_infographic_logic
        mock_img = MagicMock()
        service.imagen_model.generate_images.return_value = [mock_img]
        service._generate_infographic_logic("test", "1:1")

        # 2. generate_multimodal_package
        with patch.object(service, "generate_infographic"):
            with patch.object(service, "generate_audio_guide"):
                service.generate_multimodal_package("test")


def test_multimedia_make_public_failure(service):
    """Cover 'except Exception' in make_public."""
    mock_img = MagicMock()
    service.imagen_model.generate_images.return_value = [mock_img]

    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_blob.make_public.side_effect = Exception("UBLA")
    mock_bucket.blob.return_value = mock_blob
    service.storage_client.bucket.return_value = mock_bucket

    with patch("api.services.multimedia_service.client"):
        # 1. Infographic make_public failure
        service._generate_infographic_logic("test", "1:1")

        # 2. Audio make_public failure
        service.generate_audio_guide("test")


def test_multimedia_general_failure(service):
    """Cover general exception in generate_infographic."""
    with patch.object(service, "_generate_infographic_logic", side_effect=Exception("Fail")):
        url = service.generate_infographic("test")
        assert "Infographic+Error" in url
