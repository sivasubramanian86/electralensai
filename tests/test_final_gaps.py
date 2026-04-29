"""Final coverage gap tests for ElectraLensAI services and agents.

This module targets specific edge cases and branch coverage gaps identified
during the 100% coverage audit, including lazy initializers, exception
handling branches, and specialized agent configurations.
"""

import importlib
import os
from unittest.mock import MagicMock, patch

from google.genai import types

from api.services.analytics_service import AnalyticsService
from api.services.cloud_logger import CloudLoggingService
from api.services.multimedia_service import MultimediaService
from api.services.pubsub_service import PubSubService


def test_final_coverage_gaps() -> None:
    """Tests remaining coverage gaps in cloud services and logging.

    Covers:
    - CloudLogger success branch and setter.
    - MultimediaService lazy initializers for TTS, GCS, and Imagen.
    - PubSubService early return and success initialization branches.
    - AnalyticsService exception handling for traces and metrics.
    """
    # 1. Cloud Logger success and setter
    with patch("google.cloud.logging.Client") as mock_log_cls:
        service = CloudLoggingService()
        service.project_id = "test-p"
        cl = service.client
        assert cl is not None
        mock_log_cls.assert_called()

        service.client = None
        assert service._client is None

    # 2. Multimedia Service lazy inits success
    with (
        patch("google.cloud.texttospeech.TextToSpeechClient") as mock_tts_cls,
        patch("google.cloud.storage.Client") as mock_storage_cls,
        patch("vertexai.init"),
    ):
        with patch(
            "vertexai.preview.vision_models.ImageGenerationModel.from_pretrained"
        ) as mock_imagen_cls:
            service = MultimediaService()
            service.project_id = "test-p"

            _ = service.tts_client
            mock_tts_cls.assert_called()

            _ = service.storage_client
            mock_storage_cls.assert_called()

            _ = service.imagen_model
            mock_imagen_cls.assert_called()

    # 3. PubSub Service early return and success branches
    service = PubSubService()
    service.project_id = None
    service._publisher = None
    service.publish_alert("TYPE", {})  # Hits early return

    with patch("google.cloud.pubsub_v1.PublisherClient") as mock_pub_cls:
        service.project_id = "test-p"
        mock_pub = mock_pub_cls.return_value
        _ = service.publisher  # Hits success branch lines 31-33 in pubsub_service
        mock_pub.topic_path.assert_called()

        service.publisher = None  # Test setter
        assert service._publisher is None

    # 4. Analytics Service exception branches
    service = AnalyticsService()
    service.langfuse = MagicMock()
    service.langfuse.trace.side_effect = Exception("Boom")
    service.trace_agent_call("n", "u", "i", "o", {})

    service.metrics_client = MagicMock()
    service.project_id = "test"
    service.metrics_client.create_time_series.side_effect = Exception("Boom")
    service.record_metric("m", 1.0, {})


def test_genai_client_reload_coverage() -> None:
    """Tests GenAI client initialization branches and fallback mechanisms.

    Uses module reloading to verify logic triggered by environment variables
    and exception branches during global client initialization.
    """
    import api.genai_client

    # Test API KEY success branch (line 31)
    with patch("os.getenv") as mock_getenv:
        mock_getenv.side_effect = lambda k, d=None: "test-key" if k == "GEMINI_API_KEY" else d
        with patch("api.genai_client.genai.Client") as mock_client_cls:
            importlib.reload(api.genai_client)
            mock_client_cls.assert_called_with(api_key="test-key")

    # Test vertex initialization branch (no GEMINI_API_KEY)
    with patch("os.getenv") as mock_getenv:
        mock_getenv.side_effect = lambda k, d=None: {
            "GEMINI_API_KEY": None,
            "GOOGLE_CLOUD_PROJECT": "p",
            "GOOGLE_CLOUD_LOCATION": "l",
        }.get(k, d)
        with patch("api.genai_client.genai.Client") as mock_client_cls:
            importlib.reload(api.genai_client)
            mock_client_cls.assert_called_with(vertexai=True, project="p", location="l")

    # Test initialization exception branch
    with patch("api.genai_client.genai.Client", side_effect=Exception("Fail")):
        importlib.reload(api.genai_client)
        assert api.genai_client.client is None


def test_root_agent_audio_modality_coverage() -> None:
    """Tests modality configuration in the Root Orchestrator agent."""
    from agents.root_agent import create_root_agent

    with patch.dict(os.environ, {"GOOGLE_MODEL_LIVE": "live-model"}):
        agent = create_root_agent("live-model")
        assert agent.generate_content_config.response_modalities == [types.Modality.AUDIO]
