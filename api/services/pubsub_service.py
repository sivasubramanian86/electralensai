"""ElectraLensAI — Cloud Pub/Sub Service.

Handles high-priority event broadcasting for real-time misinformation alerts
and critical system notifications.
"""

import json
import logging
import os
from typing import Any

from google.cloud import pubsub_v1

logger = logging.getLogger(__name__)


class PubSubService:
    """Service for managing Google Cloud Pub/Sub interactions."""

    def __init__(self) -> None:
        """Initialize the Pub/Sub configuration."""
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.topic_id = os.getenv("PUBSUB_TOPIC_ALERTS", "electralens-alerts")
        self._publisher = None

    @property
    def publisher(self) -> pubsub_v1.PublisherClient | None:
        """Lazy initializer for Pub/Sub publisher client."""
        if not self._publisher and self.project_id:
            try:
                self._publisher = pubsub_v1.PublisherClient()
                self.topic_path = self._publisher.topic_path(self.project_id, self.topic_id)
                logger.info("Pub/Sub initialized for topic: %s", self.topic_path)
            except Exception as e:
                logger.warning("Pub/Sub initialization failed: %s", e)
        return self._publisher

    @publisher.setter
    def publisher(self, value: pubsub_v1.PublisherClient | None) -> None:
        """Setter for testing/dependency injection."""
        self._publisher = value

    def publish_alert(self, alert_type: str, data: dict[str, Any]) -> None:
        """Publish a high-priority alert to the topic.

        Args:
            alert_type: The category of the alert (e.g., 'RUMOR_DETECTED').
            data: Structured payload containing alert details.
        """
        if not self.publisher:
            logger.debug("Pub/Sub not configured. Skipping alert: %s", alert_type)
            return

        try:
            payload = {"version": "1.0", "alert_type": alert_type, "payload": data}
            message_bytes = json.dumps(payload).encode("utf-8")
            future = self.publisher.publish(self.topic_path, message_bytes)
            message_id = future.result()
            logger.info("Published %s alert. Message ID: %s", alert_type, message_id)
        except Exception as e:
            logger.error("Failed to publish alert to Pub/Sub: %s", e)


pubsub_service = PubSubService()
