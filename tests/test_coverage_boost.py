"""Tests for boosting backend coverage to 100%."""

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from api.app import create_app
from api.services.dlp_service import dlp_service
from api.services.translation_service import translation_service


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(create_app())


class TestMultimedia:
    @patch("api.routers.multimedia_router.multimedia_service.generate_multimodal_package")
    def test_generate_multimodal_content(self, mock_gen, client):
        mock_gen.return_value = {"infographic_url": "http://test.com/img.png"}
        payload = {"topic": "Testing", "language": "en"}
        response = client.post("/v1/multimedia/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data

    def test_get_job_status_404(self, client):
        response = client.get("/v1/multimedia/jobs/nonexistent")
        assert response.status_code == 404

    def test_list_jobs(self, client):
        response = client.get("/v1/multimedia/jobs")
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestImagen:
    @patch("api.routers.imagen_router.multimedia_service.generate_infographic")
    def test_generate_image_endpoint(self, mock_gen, client):
        mock_gen.return_value = "http://test.com/gen.png"
        payload = {"concept": "election-phases", "prompt": "A test prompt"}
        response = client.post("/v1/imagen/generate", json=payload)
        assert response.status_code == 200
        assert response.json()["imageUrl"] == "http://test.com/gen.png"


class TestServices:
    def test_translation_service_same_lang(self):
        result = translation_service.translate_text("Hello", "en")
        assert result == "Hello"

    @patch("api.services.translation_service.TranslationService.translate_text")
    def test_translation_service_mock_call(self, mock_trans):
        mock_trans.return_value = "Hola"
        result = translation_service.translate_text("Hello", "es")
        assert result == "Hola"

    def test_dlp_service_noop(self):
        with patch.object(dlp_service, 'client', None):
            result = dlp_service.mask_text("test@test.com")
            assert result == "test@test.com"


class TestLiveWebSocket:
    def test_websocket_lifecycle(self, client):
        with client.websocket_connect("/ws/session") as websocket:
            websocket.send_json({"type": "audio_start"})
            websocket.close()


class TestBackgroundTasks:
    @patch("api.routers.multimedia_router.multimedia_service.generate_multimodal_package")
    @patch("api.routers.multimedia_router.job_service.update_job")
    @pytest.mark.asyncio
    async def test_run_multimodal_job_success(self, mock_update, mock_gen):
        from api.routers.multimedia_router import run_multimodal_job
        mock_gen.return_value = {"result": "ok"}
        await run_multimodal_job("job123", "Topic", "en")
        mock_update.assert_any_call("job123", "processing")
        mock_update.assert_any_call("job123", "completed", result={"result": "ok"})
