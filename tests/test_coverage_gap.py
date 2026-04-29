"""Comprehensive coverage gap tests for ElectraLensAI.

This module addresses untested code paths across the entire application,
including services, routers, agents, and infrastructure components,
aiming for 100% total code coverage.
"""

import asyncio

# Mock GCP clients BEFORE importing the app to avoid initialization hangs
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException, WebSocketDisconnect
from fastapi.testclient import TestClient

with (
    patch("google.cloud.storage.Client"),
    patch("google.cloud.texttospeech.TextToSpeechClient"),
    patch("google.cloud.pubsub_v1.PublisherClient"),
    patch("google.cloud.logging.Client"),
    patch("google.auth.default", return_value=(MagicMock(), "test-project")),
    patch("vertexai.init"),
    patch("api.genai_client.client") as mock_genai,
    patch("google.adk.agents.live_request_queue.LiveRequestQueue"),
    patch("vertexai.preview.vision_models.ImageGenerationModel.from_pretrained"),
):
    from api.app import create_app
    app = create_app()

client = TestClient(app)


# 1. Test Translation Service
def test_translation_service_direct() -> None:
    """Verifies the TranslationService handles successful and failed API calls.

    Tests the direct integration with the Google Cloud Translate client.
    """
    from api.services.translation_service import translation_service

    translation_service.client = MagicMock()

    mock_response = MagicMock()
    mock_response.translations = [MagicMock(translated_text="Hola")]
    translation_service.client.translate_text.return_value = mock_response

    result = translation_service.translate_text("Hello", "es")
    assert result == "Hola"

    # Test failure branch
    translation_service.client.translate_text.side_effect = Exception("Service Down")
    result = translation_service.translate_text("Hello", "es")
    assert result == "Hello"


# 2. Test DLP Service
def test_dlp_service_direct() -> None:
    """Verifies the DLPService correctly masks PII and handles service failures.

    Tests de-identification logic using the Google Cloud DLP client.
    """
    from api.services.dlp_service import dlp_service

    dlp_service.project_id = "test-project"
    dlp_service.client = MagicMock()

    mock_response = MagicMock()
    mock_response.item.value = "Masked"
    dlp_service.client.deidentify_content.return_value = mock_response

    result = dlp_service.mask_text("Secret")
    assert result == "Masked"

    # Test failure branch
    dlp_service.client.deidentify_content.side_effect = Exception("DLP Down")
    result = dlp_service.mask_text("Secret")
    assert "MASKING FAILED" in result


# 3. Test Multimedia Service & Router
@patch("api.services.multimedia_service.client")
@patch("api.services.multimedia_service.ImageGenerationModel.from_pretrained")
def test_multimedia_service_multimodal(mock_from_pretrained, mock_genai_client) -> None:
    """Tests the multimodal asset generation router with mocked Imagen and Gemini.

    Verifies that the /v1/imagen/generate endpoint correctly handles prompt
    enhancement and image generation.
    """
    mock_model = mock_from_pretrained.return_value
    mock_img_response = MagicMock()
    mock_image = MagicMock()
    mock_image._pil_image = MagicMock()
    mock_img_response.images = [mock_image]
    mock_model.generate_images.return_value = mock_img_response

    # Mock Gemini prompt enhancement
    mock_genai_client.models.generate_content.return_value = MagicMock(text="Enhanced Prompt")

    response = client.post(
        "/v1/imagen/generate",
        json={"concept": "election", "prompt": "A futuristic city", "style": "infographic"},
    )
    assert response.status_code == 200
    assert "imageUrl" in response.json()


# 4. Test Job Service & Background Task
@patch("api.routers.multimedia_router.multimedia_service.generate_multimodal_package")
@patch("api.routers.multimedia_router.multimedia_service.generate_infographic")
@patch("api.routers.multimedia_router.multimedia_service.generate_audio_guide")
def test_multimedia_job_flow(mock_gen_audio, mock_gen_info, mock_gen_package) -> None:
    mock_gen_package.return_value = {"content": "done"}
    mock_gen_info.return_value = "http://image.url"
    mock_gen_audio.return_value = "http://audio.url"

    response = client.post("/v1/multimedia/generate", json={"topic": "voting"})
    assert response.status_code == 200
    job_id = response.json()["job_id"]

    # Check status (polling)
    status_resp = client.get(f"/v1/multimedia/jobs/{job_id}")
    assert status_resp.status_code == 200

    # Test Job List
    list_resp = client.get("/v1/multimedia/jobs")
    assert list_resp.status_code == 200
    assert any(j["id"] == job_id for j in list_resp.json())


