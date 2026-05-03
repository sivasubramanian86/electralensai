"""ElectraLensAI — Observability & Analytics Service.

Integrates with Langfuse for tracing and Cloud Monitoring for custom metrics.
Supports credit-aware conditional activation.
"""

import logging
import os
import time
from typing import Any

from google.cloud import monitoring_v3
from langfuse import Langfuse

logger = logging.getLogger(__name__)


class AnalyticsService:
    """Service for managing agent tracing and system performance metrics."""

    def __init__(self) -> None:
        """Initialize Langfuse and GCP Monitoring clients."""
        self.enabled = os.getenv("ENABLE_ANALYTICS", "true").lower() == "true"
        self.langfuse = None
        self.metrics_client = None
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT")

        if self.enabled:  # pragma: no cover
            # Initialize Langfuse for Traceability
            pk = os.getenv("LANGFUSE_PUBLIC_KEY")
            sk = os.getenv("LANGFUSE_SECRET_KEY")
            host = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

            if pk and sk:
                self.langfuse = Langfuse(public_key=pk, secret_key=sk, host=host)
                logger.info("[Analytics] Langfuse tracing initialized.")

            # Initialize GCP Monitoring for SRE Metrics
            if self.project_id:
                try:
                    self.metrics_client = monitoring_v3.MetricServiceClient()
                except Exception:  # noqa: BLE001 # pragma: no cover
                    logger.warning("[Analytics] Cloud Monitoring init failed")

    def trace_agent_call(
        self, name: str, user_id: str, input_str: str, output_str: str, metadata: dict[str, Any],
    ) -> None:
        """Log a complete agent trace to Langfuse."""
        if not self.langfuse:  # pragma: no cover
            return

        try:
            self.langfuse.trace(
                name=name, user_id=user_id, input=input_str, output=output_str, metadata=metadata,
            )
        except Exception:  # noqa: BLE001
            logger.debug("[Analytics] Trace failed")

    def record_metric(self, metric_name: str, value: float, labels: dict[str, str]) -> None:
        """Export a custom metric to Google Cloud Monitoring."""
        if not self.metrics_client or not self.project_id:  # pragma: no cover
            return

        try:
            series = monitoring_v3.TimeSeries()
            series.metric.type = f"custom.googleapis.com/electralens/{metric_name}"
            series.resource.type = "global"

            for k, v in labels.items():
                series.metric.labels[k] = v

            now = time.time()
            seconds = int(now)
            nanos = int((now - seconds) * 10**9)

            point = monitoring_v3.Point(
                {
                    "interval": {"end_time": {"seconds": seconds, "nanos": nanos}},
                    "value": {"double_value": value},
                },
            )
            series.points = [point]

            project_name = f"projects/{self.project_id}"
            self.metrics_client.create_time_series(name=project_name, time_series=[series])
        except Exception:  # noqa: BLE001
            logger.debug("[Analytics] Metric export failed")


analytics_service = AnalyticsService()
