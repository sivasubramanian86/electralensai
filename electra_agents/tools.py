"""Common tools for ElectraLens agents."""

import logging
from typing import Any

from api.services.analytics_service import analytics_service
from api.services.cloud_logger import cloud_logger_service

logger = logging.getLogger(__name__)


def broadcast_alert(alert_type: str, data: dict[str, Any]) -> str:
    """Broadcasts a civic alert to all monitoring systems."""
    analytics_service.trace_agent_call(
        name="broadcast_alert",
        user_id="system",
        input_str=alert_type,
        output_str="Alert Published",
        metadata=data,
    )
    cloud_logger_service.log_agent_reasoning("Broadcaster", "N/A", f"Alert: {alert_type}")
    return f"Alert {alert_type} broadcasted."
