"""Unit tests for the ElectraLensAI API endpoints.

Tests the health check and agent query endpoints using
FastAPI TestClient with mocked agent pipelines.
"""

from __future__ import annotations

from typing import Any, AsyncIterator
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from api.app import create_app

client = TestClient(create_app())


class TestHealthEndpoint:
    """Suite for validating the system's operational health and availability.

    Checks the primary health probe used by Cloud Run and load balancers to
    ensure the API is responsive and reporting its internal state correctly.
    """

    def test_health_returns_200(self) -> None:
        """Verify the health endpoint returns HTTP 200 OK.

        Rationale: Essential for container orchestration health checks.
        """
        response = client.get("/v1/health")
        assert response.status_code == 200

    def test_health_response_schema(self) -> None:
        """Verify the health response body adheres to the defined schema.

        Checks for the presence of 'status', 'service', and 'version' fields
        to ensure downstream consumers can parse the heartbeat.
        """
        response = client.get("/v1/health")
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ElectraLensAI"
        assert "version" in data


class TestQueryEndpoint:
    """Suite for validating the synchronous civic query processing pipeline.

    Tests the integration between the FastAPI router and the ADK runner,
    ensuring that user questions are properly handled, masked, and answered.
    """

    @patch("api.routers.agent_router.runner.run_async")
    def test_query_returns_200(self, mock_run_async: MagicMock) -> None:
        """Verify successful agent orchestration for a valid civic query.

        Args:
            mock_run_async: Mocked ADK runner to simulate LLM streaming response.

        Tests:
            - HTTP 200 status code.
            - Correct parsing of mocked generator output.
            - Answer content presence.
        """

        async def mock_iter(*args: Any, **kwargs: Any) -> AsyncIterator[Any]:
            class MockPart:
                def __init__(self, text: str) -> None:
                    self.text = text

            class MockContent:
                def __init__(self, parts: list[MockPart]) -> None:
                    self.parts = parts

            class MockEvent:
                def __init__(self, text: str) -> None:
                    self.content = MockContent([MockPart(text)])
                    self.author = "MockAgent"

            yield MockEvent("Election day is the first Tuesday of November.")

        mock_run_async.return_value = mock_iter()

        response = client.post(
            "/v1/query",
            json={"question": "When is election day?", "region": "US"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "Election day" in data["answer"]

    @patch("api.routers.agent_router.runner.run_async")
    def test_query_response_has_answer_field(self, mock_run_async: MagicMock) -> None:
        """Verify the query response schema includes all required fields.

        Checks that the non-streaming fallback correctly aggregates agent tokens
        into a structured QueryResponse object.
        """

        async def mock_iter(*args: Any, **kwargs: Any) -> AsyncIterator[Any]:
            class MockPart:
                def __init__(self, text: str) -> None:
                    self.text = text

            class MockContent:
                def __init__(self, parts: list[MockPart]) -> None:
                    self.parts = parts

            class MockEvent:
                def __init__(self, text: str) -> None:
                    self.content = MockContent([MockPart(text)])
                    self.author = "MockAgent"

            yield MockEvent("You need a valid photo ID.")

        mock_run_async.return_value = mock_iter()

        response = client.post(
            "/v1/query",
            json={"question": "What ID do I need?", "region": "US"},
        )
        data = response.json()
        assert "answer" in data
        assert "agent_used" in data

    def test_query_rejects_empty_question(self) -> None:
        """Verify input validation rejects empty or whitespace-only questions.

        Ensures that the API does not attempt to process meaningless queries.
        """
        response = client.post(
            "/v1/query",
            json={"question": "  ", "region": "US"},
        )
        # Validation error from Pydantic (422) or logic (422)
        assert response.status_code == 422

    def test_query_rejects_short_question(self) -> None:
        """Verify input validation rejects questions below the minimum character limit.

        Rationale: Queries shorter than 3 characters are typically noise or mistakes.
        """
        response = client.post(
            "/v1/query",
            json={"question": "Hi", "region": "US"},
        )
        assert response.status_code == 422

@patch("os.getenv")
def test_root_agent_live_audio_modality(mock_getenv: MagicMock) -> None:
    """Test that the root agent uses AUDIO modality when the live model is detected."""
    from google.genai import types

    from agents.root_agent import create_root_agent

    def side_effect(k: str, d: str | None = None) -> str | None:
        if k == "GOOGLE_MODEL_LIVE":
            return "gemini-live"
        return d

    mock_getenv.side_effect = side_effect
    agent = create_root_agent("gemini-live")
    assert agent.generate_content_config.response_modalities == [types.Modality.AUDIO]