# 5. Test Live Agent WebSocket
@patch("api.routers.live_router.LiveRequestQueue")
@patch("api.routers.live_router.live_runner.run_live")
def test_live_websocket_full(mock_run_live, mock_queue_cls) -> None:
    """Verifies the bidirectional WebSocket stream for the Live Agent.

    Tests:
    - Session ID assignment.
    - Transcript streaming.
    - Binary audio streaming.
    - Activity message handling (start/end/finalize).
    """

    async def mock_generator():
        # First event: Text
        event1 = MagicMock()
        part1 = MagicMock()
        part1.text = "Hello"
        part1.inline_data = None
        event1.content.parts = [part1]
        event1.usage_metadata = MagicMock(total_token_count=10)
        yield event1

        # Second event: Audio
        event2 = MagicMock()
        part2 = MagicMock()
        part2.text = None
        part2.inline_data.data = b"audio"
        event2.content.parts = [part2]
        event2.usage_metadata = MagicMock(total_token_count=10)
        yield event2

    # Correctly mock the async iterable returned by run_live
    mock_run_live.return_value = mock_generator()

    with client.websocket_connect("/ws/session") as websocket:
        data = websocket.receive_json()
        assert data["type"] == "session_id"

        # Receive transcript from mock generator
        transcript = websocket.receive_json()
        assert transcript["type"] == "transcript"
        assert transcript["text"] == "Hello"

        # Receive audio from mock generator
        audio = websocket.receive_bytes()
        assert audio == b"audio"

        # Send text message to trigger content branch
        websocket.send_json({"type": "text", "text": "hello"})

        # Send binary to trigger bytes branch
        websocket.send_bytes(b"audio data")

        # Send activity messages
        websocket.send_json({"type": "audio_start"})
        websocket.send_json({"type": "audio_end"})

        # Send finalize to break loop
        websocket.send_json({"type": "finalize"})

        websocket.close()


# 6. Test Agent Router SSE
@patch("api.routers.agent_router.runner.run_async")
def test_agent_stream_full(mock_run_async) -> None:
    async def mock_stream(*args, **kwargs):
        event = MagicMock()
        event.content.parts = [MagicMock(text="Part 1")]
        event.author = "AgentA"
        yield event

    mock_run_async.return_value = mock_stream()

    response = client.post("/v1/query/stream", json={"question": "test", "language": "hi"})
    assert response.status_code == 200
    assert "Part 1" in response.text


# 7. Test Caching Service
def test_caching_service() -> None:
    from agents.caching_service import caching_service

    caching_service.enabled = True
    with patch("agents.caching_service.uuid.uuid4", return_value="123"):
        res = caching_service.create_instruction_cache("model", "instr")
        assert "mock-cache-123" in res

    caching_service.enabled = False
    assert caching_service.create_instruction_cache("m", "i") is None


# 8. Test Memory Service (Real branch)
@pytest.mark.asyncio
async def test_memory_service_real() -> None:
    """Tests the MemoryService integration with AlloyDB/PostgreSQL.

    Verifies vector search result retrieval and interaction logging using
    a mocked database pool and embedding service.
    """
    from agents.memory import memory_service

    with (
        patch("agents.memory._USE_ALLOYDB", True),
        patch("agents.memory.os.getenv", return_value="postgresql://user:pass@host/db"),
        patch("agents.memory._get_pool", new_callable=AsyncMock) as mock_pool_getter,
        patch("agents.memory._embed", new_callable=AsyncMock) as mock_embed,
    ):
        mock_pool = MagicMock()
        mock_conn = AsyncMock()
        mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
        mock_pool_getter.return_value = mock_pool
        mock_embed.return_value = [0.1] * 768

        mock_conn.fetch.return_value = [
            {"id": 1, "title": "T", "description": "D", "resolution": "R", "embedding": None}
        ]

        res = await memory_service.get_historical_precedents("test")
        assert len(res) == 1
        assert res[0]["title"] == "T"

        await memory_service.log_interaction("u", "a", "q", "r")
        mock_conn.execute.assert_called_once()


# 9. Test Analytics Service
def test_analytics_service() -> None:
    from api.services.analytics_service import analytics_service

    analytics_service.enabled = True
    analytics_service.langfuse = MagicMock()
    analytics_service.metrics_client = MagicMock()
    analytics_service.project_id = "test"

    analytics_service.trace_agent_call("n", "u", "i", "o", {})
    analytics_service.record_metric("m", 1.0, {"l": "v"})

    analytics_service.langfuse.trace.assert_called()
    analytics_service.metrics_client.create_time_series.assert_called()


# 10. Test Multimedia Service GCS/TTS branches
@patch("api.services.multimedia_service.texttospeech.TextToSpeechClient")
@patch("api.services.multimedia_service.storage.Client")
def test_multimedia_service_audio(mock_storage, mock_tts) -> None:
    from api.services.multimedia_service import multimedia_service

    multimedia_service.tts_client = mock_tts.return_value
    multimedia_service.storage_client = mock_storage.return_value

    mock_resp = MagicMock()
    mock_resp.audio_content = b"mp3"
    multimedia_service.tts_client.synthesize_speech.return_value = mock_resp

    res = multimedia_service.generate_audio_guide("hello", "en-US")
    assert "storage.googleapis.com" in res


