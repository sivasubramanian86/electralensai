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
    - PubSubService early return when not configured.
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
    # Using tuple of patches to keep line length short
    with (
        patch("google.cloud.texttospeech.TextToSpeechClient") as mock_tts_cls,
        patch("google.cloud.storage.Client") as mock_storage_cls,
        patch("vertexai.init"),
    ):
        # Patch the model call separately to avoid long line
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

    # 3. PubSub Service early return
    service = PubSubService()
    service.project_id = None  # Ensure lazy init doesn't kick in
    service._publisher = None
    service.publish_alert("TYPE", {})  # Should hit early return branch

    # 4. Analytics Service exception branches
    service = AnalyticsService()
    service.langfuse = MagicMock()
    service.langfuse.trace.side_effect = Exception("Boom")
    service.trace_agent_call("n", "u", "i", "o", {})  # Hits trace exception branch

    service.metrics_client = MagicMock()
    service.project_id = "test"
    service.metrics_client.create_time_series.side_effect = Exception("Boom")
    service.record_metric("m", 1.0, {})  # Hits metric exception branch


def test_genai_client_reload_coverage() -> None:
    """Tests GenAI client initialization branches and fallback mechanisms.

    Uses module reloading to verify logic triggered by environment variables
    and exception branches during global client initialization.
    """
    import api.genai_client

    # Test vertex initialization branch (no GEMINI_API_KEY)
    with patch("os.getenv") as mock_getenv:
        mock_getenv.side_effect = lambda k, d=None: {
            "GEMINI_API_KEY": None,
            "GOOGLE_CLOUD_PROJECT": "p",
            "GOOGLE_CLOUD_LOCATION": "l",
        }.get(k, d)
        # Patch the Client inside the module's namespace
        with patch("api.genai_client.genai.Client") as mock_client_cls:
            importlib.reload(api.genai_client)
            mock_client_cls.assert_called_with(vertexai=True, project="p", location="l")

    # Test initialization exception branch
    with patch("api.genai_client.genai.Client", side_effect=Exception("Fail")):
        importlib.reload(api.genai_client)
        assert api.genai_client.client is None


def test_root_agent_audio_modality_coverage() -> None:
    """Tests modality configuration in the Root Orchestrator agent.

    Verifies that the agent correctly switches to AUDIO modality when the
    specified model is configured as a live model.
    """
    from agents.root_agent import create_root_agent

    with patch.dict(os.environ, {"GOOGLE_MODEL_LIVE": "live-model"}):
        agent = create_root_agent("live-model")
        # Verify modality is set to AUDIO for live models
        assert agent.generate_content_config.response_modalities == [types.Modality.AUDIO]
