"""ElectraLensAI — Agent query router.

Exposes the /query endpoint that accepts a civic question,
runs it through the ADK agent mesh, and streams the response
via Server-Sent Events (SSE).
"""

from __future__ import annotations

import json
import logging
from typing import AsyncIterator

from fastapi import APIRouter, HTTPException
from google.genai import types
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from agents import runner
from api.services.dlp_service import dlp_service
from api.services.translation_service import translation_service
from api.services.analytics_service import analytics_service

logger = logging.getLogger(__name__)
router = APIRouter()


class QueryRequest(BaseModel):
    """Incoming civic query payload."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        description="The civic/election question from the user.",
    )
    region: str = Field(
        default="US",
        max_length=100,
        description="ISO country code or region name for jurisdiction-specific answers.",
    )
    session_id: str = Field(
        default="",
        max_length=128,
        description="Optional session ID for conversation continuity.",
    )
    mode: str = Field(
        default="general",
        max_length=50,
        description="The feature mode (timeline, ballot, simulation, etc.)",
    )
    language: str = Field(
        default="en",
        max_length=10,
        description="The target language code (en, hi, ta, te).",
    )


class QueryResponse(BaseModel):
    """Synchronous query response schema (non-streaming fallback)."""

    answer: str
    agent_used: str
    session_id: str


async def _stream_agent_response(request: QueryRequest) -> AsyncIterator[dict[str, str]]:
    """Stream agent response tokens as SSE events.

    Args:
        request: The validated QueryRequest containing the civic question.

    Yields:
        SSE event dicts with data payloads for the frontend.
    """
    try:
        # Pre-processing: DLP Masking (Behind the scenes security)
        masked_question = dlp_service.mask_text(request.question)
        prompt = f"[Region: {request.region}] {masked_question}"

        yield {"event": "start", "data": json.dumps({"status": "processing"})}

        # ADK streaming — iterate over response events
        full_content = ""
        user_msg = types.Content(role="user", parts=[types.Part(text=prompt)])

        async for event in runner.run_async(
            user_id="default_user",
            session_id=request.session_id or "default_session",
            new_message=user_msg,
        ):
            text = ""
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        text += part.text

            if text:
                full_content += text
                yield {
                    "event": "token",
                    "data": json.dumps({"event": "token", "content": text}),
                }

            if event.author:
                yield {
                    "event": "agent_state",
                    "data": json.dumps({"event": "agent_state", "agent": event.author, "state": "active"}),
                }

        # If language is not English, translate the final summary or offer a translated event
        if request.language != "en":
            translated_content = translation_service.translate_text(
                full_content, target_language_code=request.language
            )
            yield {
                "event": "translated_done",
                "data": json.dumps({
                    "event": "translated_done",
                    "content": translated_content,
                    "language": request.language,
                }),
            }

        # Finalize Analytics Trace
        analytics_service.trace_agent_call(
            name="stream_query",
            user_id="default_user",
            input_str=request.question,
            output_str=full_content,
            metadata={"region": request.region, "language": request.language, "mode": request.mode}
        )

        yield {"event": "done", "data": json.dumps({"status": "complete"})}

    except Exception as exc:
        logger.exception("Agent pipeline error: %s", exc)
        yield {
            "event": "error",
            "data": json.dumps({"error": "Agent processing failed. Please try again."}),
        }


@router.post(
    "/query/stream",
    summary="Stream a civic query through the agent mesh",
    description="Accepts a civic election question and streams the agent response via SSE.",
)
async def stream_query(request: QueryRequest) -> EventSourceResponse:
    """Stream a civic query response via Server-Sent Events.

    Args:
        request: The validated QueryRequest from the client.

    Returns:
        An EventSourceResponse streaming agent output tokens.

    Raises:
        HTTPException: If the request payload is malformed.
    """
    if not request.question.strip():
        raise HTTPException(status_code=422, detail="Question must not be empty.")

    return EventSourceResponse(_stream_agent_response(request))


@router.post(
    "/query",
    response_model=QueryResponse,
    summary="Synchronous civic query (non-streaming fallback)",
    description="Non-streaming endpoint for environments that do not support SSE.",
)
async def query(request: QueryRequest) -> QueryResponse:
    """Run a civic query synchronously and return the full agent response.

    Args:
        request: The validated QueryRequest from the client.

    Returns:
        A QueryResponse containing the full agent answer.

    Raises:
        HTTPException: If the agent pipeline fails.
    """
    try:
        masked_question = dlp_service.mask_text(request.question)
        prompt = f"[Region: {request.region}] {masked_question}"
        user_msg = types.Content(role="user", parts=[types.Part(text=prompt)])

        answer = ""
        async for event in runner.run_async(
            user_id="default_user",
            session_id=request.session_id or "default_session",
            new_message=user_msg,
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        answer += part.text

        if request.language != "en":
            answer = translation_service.translate_text(
                answer, target_language_code=request.language
            )

        # Finalize Analytics Trace
        analytics_service.trace_agent_call(
            name="sync_query",
            user_id="default_user",
            input_str=request.question,
            output_str=answer,
            metadata={"region": request.region, "language": request.language, "mode": request.mode}
        )

        return QueryResponse(
            answer=answer,
            agent_used="ElectraLensRoot",
            session_id=request.session_id or "anon",
        )
    except Exception as exc:
        logger.exception("Synchronous agent query failed: %s", exc)
        raise HTTPException(status_code=500, detail="Agent pipeline error.") from exc