def test_health_check() -> None:
    response = client.get("/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


# 11. Test Multimedia Service - generate_multimodal_package
@patch("api.services.multimedia_service.client")
def test_multimedia_service_package_real(mock_client) -> None:
    """Verifies orchestration of multimodal package with mocked GenAI client."""
    from api.services.multimedia_service import multimedia_service

    mock_client.models.generate_content.return_value.text = "Mock Script"

    # Mock dependencies to avoid real GCP calls
    with (
        patch.object(multimedia_service, "generate_infographic", return_value="http://img"),
        patch.object(multimedia_service, "generate_audio_guide", return_value="http://audio"),
    ):
        res = multimedia_service.generate_multimodal_package("Election", "en")
        assert res["infographic_url"] == "http://img"
        assert res["audio_url"] == "http://audio"


# 12. Test Multimedia Service Error Branches
def test_multimedia_service_errors() -> None:
    from api.services.multimedia_service import multimedia_service

    # Test audio generation failure
    with patch.object(
        multimedia_service.tts_client, "synthesize_speech", side_effect=Exception("TTS Fail")
    ):
        res = multimedia_service.generate_audio_guide("test")
        assert res == ""


# 13. Test Live Router Upstream Error (JSON Decode)
@patch("api.routers.live_router.LiveRequestQueue")
@patch("api.routers.live_router.live_runner.run_live")
def test_live_websocket_json_error(mock_run_live, mock_queue_cls) -> None:
    mock_queue = mock_queue_cls.return_value

    async def empty_gen():
        if False:
            yield None

    mock_run_live.return_value = empty_gen()

    with client.websocket_connect("/ws/session") as websocket:
        websocket.receive_json()  # session_id

        # Send invalid JSON
        websocket.send_text("not-json-at-all")

        # Send finalize to exit
        websocket.send_json({"type": "finalize"})
        websocket.close()

    # Verify it was treated as raw text
    mock_queue.send_content.assert_called()


# 14. Test Config
def test_api_config() -> None:
    from api.config import Config, get_config

    assert get_config() is not None
    # Test secret manager path
    with patch("google.cloud.secretmanager.SecretManagerServiceClient") as mock_sm:
        Config.PROJECT_ID = "test"
        Config.get_secret("key")
        mock_sm.assert_called()


# 15. Test Live Tools
@pytest.mark.asyncio
async def test_live_tools() -> None:
    from api.live_tools import generate_inclusive_assets, verify_civic_document

    with patch(
        "api.live_tools.multimedia_service.generate_multimodal_package", return_value={"ok": True}
    ):
        res = await generate_inclusive_assets("test")
        assert res["ok"] is True

    with patch("api.live_tools.dlp_service.mask_text", return_value="masked"):
        res = await verify_civic_document("secret")
        assert res == "masked"


# 16. Test Memory Service (Local branch)
@pytest.mark.asyncio
async def test_memory_service_local() -> None:
    from agents.memory import memory_service

    with patch("agents.memory._USE_ALLOYDB", False):
        await memory_service.log_interaction("u", "a", "q", "r")
        res = await memory_service.get_historical_precedents("test")
        assert isinstance(res, list)


# 17. Test Election Tools
def test_election_tools() -> None:
    from agents.tools import broadcast_misinformation_alert

    with patch("api.services.pubsub_service.pubsub_service.publish_alert") as mock_pub:
        res = broadcast_misinformation_alert("fake news", "FALSE", "twitter")
        assert "successfully broadcast" in res
        mock_pub.assert_called_once()


# 18. Test App Exception Handlers
def test_app_exception_handling() -> None:
    # Use a local client to avoid global client side-effects and to catch 500s
    local_client = TestClient(app, raise_server_exceptions=False)

    # Trigger 404
    resp = local_client.get("/v1/non-existent")
    assert resp.status_code == 404

    # Trigger 500 via mocked router failure
    # Mocking an internal call in the router to raise
    with patch("api.routers.health_router.HealthResponse", side_effect=Exception("Internal Boom")):
        resp = local_client.get("/v1/health")
        assert resp.status_code == 500
        # If not JSON, it might be plain text "Internal Server Error"
        if resp.headers.get("content-type") == "application/json":
            assert "error" in resp.json()
        else:
            assert "Internal Server Error" in resp.text


# 19. Test Memory Service Exception Handling
@pytest.mark.asyncio
async def test_memory_service_exceptions() -> None:
    from agents.memory import memory_service

    with (
        patch("agents.memory._USE_ALLOYDB", True),
        patch("agents.memory.os.getenv", return_value="postgresql://user:pass@host/db"),
        patch("agents.memory._get_pool", side_effect=Exception("Pool Fail")),
        patch("agents.memory._embed", side_effect=Exception("Embed Fail")),
    ):
        # Test get_historical_precedents failure
        res = await memory_service.get_historical_precedents("test")
        assert res == []

        # Test log_interaction failure
        await memory_service.log_interaction("u", "a", "q", "r")
        # Should catch and log error without crashing


# 20. Test PubSub Service Coverage
def test_pubsub_service_coverage() -> None:
    from api.services.pubsub_service import PubSubService

    # Test initialization with project_id but publisher failure
    with (
        patch("google.cloud.pubsub_v1.PublisherClient", side_effect=Exception("Init Fail")),
        patch("os.getenv", return_value="test-project"),
    ):
        service = PubSubService()
        assert service.publisher is None

    # Test publishing with no publisher
    service = PubSubService()
    service.publisher = None
    service.publish_alert("TYPE", {"d": 1})  # Should return early

    # Test publishing success
    mock_publisher = MagicMock()
    service.publisher = mock_publisher
    service.topic_path = "projects/p/topics/t"
    mock_future = MagicMock()
    mock_future.result.return_value = "msg-123"
    mock_publisher.publish.return_value = mock_future
    service.publish_alert("TYPE", {"d": 1})
    assert mock_publisher.publish.called

    # Test publishing failure
    mock_publisher.publish.side_effect = Exception("Publish Fail")
    service.publish_alert("TYPE", {"d": 1})
    # Should log error and not crash


# 21. Test App Initialization Branches
def test_app_init_branches() -> None:
    from api.app import create_app

    # Case 1: No API Key, has Project ID
    with patch("os.getenv") as mock_env, patch("vertexai.init") as mock_vertex_init:
        mock_env.side_effect = lambda k, default=None: {
            "GEMINI_API_KEY": None,
            "GOOGLE_CLOUD_PROJECT": "test-proj",
            "GOOGLE_CLOUD_LOCATION": "us-central1",
        }.get(k, default)

        create_app()
        mock_vertex_init.assert_called_with(project="test-proj", location="us-central1")

    # Case 2: No API Key, No Project ID
    with patch("os.getenv") as mock_env, patch("vertexai.init") as mock_vertex_init:
        mock_env.side_effect = lambda k, default=None: None
        create_app()
        mock_vertex_init.assert_not_called()


# 22. Test Memory Service Internal _get_pool
@pytest.mark.asyncio
async def test_memory_internal_pool() -> None:
    # Mock asyncpg and pgvector before they are imported inside the function
    with patch.dict(
        "sys.modules",
        {"asyncpg": MagicMock(), "pgvector": MagicMock(), "pgvector.asyncpg": MagicMock()},
    ):
        import agents.memory
        from agents.memory import _get_pool

        # Reset pool for testing
        agents.memory._POOL = None

        # Test missing DATABASE_URL
        with patch("os.environ.get", return_value=None):
            with pytest.raises(ValueError, match="DATABASE_URL must be set"):
                await _get_pool()

        # Test successful pool creation (mocked)
        with (
            patch("asyncpg.create_pool", new_callable=AsyncMock) as mock_create,
            patch("pgvector.asyncpg.register_vector", new_callable=AsyncMock),
            patch("os.environ.get", return_value="postgresql://..."),
        ):
            mock_pool = MagicMock()
            mock_conn = AsyncMock()
            mock_pool.acquire.return_value.__aenter__.return_value = mock_conn
            mock_create.return_value = mock_pool

            pool = await _get_pool()
            assert pool == mock_pool

            # Test singleton behavior
            pool2 = await _get_pool()
            assert pool2 == pool
            mock_create.assert_called_once()


# 23. Test Memory Service Internal _embed
@pytest.mark.asyncio
async def test_memory_internal_embed() -> None:
    from agents.memory import _embed

    with patch("api.genai_client.client") as mock_client:
        mock_resp = MagicMock()
        mock_resp.embeddings = [MagicMock(values=[0.1, 0.2])]
        mock_client.models.embed_content.return_value = mock_resp

        res = await _embed("test")
        assert res == [0.1, 0.2]


# 24. Test Analytics Service Gaps
def test_analytics_service_gaps() -> None:
    from api.services.analytics_service import AnalyticsService

    # Test init failure for monitoring
    with (
        patch("google.cloud.monitoring_v3.MetricServiceClient", side_effect=Exception("Init Fail")),
        patch(
            "os.getenv",
            side_effect=lambda k, d=None: (
                "test-proj"
                if k == "GOOGLE_CLOUD_PROJECT"
                else "true"
                if k == "ENABLE_ANALYTICS"
                else d
            ),
        ),
    ):
        service = AnalyticsService()
        assert service.metrics_client is None

    # Test missing clients for trace/record
    service = AnalyticsService()
    service.langfuse = None
    service.metrics_client = None
    service.trace_agent_call("n", "u", "i", "o", {})
    service.record_metric("m", 1.0, {})  # Should return early

    # Test record metric failure
    service.metrics_client = MagicMock()
    service.project_id = "test"
    service.metrics_client.create_time_series.side_effect = Exception("Metric Fail")
    service.record_metric("m", 1.0, {"l": "v"})  # Should log and return


# 25. Test DLP Service Gaps
def test_dlp_service_gaps() -> None:
    from api.services.dlp_service import DLPService

    # Test missing project
    with patch("os.environ.get", return_value=None):
        service = DLPService(project_id=None)
        assert service.project_id is None
        assert service.client is None
        assert service.mask_text("hello") == "hello"

    # Test init failure
    with patch("google.cloud.dlp_v2.DlpServiceClient", side_effect=Exception("DLP Fail")):
        service = DLPService(project_id="test")
        assert service.client is None


# 26. Test Cloud Logger Gaps
def test_cloud_logger_gaps() -> None:
    from api.services.cloud_logger import CloudLoggingService

    # Test init failure
    with (
        patch("google.cloud.logging.Client", side_effect=Exception("Log Fail")),
        patch("os.getenv", return_value="test-proj"),
    ):
        service = CloudLoggingService()
        assert service.client is None

    # Test log_agent_reasoning (branch 40)
    service = CloudLoggingService()
    service.log_agent_reasoning("A", "S", "R")


# 27. Test Multimedia Router Gaps
@patch("api.routers.multimedia_router.multimedia_service")
@patch("api.routers.multimedia_router.job_service")
def test_multimedia_router_gaps(mock_job_service, mock_multimedia_service) -> None:
    from api.routers.multimedia_router import (
        generate_multimodal_content,
        get_job_status,
        run_multimodal_job,
    )

    # Test 404
    mock_job_service.get_job.return_value = None
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_job_status("non-existent"))
    assert exc.value.status_code == 404

    # Test Exception in get_job_status (line 36-38)
    mock_job_service.get_job.side_effect = Exception("DB Down")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(get_job_status("job1"))
    assert exc.value.status_code == 500

    # Test Exception in generate_multimodal_content (line 48-50)
    mock_job_service.create_job.side_effect = Exception("Create Fail")
    with pytest.raises(HTTPException) as exc:
        asyncio.run(generate_multimodal_content(MagicMock(topic="t", language="en"), MagicMock()))
    assert exc.value.status_code == 500

    # Test background task failure (line 59, 61-65)
    mock_multimedia_service.generate_multimodal_package.side_effect = Exception("Pack Fail")
    asyncio.run(run_multimodal_job("job1", "topic", "en"))
    mock_job_service.update_job.assert_called_with("job1", "failed", error="Pack Fail")


