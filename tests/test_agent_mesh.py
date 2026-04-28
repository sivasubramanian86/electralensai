"""Unit tests for the ElectraLensAI agent mesh.

Validates that all four specialist agents are correctly instantiated.
"""

from __future__ import annotations

from agents.ballot_scribe import create_ballot_scribe_agent
from agents.rumor_guard import create_rumor_guard_agent
from agents.simulation_engine import create_simulation_engine_agent
from agents.timeline_architect import create_timeline_architect_agent


class TestTimelineArchitectAgent:
    """Suite for validating the TimelineArchitectAgent configuration."""

    def test_agent_name(self) -> None:
        """Verify the Timeline Architect has the correct identity."""
        agent = create_timeline_architect_agent()
        assert agent.name == "TimelineArchitectAgent"

    def test_agent_model(self) -> None:
        """Verify the agent is bound to the appropriate Gemini model."""
        agent = create_timeline_architect_agent()
        assert "gemini-2.5-flash" in agent.model


class TestBallotScribeAgent:
    """Suite for validating the BallotScribeAgent (Readiness Coach)."""

    def test_agent_name(self) -> None:
        """Verify the Ballot Scribe has the correct identity."""
        agent = create_ballot_scribe_agent()
        assert agent.name == "ReadinessCoach"


class TestRumorGuardAgent:
    """Suite for validating the RumorGuardAgent (Myth Buster)."""

    def test_agent_name(self) -> None:
        """Verify the Rumor Guard has the correct identity."""
        agent = create_rumor_guard_agent()
        assert agent.name == "MythBuster"


class TestSimulationEngineAgent:
    """Suite for validating the SimulationEngineAgent (Game Master)."""

    def test_agent_name(self) -> None:
        """Verify the Simulation Engine has the correct identity."""
        agent = create_simulation_engine_agent()
        assert agent.name == "GameMaster"
