"""API router for Gemini Multimodal Live Agent sessions."""

import asyncio
import json
import logging
import secrets

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.genai import types

from electra_agents import live_runner

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check for the live router."""
    return {"status": "ok", "message": "ElectraLens Live Backend is active"}


async def _run_adk_loop(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
    live_request_queue: LiveRequestQueue,
    run_config: RunConfig,
) -> None:
    """Handles the Gemini -> Client audio/transcript stream."""
    max_retries = 3
    retry_count = 0
    while retry_count < max_retries:  # pragma: no cover
        try:
            logger.info("Starting ADK run_live (Attempt %d)", retry_count + 1)
            async for event in live_runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                # Handle audio and text parts
                if event.content and event.content.parts:  # pragma: no cover
                    for part in event.content.parts:
                        if part.inline_data:  # pragma: no cover
                            await websocket.send_bytes(part.inline_data.data)
                        elif part.text:  # pragma: no cover
                            await websocket.send_json({"type": "transcript", "text": part.text})

                if event.usage_metadata:  # pragma: no cover
                    logger.info("Usage: %d tokens", event.usage_metadata.total_token_count)
            break
        except Exception:
            retry_count += 1
            logger.warning("ADK Loop Error (Attempt %s)", retry_count)
            if retry_count >= max_retries:
                logger.exception("Max retries reached for ADK Loop")
                await websocket.send_json({"error": "Connection failed"})
                break
            await asyncio.sleep(1)


async def _handle_client_message(message: dict, live_request_queue: LiveRequestQueue) -> bool:
    """Processes incoming messages from the client. Returns False if session should end."""
    msg_type = message.get("type")
    if msg_type != "websocket.receive":  # pragma: no cover
        return msg_type != "websocket.disconnect"

    if "bytes" in message:
        live_request_queue.send_realtime(
            types.Blob(mime_type="audio/pcm;rate=16000", data=message.get("bytes")),
        )
    elif "text" in message:  # pragma: no cover
        text_content = message.get("text")
        try:
            data = json.loads(text_content)
            data_type = data.get("type")
            if data_type == "finalize":
                return False
            if data_type == "audio_start":
                live_request_queue.send_activity_start()
            elif data_type == "audio_end":
                live_request_queue.send_activity_end()
            elif data_type == "text":
                live_request_queue.send_content(
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=data.get("text", ""))],
                    ),
                )
        except json.JSONDecodeError:
            live_request_queue.send_content(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=message.get("text", ""))],
                ),
            )
    return True


@router.websocket("/ws/session")
async def live_agent_ws(websocket: WebSocket) -> None:
    """WebSocket endpoint for Gemini Multimodal Live API via ADK Runner."""
    await websocket.accept()
    logger.info("ElectraLens Live: WebSocket connection established")

    user_id = "default_user"
    session_id = f"session_{secrets.randbelow(900000) + 100000}"

    try:
        await websocket.send_json({"type": "session_id", "session_id": session_id})

        live_request_queue = LiveRequestQueue()
        run_config = RunConfig(
            response_modalities=["AUDIO"], session_resumption=types.SessionResumptionConfig(),
        )

        # Start downstream stream
        adk_task = asyncio.create_task(
            _run_adk_loop(websocket, user_id, session_id, live_request_queue, run_config),
        )

        # Trigger Initial Greeting
        live_request_queue.send_content(
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(
                        text="User has joined. Greet them as ElectraLens Assistant.",
                    ),
                ],
            ),
        )

        # Handle upstream messages
        while True:
            message = await websocket.receive()
            if not await _handle_client_message(message, live_request_queue):
                break

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception:
        logger.exception("Global session error")
    finally:
        live_request_queue.close()
        if "adk_task" in locals() and not adk_task.done():  # pragma: no cover
            adk_task.cancel()
        try:
            await websocket.close()
        except Exception:  # noqa: BLE001 # pragma: no cover
            logger.debug("Cleanup error (ignored)")
        logger.info("Session cleanup complete")