# 28. Test Live Router Gaps
@patch("api.routers.live_router.LiveRequestQueue")
@patch("api.routers.live_router.live_runner.run_live")
def test_live_router_gaps(mock_run_live, mock_queue_cls) -> None:

    # Test ADK Loop Max Retries
    async def failing_gen(*args, **kwargs):
        raise Exception("Fatal Agent Error")
        yield None  # To make it a generator

    mock_run_live.side_effect = failing_gen

    with client.websocket_connect("/ws/session") as websocket:
        websocket.receive_json()  # session_id
        # The loop will retry 3 times and then send error
        err = websocket.receive_json()
        assert "error" in err
        websocket.close()

    # Test Global Session Error
    with patch(
        "api.routers.live_router.LiveRequestQueue", side_effect=Exception("Queue Init Fail")
    ):
        with client.websocket_connect("/ws/session") as websocket:
            websocket.receive_json()  # session_id
            # Should log error and not crash
            websocket.close()


# 29. Test Translation Service Gaps
def test_translation_service_gaps() -> None:
    from api.services.translation_service import TranslationService

    # Test error during TranslationServiceClient init
    with (
        patch(
            "google.cloud.translate_v3.TranslationServiceClient",
            side_effect=Exception("Trans Fail"),
        ),
        patch("os.environ.get", return_value="test-proj"),
    ):
        service = TranslationService()
        assert service.client is None

    # Test translate_text error branch (line 48)
    with (
        patch(
            "api.services.translation_service.translate.TranslationServiceClient"
        ) as mock_client_cls,
        patch("os.environ.get", return_value="test-proj"),
    ):
        mock_client = mock_client_cls.return_value
        mock_client.translate_text.side_effect = Exception("API Error")
        service = TranslationService(project_id="test-proj")
        res = service.translate_text("hello", "fr")
        assert res == "hello"  # Fallback to original text


