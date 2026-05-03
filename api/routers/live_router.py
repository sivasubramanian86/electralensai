"""API router for Gemini Multimodal Live Agent sessions."""

import asyncio
import json
import logging
import os
import secrets

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from google.adk import Runner, agents
from google.adk.agents.live_request_queue import LiveRequestQueue
from google.adk.agents.run_config import RunConfig
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai import types

from electra_agents.root_agent import (
    create_ballot_scribe_agent,
    create_rumor_guard_agent,
    create_simulation_engine_agent,
    create_timeline_architect_agent,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/live/health")
async def live_health_check() -> dict:
    """Specific health check for the Gemini Live agent service."""
    return {"status": "healthy", "service": "ElectraLens Live Agent"}


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
async def live_agent_ws(websocket: WebSocket, lang: str = "en") -> None:
    """WebSocket endpoint for Gemini Multimodal Live API via ADK Runner.

    Args:
        websocket: The FastAPI WebSocket connection.
        lang: Language code (e.g., 'en', 'hi', 'ta').
    """
    await websocket.accept()
    logger.info("ElectraLens Live: WebSocket connection established (Lang: %s)", lang)

    user_id = "default_user"
    session_id = f"session_{secrets.randbelow(900000) + 100000}"

    # Load localized content from translation JSONs via I18nService
    from api.services.i18n_service import i18n_service
    lang_name, greeting_text = i18n_service.get_live_metadata(lang)

    try:
        await websocket.send_json({"type": "session_id", "session_id": session_id})

        # 1. Minimal & Forceful localized instruction (High Priority)
        localized_instruction = (
            f"IDENTITY: You are a NATIVE {lang_name} speaker and civic assistant. \n"
            f"LANGUAGE RULE: English is FORBIDDEN. Respond ONLY in {lang_name}. \n"
            f"FIRST TASK: Say exactly: '{greeting_text}'."
        )

        # 2. Initialize a session-specific Agent
        model = os.getenv("GOOGLE_MODEL_LIVE")
        local_agent = agents.Agent(
            name=f"ElectraLens_{lang_name}_Native",
            instruction=localized_instruction,
            model=model,
            generate_content_config=types.GenerateContentConfig(
                response_modalities=[types.Modality.AUDIO]
            ),
            tools=[],
            sub_agents=[
                create_timeline_architect_agent(model),
                create_ballot_scribe_agent(model),
                create_rumor_guard_agent(model),
                create_simulation_engine_agent(model),
            ],
        )

        # 3. Create a session-specific Runner
        local_runner = Runner(
            app_name=f"ElectraLens_{lang_name}_Session",
            agent=local_agent,
            session_service=InMemorySessionService(),
            auto_create_session=True,
        )

        live_request_queue = LiveRequestQueue()

        # Forceful Start Poke in target language for maximum impact
        pokes = {
            "te": "దయచేసి తెలుగులో మాట్లాడండి",
            "ta": "தயவுசெய்து தமிழில் பேசவும்",
            "hi": "कृपया हिंदी में बोलें",
            "en": "Please speak in English",
        }
        poke_text = pokes.get(lang.split("-")[0].lower(), f"Please speak in {lang_name}")

        live_request_queue.send_content(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=poke_text)],
            ),
        )

        run_config = RunConfig(
            response_modalities=["AUDIO"],
            session_resumption=types.SessionResumptionConfig(),
        )

        # Start downstream stream
        adk_task = asyncio.create_task(
            _run_local_adk_loop(
                websocket, user_id, session_id, live_request_queue, run_config, local_runner
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
        if "live_request_queue" in locals():
            live_request_queue.close()
        if "adk_task" in locals() and not adk_task.done():  # pragma: no cover
            adk_task.cancel()
        try:
            await websocket.close()
        except Exception:  # noqa: BLE001 # pragma: no cover
            logger.debug("Cleanup error (ignored)")


async def _run_local_adk_loop(
    websocket: WebSocket,
    user_id: str,
    session_id: str,
    live_request_queue: LiveRequestQueue,
    run_config: RunConfig,
    runner: Runner,
) -> None:
    """Handles the Gemini -> Client stream using a session-specific runner."""
    max_retries = 3
    retry_count = 0
    last_exc = None
    while retry_count < max_retries:  # pragma: no cover
        try:
            async for event in runner.run_live(
                user_id=user_id,
                session_id=session_id,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        if part.inline_data:
                            await websocket.send_bytes(part.inline_data.data)
                        elif part.text:
                            await websocket.send_json({"type": "transcript", "text": part.text})
            break
        except asyncio.CancelledError:
            logger.info("ADK Loop cancelled")
            break
        except Exception as exc:
            retry_count += 1
            last_exc = exc
            logger.warning("ADK Loop Error (Attempt %s): %s", retry_count, exc)
            if retry_count >= max_retries:
                logger.exception("Max retries reached for Local ADK Loop")
                await websocket.send_json({"error": f"Connection failed: {last_exc!s}"})
                break
            await asyncio.sleep(1)
        logger.info("Session cleanup complete")
