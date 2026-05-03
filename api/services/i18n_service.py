"""Internationalization service for loading local translation JSONs."""

import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


class I18nService:
    """Service for handling local i18n JSON translations."""

    BACKUP_GREETINGS = {
        "hi": ("नमस्ते! मैं आपका इलेक्ट्रा-लेंस सहायक हूँ।", "Hindi"),
        "ta": ("வணக்கம்! நான் உங்கள் எலக்ட்ரா லென்ஸ் உதவியாளர்.", "Tamil"),
        "te": ("నమస్కారం! నేను మీ ఎలక్ట్రాలెన్స్ అసిస్టెంట్.", "Telugu"),
        "kn": ("ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಎಲೆಕ್ಟ್ರಾ ಲೆನ್ಸ್ ಸಹಾಯಕ.", "Kannada"),
        "ml": ("നമസ്കാരം! ഞാൻ നിങ്ങളുടെ ഇലക്ട്രാലെൻസ് അസിസ്റ്റന്റ്.", "Malayalam"),
        "bn": ("নমস্কার! আমি আপনার ইলেক্ট্রా লেন্স সহকারী।", "Bengali"),
        "gu": ("નમસ્તે! હું તમારો ઇલેક્ટ્રા લેન્સ સહાયક છું.", "Gujarati"),
        "mr": ("नमस्कार! मी तुमचा इलेक्ट्रा लेन्स सहाय్యक आहे.", "Marathi"),
        "es": ("¡Hola! Soy tu asistente de ElectraLens.", "Spanish"),
        "fr": ("Bonjour ! Je suis votre assistant ElectraLens.", "French"),
        "de": ("Hallo! Ich bin Ihr ElectraLens-Assistent.", "German"),
    }

    def __init__(self, locales_dir: str | None = None) -> None:
        """Initialize the I18nService with absolute path resolution."""
        if locales_dir:
            self.locales_dir = Path(locales_dir)
        else:
            # Resolve absolute path relative to this file: api/services/i18n_service.py
            # Go up 2 levels to reach project root, then down to web/src/locales
            self.locales_dir = Path(__file__).parent.parent.parent / "web" / "src" / "locales"

        logger.info("I18nService initialized with locales path: %s", self.locales_dir.absolute())

    def get_app_strings(self, lang: str) -> dict:
        """Retrieves 'app' level strings for a given language."""
        # Handle regional variants (e.g. 'ta-IN' -> 'ta')
        lang_code = lang.split("-")[0].lower()
        locale_path = self.locales_dir / lang_code / "translation.json"

        try:
            if locale_path.exists():
                with open(locale_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("app", {})
            logger.warning("Locale file not found: %s", locale_path)
        except Exception:
            logger.exception("Error loading translation file for %s", lang)

        return {}

    def get_live_metadata(self, lang: str) -> tuple[str, str]:
        """Returns (lang_name, live_greeting) for the multimodal agent."""
        lang_code = lang.split("-")[0].lower()
        app_strings = self.get_app_strings(lang)

        # Fallback to hardcoded map if JSON reading failed or keys are missing
        backup_greet, backup_name = self.BACKUP_GREETINGS.get(
            lang_code, ("Hello! I am your ElectraLens Assistant.", "English")
        )

        lang_name = app_strings.get("lang_name", backup_name)
        greeting = app_strings.get("live_greeting", backup_greet)

        return lang_name, greeting


i18n_service = I18nService()