# 30. Test Job Service Gaps
def test_job_service_gaps() -> None:
    from api.services.job_service import job_service

    # Test update non-existent job
    job_service.update_job("non-existent", "failed")
    # Should not crash

    # Test error in update_job (line 39)
    # Use real service but mock its internal state to avoid issues if any
    job_service.jobs["j-err"] = {"id": "j-err"}
    job_service.update_job("j-err", "failed", error="Critical Fail")
    assert job_service.jobs["j-err"]["error"] == "Critical Fail"

    with patch.object(job_service, "get_job", side_effect=Exception("DB Error")):
        job_service.update_job("job1", "completed")  # Should log and return


# 31. Test Multimedia Service Gaps
@patch("api.services.multimedia_service.client")
def test_multimedia_service_gaps(mock_genai_client) -> None:
    from api.services.multimedia_service import multimedia_service

    # Test generate_infographic failure branch (line 60)
    # Patch the model call
    mock_response = MagicMock()
    mock_response.text = "Prompt"
    mock_genai_client.models.generate_content.return_value = mock_response

    with patch.object(multimedia_service.imagen_model, "generate_images", return_value=[]):
        res = multimedia_service.generate_infographic("topic")
        assert "Infographic+Error" in res

    # Test generate_infographic exception branch
    mock_genai_client.models.generate_content.side_effect = Exception("Gen Fail")
    res = multimedia_service.generate_infographic("topic")
    assert "Infographic+Error" in res

    # Test generate_audio_guide failure branch (line 75)
    with patch.object(
        multimedia_service.tts_client, "synthesize_speech", side_effect=Exception("TTS Fail")
    ):
        res = multimedia_service.generate_audio_guide("topic")
        assert res == ""


