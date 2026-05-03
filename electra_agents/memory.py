"""ElectraLensAI — AlloyDB Memory Module.

Provides pgvector ANN semantic search and structured intervention logging.
Uses a mock fallback when USE_ALLOYDB is 'false' or DATABASE_URL is missing.
"""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

import asyncpg
from google.genai import types
from pgvector.asyncpg import register_vector

_USE_ALLOYDB = os.getenv("USE_ALLOYDB", "false").lower() == "true"
_POOL: asyncpg.Pool | None = None  # asyncpg.Pool singleton
EMBEDDING_MODEL = "text-embedding-004"


def set_use_alloydb(enabled: bool) -> None:  # noqa: FBT001
    """Test helper to toggle AlloyDB mode."""
    global _USE_ALLOYDB  # noqa: PLW0603
    _USE_ALLOYDB = enabled


async def _get_pool() -> asyncpg.Pool:  # pragma: no cover
    """Return the asyncpg connection pool singleton."""
    global _POOL  # noqa: PLW0603
    if _POOL is not None:
        return _POOL

    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        msg = "DATABASE_URL must be set when USE_ALLOYDB is true"
        raise ValueError(msg)

    _POOL = await asyncpg.create_pool(
        dsn,
        min_size=2,
        max_size=10,
        command_timeout=30,
        server_settings={"application_name": "electralens_memory"},
    )

    async with _POOL.acquire() as conn:
        await register_vector(conn)

    logger.info("[Memory] AlloyDB pool established.")
    return _POOL


async def _embed(text: str) -> list[float]:  # pragma: no cover
    """Generate a 768-dimension embedding via Vertex AI."""
    from api.genai_client import client  # noqa: PLC0415
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_QUERY"),
    )
    return response.embeddings[0].values


class AlloyDBMemory:
    """Async memory interface for ElectraLens agents."""

    async def get_historical_precedents(
        self, topic: str,
    ) -> list[dict[str, Any]]:  # pragma: no cover
        """Retrieve top-3 similar election incidents or precedents."""
        if not _USE_ALLOYDB or not os.getenv("DATABASE_URL"):
            logger.debug("[Memory] MOCK - returning synthetic precedents for: %s", topic)
            return self._mock_precedents(topic)

        try:  # pragma: no cover
            vector = await _embed(topic)
            pool = await _get_pool()
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT id, title, description, resolution,
                           1 - (embedding <=> $1::vector) AS similarity
                    FROM election_precedents
                    ORDER BY embedding <=> $1::vector
                    LIMIT 3
                    """,
                    vector,
                )
            return [dict(r) for r in rows]
        except Exception:
            logger.exception("[Memory] AlloyDB query failed")
            return []

    async def log_interaction(
        self, user_id: str, agent: str, question: str, response: str,
    ) -> None:  # pragma: no cover
        """Log a user interaction for audit and quality monitoring."""
        if not _USE_ALLOYDB or not os.getenv("DATABASE_URL"):
            logger.debug("[Memory] MOCK - Logged interaction for %s", agent)
            return

        try:  # pragma: no cover
            pool = await _get_pool()
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO agent_logs (user_id, agent_name, question, response)
                    VALUES ($1, $2, $3, $4)
                    """,
                    user_id,
                    agent,
                    question,
                    response,
                )
        except Exception:
            logger.exception("[Memory] Failed to log interaction")

    async def get_interaction_logs(self, limit: int = 10) -> list[dict[str, Any]]:
        """Retrieve the latest interaction logs for auditing."""
        if not _USE_ALLOYDB or not os.getenv("DATABASE_URL"):
            return [
                {
                    "timestamp": "2026-05-03T10:00:00Z",
                    "agent": "RootOrchestrator",
                    "question": "How to register for voting?",
                    "response": "You can register online via the NVSP portal...",
                },
            ]

        try:  # pragma: no cover
            pool = await _get_pool()
            async with pool.acquire() as conn:
                query = (
                    "SELECT created_at as timestamp, agent_name as agent, "
                    "question, response FROM agent_logs "
                    "ORDER BY created_at DESC LIMIT $1"
                )
                rows = await conn.fetch(query, limit)
            return [dict(r) for r in rows]
        except Exception:  # pragma: no cover
            logger.exception("[Memory] Failed to fetch interaction logs")
            return []

    def _mock_precedents(self, topic: str) -> list[dict[str, Any]]:
        """Mock fallback for prototype mode."""
        return [
            {
                "id": "PREC-2024-001",
                "title": "Voter ID Clarification (Rural)",
                "description": f"Historical precedent for {topic} in remote regions.",
                "resolution": "Accept secondary verification (MGNREGA card) if EPIC is missing.",
                "similarity": 0.89,
            },
        ]


memory_service = AlloyDBMemory()
