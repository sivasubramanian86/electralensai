"""ElectraLensAI — Service Extension Integrity Suite.

Targeting 100% coverage for newly added Cloud Logging and Pub/Sub services.
"""

import os
from unittest.mock import MagicMock, patch

from api.services.cloud_logger import CloudLoggingService, cloud_logger_service
from api.services.pubsub_service import PubSubService, pubsub_service


def test_cloud_logging_resilience() -> None:
    """Exercise all branches of CloudLoggingService including init failures."""
    # 1. Successful initialization
    with patch.dict(os.environ, {"GOOGLE_CLOUD_PROJECT": "test-project"}):
        svc = CloudLoggingService()
        with patch("google.cloud.logging.Client"):
            assert svc.client is not None

    # 2. Initialization failure
    with patch.dict(os.environ, {"GOOGLE_CLOUD_PROJECT": "test-project"}):
        svc_fail = CloudLoggingService()
        with patch("google.cloud.logging.Client", side_effect=Exception("Fail")):
            assert svc_fail.client is None

    # 3. Setter & Log
    svc.client = None
    cloud_logger_service.log_agent_reasoning("Test", "1", "Trace")


def test_pubsub_resilience() -> None:
    """Exercise all branches of PubSubService including init and publish failures."""
    # 1. Successful initialization
    with patch.dict(os.environ, {"GOOGLE_CLOUD_PROJECT": "test-project"}):
        svc = PubSubService()
        with patch("google.cloud.pubsub_v1.PublisherClient"):
            assert svc.publisher is not None

    # 2. Initialization failure
    with patch.dict(os.environ, {"GOOGLE_CLOUD_PROJECT": "test-project"}):
        svc_fail = PubSubService()
        with patch("google.cloud.pubsub_v1.PublisherClient", side_effect=Exception("Fail")):
            assert svc_fail.publisher is None

    # 3. Publish success
    with patch.dict(os.environ, {"GOOGLE_CLOUD_PROJECT": "test-project"}):
        svc_pub = PubSubService()
        svc_pub.publisher = MagicMock()
        svc_pub.topic_path = "projects/t/topics/a"  # Must set this manually
        mock_future = MagicMock()
        mock_future.result.return_value = "msg-123"
        svc_pub.publisher.publish.return_value = mock_future

        svc_pub.publish_alert("ALERT", {"d": 1})
        assert svc_pub.publisher.publish.called

    # 4. Publish failure (Line 60-61)
    with patch.dict(os.environ, {"GOOGLE_CLOUD_PROJECT": "test-project"}):
        svc_err = PubSubService()
        svc_err.publisher = MagicMock()
        svc_err.topic_path = "projects/t/topics/a"
        svc_err.publisher.publish.side_effect = Exception("Fail")
        svc_err.publish_alert("FAIL", {})

    # 5. No project ID (Line 29)
    with patch.dict(os.environ, {"GOOGLE_CLOUD_PROJECT": ""}, clear=True):
        svc_none = PubSubService()
        assert svc_none.publisher is None

    # 6. Pub/Sub not configured (Line 51-52)
    pubsub_service.publisher = None
    pubsub_service.publish_alert("IGNORE", {})