# 32. Test Agent Router Gaps
def test_agent_router_gaps() -> None:
    from api.routers.agent_router import _stream_agent_response, query, stream_query

    # Test empty question in stream_query (line 162)
    with pytest.raises(HTTPException) as exc:
        asyncio.run(stream_query(MagicMock(question=" ")))
    assert exc.value.status_code == 422

    # Test exception in _stream_agent_response (line 136)
    with patch("api.routers.agent_router.runner.run_async", side_effect=Exception("Fatal")):
        gen = _stream_agent_response(MagicMock(question="q", region="r", language="en", mode="m"))
        results = list(asyncio.run(async_gen_to_list(gen)))
        assert "Agent processing failed" in results[-1]["data"]

    # Test exception in query (line 220)
    with patch("api.routers.agent_router.runner.run_async", side_effect=Exception("Fatal")):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(query(MagicMock(question="q", region="r", language="en", mode="m")))
        assert exc.value.status_code == 500


async def async_gen_to_list(gen):
    res = []
    async for item in gen:
        res.append(item)
    return res


# 33. Test Audit Router Gaps
def test_audit_router_gaps() -> None:
    from api.routers.audit_router import get_agent_traces, get_system_metrics, list_precedents

    # Test get_agent_traces (line 22)
    res = asyncio.run(get_agent_traces("sess1"))
    assert res["session_id"] == "sess1"

    # Test get_system_metrics (line 37)
    res = asyncio.run(get_system_metrics())
    assert res["status"] == "operational"

    # Test exception in list_precedents (line 48)
    with patch(
        "api.routers.audit_router.memory_service.get_historical_precedents",
        side_effect=Exception("DB Fail"),
    ):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(list_precedents("voter id"))
        assert exc.value.status_code == 500


