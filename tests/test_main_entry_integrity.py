"""ElectraLensAI — Main Entry Integrity.

Ensures 100% coverage for the app entry point and production initialization.
"""

import os
from unittest.mock import patch

from fastapi.testclient import TestClient


def test_main_app_initialization() -> None:
    """Exercise production branches in main.py."""
    with patch.dict(os.environ, {"ENABLE_ANALYTICS": "true"}):
        from main import app

        client = TestClient(app)
        # Hit the health check
        response = client.get("/v1/health")
        assert response.status_code == 200
