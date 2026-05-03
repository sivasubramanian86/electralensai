"""Unit tests for ElectraLensAI services (DLP and Multimedia).

This module contains class-based tests for the core business logic services,
verifying their interaction with Google Cloud APIs and AI models.
"""

from unittest.mock import MagicMock, patch

# Mocking modules that might fail to import or initialize in test environment
with (
    patch("google.cloud.dlp_v2.DlpServiceClient"),
    patch("google.cloud.storage.Client"),
    patch("google.cloud.texttospeech.TextToSpeechClient"),
    patch("vertexai.init"),
    patch("vertexai.preview.vision_models.ImageGenerationModel.from_pretrained"),
):
    from api.services.dlp_service import DLPService
    from api.services.multimedia_service import MultimediaService


class TestDlpService:
    """Test suite for the Data Loss Prevention (DLP) service."""

    @patch("api.services.dlp_service.dlp_v2.DlpServiceClient")
    def test_mask_text_success(self, mock_dlp_client_class) -> None:
        """Verifies that PII is correctly masked when the DLP API succeeds."""
        mock_client = mock_dlp_client_class.return_value
        mock_response = MagicMock()
        mock_response.item.value = "My name is [NAME]"
        mock_client.deidentify_content.return_value = mock_response

        # Force init with project ID to trigger client creation
        service = DLPService(project_id="test-p")
        result = service.mask_text("My name is John Doe")

        assert result == "My name is [NAME]"
        mock_client.deidentify_content.assert_called_once()

    @patch("api.services.dlp_service.dlp_v2.DlpServiceClient")
    def test_mask_text_failure(self, mock_dlp_client_class) -> None:
        """Verifies that a fallback message is returned when the DLP API fails."""
        mock_client = mock_dlp_client_class.return_value
        mock_client.deidentify_content.side_effect = Exception("DLP error")

        service = DLPService(project_id="test-p")
        result = service.mask_text("My name is John Doe")

        # Should return redacted message on failure
        assert "PII MASKING FAILED" in result


class TestMultimediaService:
    """Test suite for the Multimedia generation and storage service."""

    @patch("google.cloud.storage.Client")
    @patch("google.cloud.texttospeech.TextToSpeechClient")
    @patch("vertexai.preview.vision_models.ImageGenerationModel.from_pretrained")
    @patch("api.services.multimedia_service.client")
    def test_generate_infographic_success(
        self, mock_genai_client, mock_imagen_class, mock_tts_client, mock_storage_client
    ) -> None:
        """Verifies successful infographic generation and GCS upload."""
        # Mock GenAI response for prompt enhancement
        mock_genai_response = MagicMock()
        mock_genai_response.text = "Enhanced prompt"
        mock_genai_client.models.generate_content.return_value = mock_genai_response

        # Mock Imagen
        mock_imagen_model = mock_imagen_class.return_value
        mock_image = MagicMock()
        mock_imagen_model.generate_images.return_value = [mock_image]

        # Mock Storage
        mock_bucket = mock_storage_client.return_value.bucket.return_value
        mock_blob = mock_bucket.blob.return_value

        service = MultimediaService()
        service.bucket_name = "test-bucket"

        url = service.generate_infographic("Election topic")

        assert "storage.googleapis.com/test-bucket/infographics/" in url
        mock_image.save.assert_called_once()
        mock_blob.upload_from_filename.assert_called_once()

        # Test failure fallback
        mock_imagen_model.generate_images.side_effect = Exception("Imagen fail")
        fail_url = service.generate_infographic("Fail")
        assert "placehold.co" in fail_url

    @patch("google.cloud.storage.Client")
    @patch("google.cloud.texttospeech.TextToSpeechClient")
    def test_generate_audio_guide_success(self, mock_tts_client_class, mock_storage_client) -> None:
        """Verifies successful audio guide synthesis and GCS upload."""
        mock_tts_client = mock_tts_client_class.return_value
        mock_response = MagicMock()
        mock_response.audio_content = b"audio data"
        mock_tts_client.synthesize_speech.return_value = mock_response

        # Mock Storage
        mock_bucket = mock_storage_client.return_value.bucket.return_value
        mock_blob = mock_bucket.blob.return_value

        service = MultimediaService()
        service.bucket_name = "test-bucket"

        url = service.generate_audio_guide("Hello world")

        assert "storage.googleapis.com/test-bucket/audio/" in url
        mock_blob.upload_from_string.assert_called_once_with(
            b"audio data", content_type="audio/mpeg"
        )

        # Test failure fallback
        mock_tts_client.synthesize_speech.side_effect = Exception("TTS fail")
        fail_url = service.generate_audio_guide("Fail")
        assert fail_url == ""

    @patch("google.cloud.storage.Client")
    @patch("google.cloud.texttospeech.TextToSpeechClient")
    @patch("vertexai.preview.vision_models.ImageGenerationModel.from_pretrained")
    @patch("api.services.multimedia_service.client")
    def test_generate_multimodal_package(
        self, mock_genai_client, mock_imagen_class, mock_tts_client, mock_storage_client
    ) -> None:
        """Verifies orchestration of a complete multimodal package (Image + Audio).."""
        service = MultimediaService()
        service.generate_infographic = MagicMock(return_value="http://image-url")
        service.generate_audio_guide = MagicMock(return_value="http://audio-url")

        mock_genai_response = MagicMock()
        mock_genai_response.text = "Script content"
        mock_genai_client.models.generate_content.return_value = mock_genai_response

        package = service.generate_multimodal_package("Topic", "en")

        assert package["infographic_url"] == "http://image-url"
        assert package["audio_url"] == "http://audio-url"
        assert "Script content" in package["script_preview"]


