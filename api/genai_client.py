"""Google GenAI client initialization."""

import os

from dotenv import load_dotenv
from google import genai
from google.api_core import retry

# Ensure environment is loaded with override
load_dotenv(override=True)

# Configuration for enterprise-grade resilience
_RETRY_CONFIG = retry.Retry(
    initial=1.0,
    maximum=60.0,
    multiplier=2.0,
    predicate=retry.if_exception_type(
        Exception,  # In production, refine to specific GenAI/API errors
    ),
)

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")

# Export the retry policy for use in agent runners
RETRY_POLICY = _RETRY_CONFIG

# Initialize the global GenAI client
try:
    # Prioritize Vertex AI if requested, if credentials are set, or as a fallback
    api_key = os.getenv("GEMINI_API_KEY")
    use_vertex = (
        os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "1"
        or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        or not api_key
    )

    if use_vertex:
        client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
    else:
        # If not using Vertex, we MUST have an API Key (checked by logic above)
        client = genai.Client(api_key=api_key)  # pragma: no cover
except Exception:  # pragma: no cover
    # Fallback for CI/local testing where credentials might be missing
    client = None  # type: ignore
