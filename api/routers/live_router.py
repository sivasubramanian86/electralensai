"""API router for Gemini Multimodal Live Agent sessions."""

import asyncio
import json
import logging
import secrets

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.genai import types

from agents import live_runner

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check() -> dict[str, str]:
    """Health check for the live router."""
    return {"status": "ok", "message": "ElectraLens Live Backend is active"}


@router.websocket("/ws/session")
async def live_agent_ws(websocket: WebSocket) -> None:
    """WebSocket endpoint for Gemini Multimodal Live API via ADK Runner.

    Aligned with Clari-Weave-AI pattern for high reliability.
    """
    await websocket.accept()
    logger.info("ElectraLens Live: WebSocket connection established")

    user_id = "default_user"
    session_id = f"session_{secrets.randbelow(900000) + 100000}"

    try:
        # 1. Send initial session metadata
        await websocket.send_json({"type": "session_id", "session_id": session_id})

        # 2. Setup ADK Loop State
        live_request_queue = LiveRequestQueue()
        run_config = RunConfig(
            response_modalities=["AUDIO"], session_resumption=types.SessionResumptionConfig()
        )

        # 3. ADK Event Loop (Downstream: Gemini -> Client)
        async def run_adk_loop() -> None:
            max_retries = 3
            retry_count = 0
            while retry_count < max_retries:
                try:
                    logger.info(f"Starting ADK run_live (Attempt {retry_count + 1})")
                    async for event in live_runner.run_live(
                        user_id=user_id,
                        session_id=session_id,
                        live_request_queue=live_request_queue,
                        run_config=run_config,
                    ):
                        # Handle audio data
                        if event.content and event.content.parts:
                            for part in event.content.parts:
                                if part.inline_data:
                                    await websocket.send_bytes(part.inline_data.data)
                                elif part.text:
                                    await websocket.send_json(
                                        {"type": "transcript", "text": part.text}
                                    )

                        if event.usage_metadata:
                            logger.info(f"Usage: {event.usage_metadata.total_token_count} tokens")
                    break
                except Exception as e:
                    retry_count += 1
                    logger.warning(f"ADK Loop Error (Attempt {retry_count}): {e}")
                    if retry_count >= max_retries:
                        logger.error("Max retries reached for ADK Loop")
                        await websocket.send_json({"error": str(e)})
                        break
                    await asyncio.sleep(1)

        adk_task = asyncio.create_task(run_adk_loop())

        # 4. Client Message Loop (Upstream: Client -> Gemini)
        try:
            # Trigger Initial Greeting
            live_request_queue.send_content(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(
                            text="User has joined. Greet them as ElectraLens Assistant."
                        )
                    ],
                )
            )

            while True:
                message = await websocket.receive()
                msg_type = message.get("type")

                if msg_type == "websocket.receive":
                    if "bytes" in message:
                        live_request_queue.send_realtime(
                            types.Blob(mime_type="audio/pcm;rate=16000", data=message.get("bytes"))
                        )
                    elif "text" in message:
                        text_content = message.get("text")
                        try:
                            data = json.loads(text_content)
                            data_type = data.get("type")
                            if data_type == "finalize":
                                break
                            elif data_type == "audio_start":
                                live_request_queue.send_activity_start()
                            elif data_type == "audio_end":
                                live_request_queue.send_activity_end()
                            elif data_type == "text":
                                live_request_queue.send_content(
                                    types.Content(
                                        role="user",
                                        parts=[types.Part.from_text(text=data.get("text", ""))],
                                    )
                                )
                        except json.JSONDecodeError:
                            live_request_queue.send_content(
                                types.Content(
                                    role="user",
                                    parts=[types.Part.from_text(text=message.get("text", ""))],
                                )
                            )
                elif message.get("type") == "websocket.disconnect":
                    break
        except WebSocketDisconnect:
            raise
        except Exception as e:
            import traceback

            logger.error(f"Client loop error: {e}")
            logger.error(traceback.format_exc())
        finally:
            live_request_queue.close()
            if not adk_task.done():
                adk_task.cancel()
            logger.info("Session cleanup complete")

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Global session error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception as e:
            logger.debug(f"Cleanup error (ignored): {e}")
