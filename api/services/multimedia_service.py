"""Service for generating and storing multimodal assets."""

import logging
import os
import tempfile
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
        self.project_id = Config.PROJECT_ID
        self.location = Config.LOCATION
        self.bucket_name = Config.STORAGE_BUCKET
        self._storage_client: storage.Client | None = None
        self._tts_client: texttospeech.TextToSpeechClient | None = None
        self._imagen_model: ImageGenerationModel | None = None

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

        Args:
            prompt: The text prompt describing the infographic content.
            aspect_ratio: The desired aspect ratio (e.g., "1:1", "16:9").

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

    def _enhance_prompt(self, prompt: str) -> str:
        """Enhances the user prompt using Gemini for better Imagen results.

        Args:
            prompt: The original user-provided topic or prompt.

        Returns:
            A more descriptive prompt engineered for high-quality image generation.
        """
        if not client:
            logger.error("GenAI client not initialized. Cannot enhance prompt.")
            return prompt

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
            return response.text.strip()
        except Exception:  # pragma: no cover
            logger.warning("Prompt enhancement failed, using original prompt")
            return prompt

    def _generate_infographic_logic(self, prompt: str, aspect_ratio: str) -> str:
        """Internal logic for infographic generation."""
        enhanced_prompt = self._enhance_prompt(prompt)
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

        # Save to temp file first (use temp dir for Cloud Run write permissions)
        temp_path = os.path.join(tempfile.gettempdir(), f"temp_{uuid.uuid4()}.png")
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
        """Generates an audio MP3 guide using Text-to-Speech and uploads to GCS.

        Args:
            text: The script text to convert to speech.
            language_code: BCP-47 language tag (e.g., "hi-IN", "en-US").

        Returns:
            The public URL of the synthesized MP3 file, or empty string on failure.
        """
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

    def _get_cache_key(self, topic: str, language: str) -> str:
        """Generates a stable cache key for a topic and language."""
        import hashlib
        clean_topic = topic.lower().strip()
        hash_val = hashlib.sha256(f"{clean_topic}:{language}".encode()).hexdigest()
        return f"manifests/{hash_val}.json"

    def generate_multimodal_package(self, topic: str, language: str = "en") -> dict:
        """Generates a package, checking for cached versions in GCS first.

        Args:
            topic: The educational topic to generate content for.
            language: The target language code (e.g., "hi", "ta").

        Returns:
            A dictionary containing URLs for the infographic, audio, and video assets.
        """
        cache_path = self._get_cache_key(topic, language)
        bucket = self.storage_client.bucket(self.bucket_name)
        blob = bucket.blob(cache_path)

        if blob.exists():
            logger.info("[Multimedia] Cache hit for topic: %s (%s)", topic, language)
            import json
            return json.loads(blob.download_as_text())

        logger.info("[Multimedia] Cache miss for topic: %s (%s). Generating...", topic, language)

        from concurrent.futures import ThreadPoolExecutor

        lang_map = {
            "en": "en-US", "hi": "hi-IN", "te": "te-IN", "ta": "ta-IN",
            "kn": "kn-IN", "ml": "ml-IN", "bn": "bn-IN", "gu": "gu-IN",
            "mr": "mr-IN", "es": "es-ES", "fr": "fr-FR", "de": "de-DE",
        }
        tts_lang = lang_map.get(language, "en-US")

        def get_script() -> str:
            if not client:
                return f"Civic education guide for {topic} in {language}."
            try:
                resp = client.models.generate_content(
                    model=Config.MODEL_NAME,
                    contents=f"Write a 45s audio guide script about: {topic} in {language}.",
                )
                return resp.text.strip().replace("*", "").replace("#", "")
            except Exception:  # pragma: no cover
                return f"Guide on {topic}"

        with ThreadPoolExecutor(max_workers=3) as executor:
            info_future = executor.submit(self.generate_infographic, topic)
            script_future = executor.submit(get_script)

            infographic_url = info_future.result()
            detailed_script = script_future.result()
            audio_url = self.generate_audio_guide(detailed_script, tts_lang)

        result = {
            "topic": topic,
            "infographic_url": infographic_url,
            "audio_url": audio_url,
            "video_url": "https://www.youtube.com/embed/S2HAsU_wL1U",
            "script_preview": detailed_script[:200] + "...",
        }

        # Store in cache
        try:
            import json
            blob.upload_from_string(json.dumps(result), content_type="application/json")
            blob.make_public()
        except Exception:
            logger.debug("Failed to cache manifest")

        return result


multimedia_service = MultimediaService()
