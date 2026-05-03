"""Unit tests for the Gemini Multimodal Live WebSocket interface.

Tests real-time audio/text streaming via ADK LiveRunner.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.app import create_app


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(create_app())


def test_live_health(client) -> None:
    """Verify health check on the live router."""
    # Prefix is /v1 as defined in app.py, subpath /live/health
    response = client.get("/v1/live/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@patch("api.routers.live_router.Runner")
def test_live_ws_session_extended(mock_runner_class, client) -> None:
    """Verify end-to-end WebSocket session with mixed modalities."""

    async def mock_live_iter(*args, **kwargs):
        class MockBlob:
            def __init__(self, data) -> None:
                self.data = data

        class MockPart:
            def __init__(self, text=None, data=None) -> None:
                self.text = text
                self.inline_data = MockBlob(data) if data else None

        class MockContent:
            def __init__(self, parts) -> None:
                self.parts = parts

        class MockEvent:
            def __init__(self, text=None, data=None) -> None:
                self.content = MockContent([MockPart(text=text, data=data)])
                self.usage_metadata = MagicMock(total_token_count=100)

        yield MockEvent(text="Text message")
        yield MockEvent(data=b"Audio data")

    # Setup the mock instance
    mock_runner_instance = mock_runner_class.return_value
    mock_runner_instance.run_live.return_value = mock_live_iter()

    from starlette.websockets import WebSocketDisconnect

    try:
        # Prefix is /v1 as defined in app.py
        with client.websocket_connect("/v1/ws/session") as websocket:
            # 1. Session ID
            data = websocket.receive_json()
            assert data["type"] == "session_id"

            # 2. Receive text transcript
            data = websocket.receive_json()
            assert data["type"] == "transcript"
            assert data["text"] == "Text message"

            # 3. Receive binary audio
            data = websocket.receive_bytes()
            assert data == b"Audio data"

            # 4. Send non-JSON text (triggers JSONDecodeError fallback)
            websocket.send_text("Hello Native")

            # 5. Send bytes
            websocket.send_bytes(b"PCM")

            # 6. Finalize
            websocket.send_json({"type": "finalize"})
    except WebSocketDisconnect:
        pass


@patch("api.routers.live_router.Runner")
@patch("api.routers.live_router.asyncio.sleep", new_callable=AsyncMock)
def test_live_ws_retry_exhaustion(mock_sleep, mock_runner_class, client) -> None:
    """Verify WebSocket error handling after max retries."""
    mock_runner_instance = mock_runner_class.return_value
    mock_runner_instance.run_live.side_effect = Exception("Permanent Failure")

    from starlette.websockets import WebSocketDisconnect

    try:
        with client.websocket_connect("/v1/ws/session") as websocket:
            websocket.receive_json()  # session_id
            data = websocket.receive_json()
            assert "error" in data
            assert "Permanent Failure" in data["error"]
    except WebSocketDisconnect:
        pass

@patch("api.routers.live_router.Runner")
def test_live_ws_empty_events(mock_runner_class, client) -> None:
    """Verify handling of empty events/parts."""
    async def mock_empty_iter(*args, **kwargs):
        class MockEvent:
            def __init__(self, content=None) -> None:
                self.content = content

        yield MockEvent(content=None)
        class MockPart:
            def __init__(self) -> None:
                self.inline_data = None
                self.text = None
        class MockContent:
            def __init__(self) -> None:
                self.parts = [MockPart()]
        yield MockEvent(content=MockContent())

    mock_runner_instance = mock_runner_class.return_value
    mock_runner_instance.run_live.return_value = mock_empty_iter()

    with client.websocket_connect("/v1/ws/session") as websocket:
        websocket.receive_json() # session_id
        websocket.send_json({"type": "finalize"})

@patch("api.routers.live_router.Runner")
def test_live_ws_cancellation(mock_runner_class, client) -> None:
    """Verify handling of task cancellation."""
    import asyncio
    async def mock_cancel_iter(*args, **kwargs):
        raise asyncio.CancelledError()
        yield None

    mock_runner_instance = mock_runner_class.return_value
    mock_runner_instance.run_live.return_value = mock_cancel_iter()

    with client.websocket_connect("/v1/ws/session") as websocket:
        websocket.receive_json() # session_id
        websocket.send_json({"type": "finalize"})
