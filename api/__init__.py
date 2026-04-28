"""ElectraLensAI — API package.

Exports the FastAPI application factory for server startup
and Cloud Run container entrypoint.
"""

from api.app import create_app

__all__ = ["create_app"]