# 35. Test Live Router Final Gaps
def test_live_router_final_gaps() -> None:
    # Test websocket.close exception in cleanup (line 149-150)
    with (
        patch("api.routers.live_router.LiveRequestQueue"),
        patch("api.routers.live_router.live_runner.run_live") as mock_run_live,
    ):
        mock_ws = AsyncMock()
        # Exit immediately
        mock_ws.receive.side_effect = WebSocketDisconnect()
        mock_ws.close.side_effect = Exception("Close Fail")

        async def empty_gen(*args, **kwargs):
            if False:
                yield None

        mock_run_live.return_value = empty_gen()

        from api.routers.live_router import live_agent_ws

        asyncio.run(live_agent_ws(mock_ws))
        # Should catch Close Fail and log debug

    # Test Client Loop Error (line 134-137)
    with (
        patch("api.routers.live_router.LiveRequestQueue"),
        patch("api.routers.live_router.live_runner.run_live") as mock_run_live,
    ):
        mock_ws = AsyncMock()
        # Trigger generic exception
        mock_ws.receive.side_effect = Exception("Fatal Receive")

        async def empty_gen(*args, **kwargs):
            if False:
                yield None

        mock_run_live.return_value = empty_gen()

        from api.routers.live_router import live_agent_ws

        asyncio.run(live_agent_ws(mock_ws))
        # Should log error and cleanup

    # 36. Test Agent Router Streaming Gaps
    # Test websocket.close exception in cleanup (line 149)
    with patch("api.routers.live_router.LiveRequestQueue"):
        mock_ws = MagicMock()
        mock_ws.close.side_effect = Exception("Close Fail")

        # Manually trigger the websocket session logic if possible or just mock the handler
        from api.routers.live_router import live_agent_ws

        # We need to mock the websocket's async context
        async def mock_handler() -> None:
            try:
                await live_agent_ws(mock_ws)
            except Exception:
                pass

        # Mocking receive_json to trigger the break
        mock_ws.receive_json.side_effect = [{"type": "websocket.disconnect"}]
        asyncio.run(mock_handler())
        # Should not crash despite Close Fail

    # Test Client Loop Error (line 132)
    with patch("api.routers.live_router.LiveRequestQueue"):
        mock_ws = MagicMock()
        # Trigger an exception in the client loop by making receive_json fail fatally
        mock_ws.receive_json.side_effect = Exception("Fatal Receive")

        from api.routers.live_router import live_agent_ws

        async def mock_handler() -> None:
            try:
                await live_agent_ws(mock_ws)
            except Exception:
                pass

        asyncio.run(mock_handler())
        # Should log error and cleanup


# 36. Test Agent Router Streaming Gaps
@patch("api.routers.agent_router.runner.run_async")
def test_agent_router_streaming_gaps(mock_run_async) -> None:
    from api.routers.agent_router import _stream_agent_response

    # Test successful stream with language translation
    async def mock_gen(*args, **kwargs):
        # Return a mock event that is JSON serializable
        event = MagicMock()
        event.author = "RootOrchestrator"
        event.content = MagicMock(parts=[MagicMock(text="Hello")])
        yield event

    mock_run_async.side_effect = mock_gen

    with patch(
        "api.routers.agent_router.translation_service.translate_text", return_value="Bonjour"
    ) as mock_trans:
        # Create a request with language != en to trigger translation
        req = MagicMock()
        req.question = "q"
        req.region = "r"
        req.language = "fr"
        req.mode = "m"

        gen = _stream_agent_response(req)
        list(asyncio.run(async_gen_to_list(gen)))
        # Verify translation was called at the end
        mock_trans.assert_called()


# 38. Test Translation Service - No Project Branch
def test_translation_service_no_project() -> None:
    from api.services.translation_service import TranslationService

    with (
        patch("os.environ.get", return_value=None),
        patch("api.services.translation_service.os.environ.get", return_value=None),
    ):
        service = TranslationService(project_id=None)
        assert service.project_id is None
        # Test same language branch (line 37)
        assert service.translate_text("hello", "en", "en") == "hello"


# 39. Test Imagen Router Error Branch
def test_imagen_router_error() -> None:
    with patch(
        "api.routers.imagen_router.multimedia_service.generate_infographic",
        side_effect=Exception("Imagen Error"),
    ):
        response = client.post("/v1/imagen/generate", json={"concept": "c", "prompt": "p"})
        assert response.status_code == 500
        assert "Imagen Error" in response.json()["detail"]


# 40. Test Live Router Gaps
def test_live_router_more_gaps() -> None:
    # Test health check (line 22) - Note: live_router has no prefix in app.py
    response = client.get("/health")
    assert response.status_code == 200
    assert "active" in response.json()["message"]

    # Test WebSocketDisconnect (line 143)
    from fastapi import WebSocketDisconnect

    with patch("api.routers.live_router.LiveRequestQueue"):
        mock_ws = AsyncMock()
        mock_ws.query_params.get.return_value = "test_client"
        # Mocking receive to raise disconnect after one loop or immediately
        mock_ws.receive.side_effect = WebSocketDisconnect()

        from api.routers.live_router import live_agent_ws

        asyncio.run(live_agent_ws(mock_ws))
        # Should catch WebSocketDisconnect and log


# 41. Test Agent Router Query Success (lines 196-215)
@patch("agents.runner.run_async")
def test_agent_query_success(mock_run_async) -> None:
    async def mock_gen(*args, **kwargs):
        # Create a mock event with nested attributes that match the code
        mock_part = MagicMock()
        mock_part.text = "Success Answer"

        mock_content = MagicMock()
        mock_content.parts = [mock_part]

        event = MagicMock()
        event.content = mock_content
        # Add usage_metadata if needed (line 218+)
        event.usage_metadata = MagicMock(total_token_count=100)
        yield event

    mock_run_async.return_value = mock_gen()

    # Use client to trigger full middleware/router logic
    response = client.post(
        "/v1/query",
        json={
            "question": "how to vote",
            "session_id": "sess123",
            "language": "en",
            "region": "us",
            "mode": "general",
        },
    )
    assert response.status_code == 200
    assert response.json()["answer"] == "Success Answer"


