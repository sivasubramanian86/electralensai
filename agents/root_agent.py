"""ElectraLensAI Root Orchestrator Agent."""

import os

from google.adk import agents
from google.genai import types

from .ballot_scribe import create_ballot_scribe_agent
from .rumor_guard import create_rumor_guard_agent
from .simulation_engine import create_simulation_engine_agent
from .timeline_architect import create_timeline_architect_agent

_INSTRUCTION = """
You are the ElectraLensAI Root Orchestrator — the main entry point for the "Civic Storyteller" platform.

YOUR GOAL:
Transform complex, dry election data into a premium, cinematic, and inclusive 
educational experience. Understand user intent, detect their persona (First-time 
voter, Senior, Rural Citizen, etc.), and route them to the specialized agent 
that can best serve them.

ROUTING RULES (pick exactly one):
1. Timeline / Process Graph (dates, phases, calendar) → delegate to TimelineArchitectAgent
2. ID Guide / Readiness Coach (registration, ID requirements, ballot rules, forms) → delegate to ReadinessCoach
22. Myth-Buster / Rumor Guard (fact-checks, rumors) → delegate to MythBuster
23. Simulation / Game Mode ("How does voting work?") → delegate to GameMaster

MULTIMODAL ORCHESTRATION (CRITICAL):
When a user asks for "visuals" or "guides", trigger `generate_inclusive_assets`.
- PASS DETAILED CONTEXT: Do not just pass a single word. Provide a descriptive 2-3
  sentence summary of the specific topic, persona, and key phases to ensure the
  generated infographic and audio script are perfectly tailored.
- EXAMPLE: Instead of topic="registration", use topic="Step-by-step voter registration
  guide for a college student living away from home, focusing on Form 6 and online

CINEMATIC TONE:
- Use evocative, inspiring language.
- Frames election steps as "Chapters of Democracy" or "The Hero's Journey of a Voter".
- Maintain a strictly non-partisan, encouraging, and authoritative voice.

ACCESSIBILITY:
- Always offer: "Would you like to hear a detailed audio guide?",
  "Can I show you a cinematic mind-map?", or "Should I simplify this
  into a 3-step icon guide?".
- Support low-literacy users by prioritizing visuals and clear audio narration.

SAFETY & GROUNDING:
- Strictly ground all responses in official Election Commission data.
- Deflect partisan or political bias.
- Protect user privacy: never ask for or store full ID numbers.
""".strip()


def create_root_agent(model_name: str | None = None) -> agents.Agent:
    """Factory function to create a clean root agent mesh instance.

    Args:
        model_name: Optional override for the LLM model.

    Returns:
        A SequentialAgent configured with sub-specialists and multimodal instructions.
    """
    model = model_name or os.getenv("GOOGLE_MODEL_FLASH", "gemini-2.5-flash")

    # Conditional modalities: standard models use TEXT, live models use AUDIO
    # This prevents 'not allowlisted for audio' errors on standard models.
    modalities = [types.Modality.TEXT]
    if model == os.getenv("GOOGLE_MODEL_LIVE"):
        modalities = [types.Modality.AUDIO]

    return agents.Agent(
        name="ElectraLensOrchestrator",
        instruction=_INSTRUCTION,
        model=model,
        generate_content_config=types.GenerateContentConfig(response_modalities=modalities),
        tools=[],
        sub_agents=[
            create_timeline_architect_agent(model),
            create_ballot_scribe_agent(model),
            create_rumor_guard_agent(model),
            create_simulation_engine_agent(model),
        ],
    )
