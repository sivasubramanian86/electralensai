"""ElectraLensAI — Root agent package.

Exports the primary `root_agent` SequentialAgent that routes
user queries to the appropriate specialist sub-agent.
"""

import os

from google.adk import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService

from agents.root_agent import create_root_agent

# 1. Standard Runner (for generateContent / SSE / static assets)
# Uses GOOGLE_MODEL_FLASH (gemini-2.5-flash)
root_agent = create_root_agent()
runner = Runner(
    app_name="ElectraLensAI",
    agent=root_agent,
    session_service=InMemorySessionService(),
    auto_create_session=True,
)

# 2. Live Runner (for Multimodal Live WebSocket)
# Uses GOOGLE_MODEL_LIVE (gemini-live-2.5-flash-native-audio)
live_agent = create_root_agent(model_name=os.getenv("GOOGLE_MODEL_LIVE"))
live_runner = Runner(
    app_name="ElectraLensAI_Live",
    agent=live_agent,
    session_service=InMemorySessionService(),
    auto_create_session=True,
)

__all__ = ["root_agent", "live_agent", "runner", "live_runner"]
