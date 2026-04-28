"""ElectraLensAI — Cloud Logging Service.

Integrates with Google Cloud Logging to stream agent traces and system telemetry
with structured metadata for forensic auditability.
"""

import logging
import os

from google.cloud import logging as cloud_logging

logger = logging.getLogger(__name__)


class CloudLoggingService:
    """Service for managing Google Cloud Logging integration."""

    def __init__(self) -> None:
        """Initialize the cloud logging client."""
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.client = None

        if self.project_id:
            try:
                self.client = cloud_logging.Client(project=self.project_id)
                # Connect the standard Python logging to GCP
                self.client.setup_logging()
                logger.info("Google Cloud Logging successfully initialized for %s", self.project_id)
            except Exception as e:
                logger.warning("Cloud Logging initialization failed (falling back to local): %s", e)

    def log_agent_reasoning(self, agent_name: str, session_id: str, reasoning: str) -> None:
        """Log structured agent reasoning for audit trails.

        Args:
            agent_name: Name of the agent performing the action.
            session_id: Unique identifier for the user session.
            reasoning: Detailed trace of the agent's internal logic.
        """
        logger.info(
            "Agent Reasoning Trace",
            extra={
                "labels": {"agent": agent_name, "session_id": session_id, "type": "agent_trace"},
                "json_payload": {"reasoning": reasoning},
            },
        )


cloud_logger_service = CloudLoggingService()
