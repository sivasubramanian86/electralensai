"""ElectraLensAI — Agent Tools.

Centralized location for tool definitions to avoid circular dependencies
between agents and services.
"""


def broadcast_misinformation_alert(claim: str, verdict: str, source: str) -> str:
    """Broadcasts a high-priority alert when a rumor is debunked.

    Call this tool ONLY when you have high confidence that a claim is FALSE or MISLEADING.
    """
    from api.services.pubsub_service import pubsub_service

    pubsub_service.publish_alert(
        alert_type="RUMOR_DETECTED", data={"claim": claim, "verdict": verdict, "source": source}
    )
    return "Alert successfully broadcast to authorities."
