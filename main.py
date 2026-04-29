"""ElectraLensAI — ASGI server entrypoint.

Starts the Uvicorn server for local development and
serves as the Cloud Run container CMD target.
"""

from __future__ import annotations

import logging
import os
import warnings

import uvicorn
from dotenv import load_dotenv

# Suppress library deprecation noise and experimental feature warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message=".*EXPERIMENTAL.*")
warnings.filterwarnings("ignore", message=".*deprecated as of June 24, 2025.*")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

load_dotenv(override=True)

# ─────────────────────────────────────────────────────────────────
# Auth Mode Selection (Vertex AI vs. AI Studio)
# ─────────────────────────────────────────────────────────────────
# We prioritize Vertex AI if credentials or the explicit flag is set.
# This ensures native-audio models on Vertex function correctly.
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") or os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "1":
    print("Initializing in Vertex AI Mode (Enterprise Auth)")
else:
    if os.getenv("GEMINI_API_KEY"):
        print("Initializing in Developer API Mode (AI Studio Auth)")
        # Popping these prevents the SDK from auto-defaulting to Vertex AI mode
        os.environ.pop("GOOGLE_CLOUD_PROJECT", None)
        os.environ.pop("GOOGLE_CLOUD_LOCATION", None)

from api.app import create_app  # noqa: E402

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # nosec B104 # noqa: S104
        port=8082,
        ws_ping_interval=60,
        ws_ping_timeout=60,
        log_level="info",
        reload=False,
    )