class TestAnalyticsService:
    """Test suite for the Observability and Analytics service."""

    @patch("api.services.analytics_service.Langfuse")
    @patch("api.services.analytics_service.monitoring_v3.MetricServiceClient")
    def test_analytics_trace_success(self, mock_metrics_class, mock_langfuse_class) -> None:
        """Verifies that agent calls are correctly traced to Langfuse."""
        from api.services.analytics_service import AnalyticsService

        with patch.dict(
            "os.environ",
            {
                "ENABLE_ANALYTICS": "true",
                "LANGFUSE_PUBLIC_KEY": "pk",
                "LANGFUSE_SECRET_KEY": "sk",
                "GOOGLE_CLOUD_PROJECT": "test-project",
            },
        ):
            service = AnalyticsService()
            service.trace_agent_call("test", "user", "in", "out", {})
            mock_langfuse_class.return_value.trace.assert_called_once()

    @patch("api.services.analytics_service.Langfuse")
    def test_analytics_trace_failure_silence(self, mock_langfuse_class) -> None:
        """Verifies that trace failures are caught and don't crash the app."""
        from api.services.analytics_service import AnalyticsService

        mock_langfuse_class.return_value.trace.side_effect = Exception("Trace error")
        with patch.dict(
            "os.environ",
            {"ENABLE_ANALYTICS": "true", "LANGFUSE_PUBLIC_KEY": "pk", "LANGFUSE_SECRET_KEY": "sk"},
        ):
            service = AnalyticsService()
            # Should not raise exception
            service.trace_agent_call("test", "user", "in", "out", {})

    @patch("api.services.analytics_service.monitoring_v3.MetricServiceClient")
    def test_record_metric_success(self, mock_metrics_class) -> None:
        """Verifies that metrics are correctly exported to Cloud Monitoring."""
        from api.services.analytics_service import AnalyticsService

        with patch.dict(
            "os.environ", {"ENABLE_ANALYTICS": "true", "GOOGLE_CLOUD_PROJECT": "test-project"}
        ):
            service = AnalyticsService()
            service.record_metric("test_metric", 1.0, {"label": "value"})
            mock_metrics_class.return_value.create_time_series.assert_called_once()

    @patch("api.services.analytics_service.monitoring_v3.MetricServiceClient")
    def test_record_metric_failure_silence(self, mock_metrics_class) -> None:
        """Verifies that metric export failures are caught and don't crash the app."""
        from api.services.analytics_service import AnalyticsService

        mock_metrics_class.return_value.create_time_series.side_effect = Exception("Metric error")
        with patch.dict(
            "os.environ", {"ENABLE_ANALYTICS": "true", "GOOGLE_CLOUD_PROJECT": "test-project"}
        ):
            service = AnalyticsService()
            # Should not raise exception
            service.record_metric("test_metric", 1.0, {"label": "value"})
