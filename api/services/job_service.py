"""ElectraLensAI — Job Management Service.

Handles asynchronous background tasks for long-running multimodal asset generation.
Allows the API to remain responsive while complex assets (Imagen, TTS) are built.
"""

import logging
import uuid
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class JobService:
    """Service for managing background execution states."""

    def __init__(self) -> None:
        """Initialize the in-memory job store."""
        self.jobs: Dict[str, Dict[str, Any]] = {}

    def create_job(self, task_name: str) -> str:
        """Create a new job entry and return its ID."""
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            "id": job_id,
            "task": task_name,
            "status": "pending",
            "result": None,
            "error": None,
        }
        return job_id

    def update_job(
        self, job_id: str, status: str, result: Any = None, error: str = None  # noqa: ANN401
    ) -> None:
        """Update the status and result of a job."""
        if job_id in self.jobs:
            self.jobs[job_id]["status"] = status
            if result:
                self.jobs[job_id]["result"] = result
            if error:
                self.jobs[job_id]["error"] = error
            logger.info("[JobService] Job %s updated to %s", job_id, status)

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the current state of a job."""
        return self.jobs.get(job_id)

    def list_jobs(self) -> list[Dict[str, Any]]:
        """List all current jobs."""
        return list(self.jobs.values())


job_service = JobService()
