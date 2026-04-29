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

# Initialize the global GenAI client for Google Cloud
try:
    if os.getenv("GEMINI_API_KEY"):
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    else:
        # pragma: no cover
        client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
except Exception:  # pragma: no cover
    # Fallback for CI/local testing where credentials might be missing
    client = None  # type: ignore
