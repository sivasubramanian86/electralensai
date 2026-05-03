"""ElectraLensAI — AlloyDB Memory Module.

Provides pgvector ANN semantic search and structured intervention logging.
Uses a mock fallback when USE_ALLOYDB is 'false' or DATABASE_URL is missing.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import asyncpg
from google.genai import types
from pgvector.asyncpg import register_vector

logger = logging.getLogger(__name__)

_USE_ALLOYDB = os.getenv("USE_ALLOYDB", "false").lower() == "true"
_POOL: asyncpg.Pool | None = None  # asyncpg.Pool singleton
EMBEDDING_MODEL = "text-embedding-004"


def set_use_alloydb(enabled: bool) -> None:  # noqa: FBT001
    """Test helper to toggle AlloyDB mode."""
    global _USE_ALLOYDB  # noqa: PLW0603
    _USE_ALLOYDB = enabled


async def _get_pool() -> asyncpg.Pool:  # pragma: no cover
    """Lazy initializer for the AlloyDB connection pool."""
    global _POOL  # noqa: PLW0603
    if _POOL is not None:
        return _POOL

    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        msg = "DATABASE_URL environment variable is not set"
        raise ValueError(msg)

    _POOL = await asyncpg.create_pool(
        dsn,
        init=lambda conn: register_vector(conn),
        min_size=1,
        max_size=10,
    )
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
    """Vector memory implementation using AlloyDB for PostgreSQL."""

    async def get_historical_precedents(self, query: str, limit: int = 3) -> list[dict]:
        """Perform ANN semantic search for relevant civic history."""
        if not _USE_ALLOYDB:
            # High-fidelity mock for CI/Local development
            return [
                {
                    "title": "ECI Digital Literacy Drive (2024)",
                    "summary": "Large scale initiative to combat deepfakes.",
                },
                {
                    "title": "The Voting Rights Act (1965)",
                    "summary": "Landmark legislation prohibiting racial discrimination in voting.",
                },
            ]

        try:  # pragma: no cover
            vector = await _embed(query)
            pool = await _get_pool()
            async with pool.acquire() as conn:
                # Cosine similarity search via pgvector
                query_sql = (
                    "SELECT title, summary FROM civic_history "
                    "ORDER BY embedding <=> $1::vector LIMIT $2"
                )
                rows = await conn.fetch(query_sql, str(vector), limit)
                return [dict(r) for r in rows]
        except Exception:  # pragma: no cover
            logger.exception("[Memory] Vector search failed")
            return []

    async def log_interaction(
        self,
        user_id: str,
        agent_name: str,
        question: str,
        response: str,
    ) -> None:
        """Persist agent interactions for audit and telemetry."""
        if not _USE_ALLOYDB:  # pragma: no cover
            logger.info("[Memory-Mock] Logging interaction for %s", agent_name)
            return

        try:  # pragma: no cover
            pool = await _get_pool()
            async with pool.acquire() as conn:
                await conn.execute(
                    "INSERT INTO agent_logs (user_id, agent_name, question, response) "
                    "VALUES ($1, $2, $3, $4)",
                    user_id,
                    agent_name,
                    question,
                    response,
                )
        except Exception:  # pragma: no cover
            logger.exception("[Memory] Logging failed")

    async def get_interaction_logs(self, limit: int = 10) -> list[dict[str, Any]]:
        """Retrieve recent interactions from the audit log."""
        if not _USE_ALLOYDB:
            # Mock data for dashboard
            return [
                {
                    "timestamp": "2024-05-01 10:00",
                    "agent": "RootOrchestrator",
                    "question": "Sample question",
                    "response": "Sample response",
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


memory_service = AlloyDBMemory()
