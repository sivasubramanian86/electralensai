from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from api.app import create_app


@pytest.fixture(scope="module", autouse=True)
def mock_vertex_init():
    with patch("api.app.vertexai.init"):
        yield


@pytest.fixture
def client():
    return TestClient(create_app(), raise_server_exceptions=False)


class TestMultimediaRouter:
    @patch("api.routers.multimedia_router.job_service.create_job")
    def test_generate_multimedia(self, mock_create, client) -> None:
        mock_create.return_value = "job_123"
        response = client.post(
            "/v1/multimedia/generate", json={"topic": "Election", "language": "en"}
        )
        assert response.status_code == 200
        assert response.json()["job_id"] == "job_123"
        assert response.json()["status"] == "pending"

    def test_get_job_status_not_found(self, client) -> None:
        response = client.get("/v1/multimedia/jobs/invalid")
        assert response.status_code == 404


class TestImagenRouter:
    @patch("api.routers.imagen_router.multimedia_service.generate_infographic")
    def test_generate_image(self, mock_gen, client) -> None:
        mock_gen.return_value = "http://img"
        response = client.post(
            "/v1/imagen/generate", json={"prompt": "Voter ID", "concept": "Identification"}
        )
        assert response.status_code == 200
        assert response.json()["imageUrl"] == "http://img"
        assert response.json()["concept"] == "Identification"

    @patch("api.routers.imagen_router.multimedia_service.generate_infographic")
    def test_generate_image_error(self, mock_gen, client) -> None:
        mock_gen.side_effect = Exception("Service error")
        response = client.post(
            "/v1/imagen/generate", json={"prompt": "Voter ID", "concept": "Identification"}
        )
        assert response.status_code == 500
        data = response.json()
        assert data["error"] == "Internal Server Error"
        assert "unexpected condition" in data["message"]


class TestLiveTools:
    @patch("api.live_tools.multimedia_service.generate_multimodal_package")
    @pytest.mark.asyncio
    async def test_generate_inclusive_assets(self, mock_gen) -> None:
        from api.live_tools import generate_inclusive_assets

        mock_gen.return_value = {"topic": "test"}
        result = await generate_inclusive_assets("Election")
        assert result == {"topic": "test"}

    @patch("api.live_tools.dlp_service.mask_text")
    @pytest.mark.asyncio
    async def test_verify_civic_document(self, mock_mask) -> None:
        from api.live_tools import verify_civic_document

        mock_mask.return_value = "MASKED"
        result = await verify_civic_document("Sensitive info")
        assert result == "MASKED"


class TestAgentRouterStreaming:
    @patch("api.routers.agent_router.runner.run_async")
    def test_stream_query(self, mock_run_async, client) -> None:
        async def mock_iter(*args, **kwargs):
            class MockPart:
                def __init__(self, text) -> None:
                    self.text = text

            class MockContent:
                def __init__(self, parts) -> None:
                    self.parts = parts

            class MockEvent:
                def __init__(self, text) -> None:
                    self.content = MockContent([MockPart(text)])
                    self.author = "TestAgent"

            yield MockEvent("Hello")

        mock_run_async.return_value = mock_iter()
        response = client.post("/v1/query/stream", json={"question": "Hello", "region": "US"})
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]

    @patch("api.routers.agent_router.runner.run_async")
    @patch("api.routers.agent_router.translation_service.translate_text")
    def test_stream_query_with_translation(self, mock_translate, mock_run_async, client) -> None:
        async def mock_iter(*args, **kwargs):
            class MockPart:
                def __init__(self, text) -> None:
                    self.text = text

            class MockContent:
                def __init__(self, parts) -> None:
                    self.parts = parts

            class MockEvent:
                def __init__(self, text) -> None:
                    self.content = MockContent([MockPart(text)])
                    self.author = "TestAgent"

            yield MockEvent("Hello")

        mock_run_async.return_value = mock_iter()
        mock_translate.return_value = "Namaste"
        response = client.post(
            "/v1/query/stream", json={"question": "Hello", "region": "US", "language": "hi"}
        )
        assert response.status_code == 200

    @patch("api.routers.agent_router.runner.run_async")
    def test_stream_query_error(self, mock_run_async, client) -> None:
        mock_run_async.side_effect = Exception("Agent failed")
        response = client.post("/v1/query/stream", json={"question": "Hello", "region": "US"})
        assert response.status_code == 200

    def test_query_empty_question(self, client) -> None:
        response = client.post("/v1/query", json={"question": "  ", "region": "US"})
        assert response.status_code == 422

    @patch("api.routers.agent_router.runner.run_async")
    def test_query_sync_error(self, mock_run_async, client) -> None:
        mock_run_async.side_effect = Exception("Agent failed")
        response = client.post("/v1/query", json={"question": "Hello", "region": "US"})
        assert response.status_code == 500
        data = response.json()
        assert data["error"] == "Internal Server Error"
        assert "unexpected condition" in data["message"]
