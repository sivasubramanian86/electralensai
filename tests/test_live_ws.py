from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from api.app import create_app

client = TestClient(create_app())

def test_live_health():
    # Use the /health endpoint from health_router or live_router
    response = client.get("/v1/health")
    # In live_router.py line 22 it returns {"status": "ok", ...}
    # But it is prefixed with /v1 in app.py? No, line 66 in app.py says tags=["Live"] without prefix?
    # Wait, app.include_router(live_router.router, tags=["Live"]) -> no prefix.
    # So it should be /health. 
    # Actually app.include_router(health_router.router, prefix="/v1", ...)
    
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@patch("api.routers.live_router.live_runner.run_live")
def test_live_ws_session_extended(mock_run_live):
    async def mock_live_iter(*args, **kwargs):
        class MockBlob:
            def __init__(self, data):
                self.data = data
        class MockPart:
            def __init__(self, text=None, data=None):
                self.text = text
                self.inline_data = MockBlob(data) if data else None
        class MockContent:
            def __init__(self, parts):
                self.parts = parts
        class MockEvent:
            def __init__(self, text=None, data=None):
                self.content = MockContent([MockPart(text=text, data=data)])
                self.usage_metadata = MagicMock(total_token_count=100)

        yield MockEvent(text="Text message")
        yield MockEvent(data=b"Audio data")

    mock_run_live.return_value = mock_live_iter()

    with client.websocket_connect("/ws/session") as websocket:
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

@patch("api.routers.live_router.live_runner.run_live")
@patch("api.routers.live_router.asyncio.sleep", new_callable=AsyncMock)
def test_live_ws_retry_exhaustion(mock_sleep, mock_run_live):
    mock_run_live.side_effect = Exception("Permanent Failure")

    with client.websocket_connect("/ws/session") as websocket:
        websocket.receive_json() # session_id
        
        # Should receive error message after 3 retries
        data = websocket.receive_json()
        assert "error" in data
        assert "Permanent Failure" in data["error"]
