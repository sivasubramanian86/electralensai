"""Service for generating and storing multimodal assets."""

import logging
import os
import uuid

import vertexai
from dotenv import load_dotenv
from google.cloud import storage, texttospeech
from vertexai.preview.vision_models import ImageGenerationModel

from api.config import Config
from api.genai_client import client

load_dotenv(override=True)
logger = logging.getLogger(__name__)


class MultimediaError(Exception):
    """Custom exception for multimedia service errors."""


class MultimediaService:
    """Service for generating and storing multimodal inclusive learning assets."""

    def __init__(self) -> None:
        """Initialize the multimedia service configuration."""
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.bucket_name = os.getenv("VITE_FIREBASE_STORAGE_BUCKET")
        self._storage_client = None
        self._tts_client = None
        self._imagen_model = None

    @property
    def storage_client(self) -> storage.Client:
        """Lazy initializer for GCS client."""
        if not self._storage_client:  # pragma: no cover
            self._storage_client = storage.Client(project=self.project_id)  # pragma: no cover
        return self._storage_client

    @storage_client.setter
    def storage_client(self, value: storage.Client) -> None:  # pragma: no cover
        """Setter for testing/dependency injection."""
        self._storage_client = value

    @property
    def tts_client(self) -> texttospeech.TextToSpeechClient:
        """Lazy initializer for TTS client."""
        if not self._tts_client:  # pragma: no cover
            self._tts_client = texttospeech.TextToSpeechClient()  # pragma: no cover
        return self._tts_client

    @tts_client.setter
    def tts_client(self, value: texttospeech.TextToSpeechClient) -> None:  # pragma: no cover
        """Setter for testing/dependency injection."""
        self._tts_client = value

    @property
    def imagen_model(self) -> ImageGenerationModel:
        """Lazy initializer for Imagen model."""
        if not self._imagen_model:  # pragma: no cover
            vertexai.init(project=self.project_id, location=self.location)
            self._imagen_model = ImageGenerationModel.from_pretrained(
                "imagen-3.0-generate-001",
            )  # pragma: no cover
        return self._imagen_model

    @imagen_model.setter
    def imagen_model(self, value: ImageGenerationModel) -> None:  # pragma: no cover
        """Setter for testing/dependency injection."""
        self._imagen_model = value

    def generate_infographic(self, prompt: str, aspect_ratio: str = "1:1") -> str:
        """Generates an infographic using Imagen 3 and uploads to GCS.

        Returns:
            The public URL of the generated image.
        """
        try:
            logger.info("Generating infographic for prompt: %s", prompt)
            return self._generate_infographic_logic(prompt, aspect_ratio)
        except Exception:
            logger.exception("Infographic generation failed")
            # Fallback placeholder
            return "https://placehold.co/600x400?text=Infographic+Error"

    def _generate_infographic_logic(self, prompt: str, aspect_ratio: str) -> str:
        """Internal logic for infographic generation."""
        if not client:
            logger.error("GenAI client not initialized. Cannot enhance prompt.")
            enhanced_prompt = prompt
        else:
            # Use Gemini to engineer a high-quality Imagen prompt
            model_id = Config.MODEL_NAME
            try:
                response = client.models.generate_content(
                    model=model_id,
                    contents=(
                        f"Create an educational infographic about: {prompt}. "
                        "Focus on inclusive design, clarity, and election iconography. "
                        "No text except headings."
                    ),
                )
                enhanced_prompt = response.text.strip()
            except Exception:
                logger.warning("Prompt enhancement failed, using original prompt")
                enhanced_prompt = prompt

        logger.info("Enhanced Imagen prompt: %s", enhanced_prompt)

        images = self.imagen_model.generate_images(
            prompt=enhanced_prompt,
            number_of_images=1,
            language="en",
            aspect_ratio=aspect_ratio,
        )

        if not images:  # pragma: no cover
            msg = "No image generated"
            raise MultimediaError(msg)

        # Upload to GCS
        file_name = f"infographics/{uuid.uuid4()}.png"
        bucket = self.storage_client.bucket(self.bucket_name)
        blob = bucket.blob(file_name)

        # Save to temp file first
        temp_path = f"temp_{uuid.uuid4()}.png"
        images[0].save(location=temp_path, include_generation_parameters=False)

        try:
            blob.upload_from_filename(temp_path)
            # Try to make public (ignore if UBLA prevents it, as long as bucket-level is set)
            try:
                blob.make_public()
            except Exception:
                logger.debug("Failed to make blob public (likely UBLA enabled)")
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)  # pragma: no cover

        # Return public URL
        url = f"https://storage.googleapis.com/{self.bucket_name}/{file_name}"
        logger.info("Infographic uploaded to: %s", url)
        return url

    def generate_audio_guide(self, text: str, language_code: str = "en-US") -> str:
        """Generates an audio MP3 guide using Text-to-Speech and uploads to GCS."""
        try:
            logger.info("Generating audio guide for text: %s...", text[:50])

            synthesis_input = texttospeech.SynthesisInput(text=text)
            voice = texttospeech.VoiceSelectionParams(
                language_code=language_code,
                ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL,
            )
            audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)

            response = self.tts_client.synthesize_speech(
                input=synthesis_input,
                voice=voice,
                audio_config=audio_config,
            )

            # Upload to GCS
            file_name = f"audio/{uuid.uuid4()}.mp3"
            bucket = self.storage_client.bucket(self.bucket_name)
            blob = bucket.blob(file_name)

            blob.upload_from_string(response.audio_content, content_type="audio/mpeg")
            try:
                blob.make_public()
            except Exception:
                logger.debug("Failed to make audio public (likely UBLA enabled)")
        except Exception:
            logger.exception("Audio generation failed")
            return ""
        else:
            url = f"https://storage.googleapis.com/{self.bucket_name}/{file_name}"
            logger.info("Audio uploaded to: %s", url)
            return url

    def generate_multimodal_package(self, topic: str, language: str = "en") -> dict:
        """Generates a complete package: Infographic and Audio Guide."""
        lang_map = {
            "en": "en-US", "hi": "hi-IN", "te": "te-IN", "ta": "ta-IN",
            "kn": "kn-IN", "ml": "ml-IN", "bn": "bn-IN", "gu": "gu-IN",
            "mr": "mr-IN", "es": "es-ES", "fr": "fr-FR", "de": "de-DE"
        }
        tts_lang = lang_map.get(language, "en-US")

        # 1. Generate infographic
        infographic_url = self.generate_infographic(topic)

        # 2. Generate script
        detailed_script = ""
        if not client:
            detailed_script = f"Civic education guide for {topic} in {language}."
        else:
            model_id = Config.MODEL_NAME
            try:
                script_response = client.models.generate_content(
                    model=model_id,
                    contents=(
                        f"Write a 60-second educational audio guide script about: {topic}. "
                        f"The target language is {language}. Tone: Encouraging and clear. "
                        "Return ONLY plain text."
                    ),
                )
                detailed_script = script_response.text.strip()
            except Exception:
                logger.warning("Script generation failed, using fallback")
                detailed_script = f"Welcome to our guide on {topic}."

        # Clean up markdown
        detailed_script = (
            detailed_script.replace("*", "").replace("#", "").replace("`", "").replace("_", "")
        )

        audio_url = self.generate_audio_guide(detailed_script, tts_lang)

        return {
            "topic": topic,
            "infographic_url": infographic_url,
            "audio_url": audio_url,
            "video_url": "https://www.youtube.com/embed/S2HAsU_wL1U",
            "script_preview": detailed_script[:200] + "...",
        }


multimedia_service = MultimediaService()
