"""ElectraLensAI — MCP Database Toolbox.

Provides a standardized set of tools for agents to interact with the 
AlloyDB/Vector layer for RAG and persistence.
"""

from typing import Any
from agents.memory import memory_service

async def query_election_precedents(topic: str) -> str:
    """Queries the vector database for historical election precedents and resolutions.
    
    Use this to find how similar issues were resolved in the past.
    """
    precedents = await memory_service.get_historical_precedents(topic)
    if not precedents:
        return "No historical precedents found for this topic."
    
    results = []
    for p in precedents:
        results.append(
            f"Title: {p['title']}\nDescription: {p['description']}\nResolution: {p['resolution']}\n---"
        )
    return "\n".join(results)

async def check_voter_eligibility_history(voter_context: str) -> str:
    """Checks for specific case studies regarding voter eligibility based on context."""
    return await query_election_precedents(f"Voter eligibility for {voter_context}")

db_tools = [
    query_election_precedents,
    check_voter_eligibility_history
]
