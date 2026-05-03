"""Common tools for ElectraLens agents."""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def broadcast_misinformation_alert(
    agent: Any, alert_type: str, data: Any = None,
) -> str:
    """Broadcasts a civic alert to all monitoring systems.

    Uses lazy imports to prevent circular dependency with the API package.
    """
    # Normalize data for PubSub and Analytics
    payload = data if isinstance(data, dict) else {"message": str(data)}

    # Lazy imports to break circularity
    from api.services.analytics_service import analytics_service  # noqa: PLC0415
    from api.services.cloud_logger import cloud_logger_service  # noqa: PLC0415
    from api.services.pubsub_service import pubsub_service  # noqa: PLC0415

    # 1. Real-time Pub/Sub notification
    pubsub_service.publish_alert(alert_type, payload)

    # 2. Analytics tracing
    analytics_service.trace_agent_call(
        name="broadcast_alert",
        user_id="system",
        input_str=alert_type,
        output_str="Alert Published",
        metadata=payload,
    )

    # 3. Transparent Reasoning Trace
    cloud_logger_service.log_agent_reasoning("Broadcaster", "N/A", f"Alert: {alert_type}")

    return f"Alert {alert_type} broadcasted."


# Alias for backward compatibility or general use
broadcast_alert = broadcast_misinformation_alert
