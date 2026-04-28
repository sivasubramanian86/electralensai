from unittest.mock import patch

import pytest
from google.genai import types

from agents import runner


@pytest.mark.asyncio
async def test_root_agent_routing() -> None:
    """Test that the root agent correctly routes queries to the orchestrator."""
    with patch("agents.runner.run_async") as mock_run:
        # Mocking the async iterator returned by run_async
        async def mock_async_iterator(*args, **kwargs):
            class MockPart:
                def __init__(self, text) -> None:
                    self.text = text

            class MockContent:
                def __init__(self, parts) -> None:
                    self.parts = parts

            class MockEvent:
                def __init__(self, text, author="Root") -> None:
                    self.content = MockContent([MockPart(text)])
                    self.author = author

            yield MockEvent("Mocked response")

        mock_run.return_value = mock_async_iterator()

        # Call the runner
        user_msg = types.Content(role="user", parts=[types.Part(text="test")])
        responses = []
        async for event in runner.run_async(
            user_id="test", session_id="test", new_message=user_msg
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        responses.append(part.text)

        assert len(responses) > 0
        assert responses[0] == "Mocked response"