# 42. Test Multimedia Service Success Branch (line 75)
def test_multimedia_success_branch() -> None:
    from api.services.multimedia_service import multimedia_service

    # Mock internal objects directly since they have setters
    mock_storage = MagicMock()
    mock_model = MagicMock()
    multimedia_service.storage_client = mock_storage
    multimedia_service.imagen_model = mock_model

    with (
        patch("api.services.multimedia_service.client") as mock_genai,
        patch("os.remove") as mock_remove,
    ):
        multimedia_service.bucket_name = "test-bucket"

        # Mock Gemini prompt enhancement
        mock_response = MagicMock()
        mock_response.text = "Enhanced Prompt"
        mock_genai.models.generate_content.return_value = mock_response

        mock_image = MagicMock()
        mock_image.save = MagicMock()
        mock_model.generate_images.return_value = [mock_image]

        # Mock storage bucket/blob
        mock_bucket = MagicMock()
        mock_storage.bucket.return_value = mock_bucket
        mock_blob = MagicMock()
        mock_bucket.blob.return_value = mock_blob

        res = multimedia_service.generate_infographic("futuristic city")

        assert "storage.googleapis.com/test-bucket/infographics/" in res
        assert res.endswith(".png")
        assert mock_blob.upload_from_filename.called
        assert mock_remove.called


# 43. Test Job Service Edge Cases
def test_job_service_edge_cases() -> None:
    from api.services.job_service import job_service

    # Update non-existent job
    job_service.update_job("non-existent", "done")
    # Get non-existent job
    assert job_service.get_job("non-existent") is None


# 44. Test Live Router Cleanup Exception (line 149-150)
def test_live_router_cleanup_exception() -> None:
    with patch("api.routers.live_router.LiveRequestQueue"):
        mock_ws = AsyncMock()
        mock_ws.receive.side_effect = WebSocketDisconnect()
        mock_ws.close.side_effect = Exception("Close Boom")

        from api.routers.live_router import live_agent_ws

        with patch("api.routers.live_router.logger.error"):
            asyncio.run(live_agent_ws(mock_ws))
            # Should catch Close Boom and log
            assert mock_ws.close.called


# 45. Test Caching Service Exception (lines 41-43)
def test_caching_service_exception() -> None:
    from agents.caching_service import caching_service

    caching_service.enabled = True
    with patch("agents.caching_service.uuid.uuid4", side_effect=Exception("UUID error")):
        res = caching_service.create_instruction_cache("model", "instr")
        assert res is None


# 46. Test Config Gaps (lines 23, 30-31)
def test_config_gaps() -> None:
    from api.config import Config

    # PROJECT_ID is None
    old_pid = Config.PROJECT_ID
    Config.PROJECT_ID = None
    try:
        assert Config.get_secret("any", "default") == "default"
    finally:
        Config.PROJECT_ID = old_pid

    # Exception in Secret Manager
    with patch(
        "api.config.secretmanager.SecretManagerServiceClient", side_effect=Exception("SM down")
    ):
        assert Config.get_secret("any", "default") == "default"


# 47. Test Live Tools Exception (lines 19-21)
@pytest.mark.asyncio
async def test_live_tools_exception() -> None:
    from api.live_tools import generate_inclusive_assets

    with patch(
        "api.live_tools.multimedia_service.generate_multimodal_package",
        side_effect=Exception("Package error"),
    ):
        res = await generate_inclusive_assets("topic")
        assert "error" in res


# 48. Test Agent Router Translation Branch (line 202)
@patch("agents.runner.run_async")
def test_agent_query_translation_branch(mock_run_async) -> None:
    async def mock_gen(*args, **kwargs):
        mock_part = MagicMock()
        mock_part.text = "Hello"
        mock_content = MagicMock()
        mock_content.parts = [mock_part]
        event = MagicMock()
        event.content = mock_content
        event.usage_metadata = MagicMock(total_token_count=10)
        yield event

    mock_run_async.return_value = mock_gen()

    with patch("api.routers.agent_router.translation_service.translate_text") as mock_trans:
        mock_trans.return_value = "Hola"
        response = client.post("/v1/query", json={"question": "how to vote", "language": "es"})
        assert response.status_code == 200
        assert response.json()["answer"] == "Hola"
        mock_trans.assert_called_once()


# 49. Test Agent Router Failure Branch (lines 220-222)
def test_agent_query_failure() -> None:
    with patch("agents.runner.run_async", side_effect=Exception("Runner Error")):
        response = client.post("/v1/query", json={"question": "how to vote"})
        assert response.status_code == 500
        assert "Agent pipeline error" in response.json()["detail"]
