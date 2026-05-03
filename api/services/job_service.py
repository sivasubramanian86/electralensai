"""ElectraLensAI — Job Management Service.

Handles asynchronous background tasks for long-running multimodal asset generation.
Uses Google Cloud Storage (GCS) for persistent state tracking across serverless instances.
"""

import json
import logging
import uuid
from typing import Any

from google.cloud import storage

from api.config import Config

logger = logging.getLogger(__name__)


class JobService:
    """Service for managing background execution states with GCS persistence."""

    def __init__(self) -> None:
        """Initialize the job service."""
        self._storage_client: storage.Client | None = None
        self.bucket_name = Config.STORAGE_BUCKET
        self._local_jobs: dict[str, dict[str, Any]] = {}

    @property
    def storage_client(self) -> storage.Client:
        """Lazy initializer for Storage client."""
        if self._storage_client is None:
            self._storage_client = storage.Client()
        return self._storage_client

    def _get_job_blob(self, job_id: str) -> storage.Blob | None:
        """Get the blob for a job file."""
        if not self.bucket_name:
            return None
        bucket = self.storage_client.bucket(self.bucket_name)
        return bucket.blob(f"jobs/{job_id}.json")

    def create_job(self, task_name: str) -> str:
        """Create a new job entry and return its ID."""
        job_id = str(uuid.uuid4())
        job_data = {
            "id": job_id,
            "task": task_name,
            "status": "pending",
            "result": None,
            "error": None,
        }

        blob = self._get_job_blob(job_id)
        if blob:
            try:
                blob.upload_from_string(
                    json.dumps(job_data),
                    content_type="application/json",
                )
                return job_id
            except Exception:  # pragma: no cover
                logger.exception("Failed to write job %s to GCS", job_id)

        self._local_jobs[job_id] = job_data
        return job_id

    def update_job(
        self,
        job_id: str,
        status: str,
        result: Any = None,  # noqa: ANN401
        error: str | None = None,
    ) -> None:
        """Update the status and result of a job."""
        job_data = self.get_job(job_id) or self._local_jobs.get(job_id)
        if not job_data:
            logger.warning("Attempted to update non-existent job %s", job_id)
            return

        job_data["status"] = status
        if result:
            job_data["result"] = result
        if error:
            job_data["error"] = error

        blob = self._get_job_blob(job_id)
        if blob:
            try:
                blob.upload_from_string(
                    json.dumps(job_data),
                    content_type="application/json",
                )
                logger.info("[JobService] Job %s updated to %s in GCS", job_id, status)
                return
            except Exception:  # pragma: no cover
                logger.exception("Failed to update GCS job %s", job_id)

        if job_id in self._local_jobs:  # pragma: no cover
            self._local_jobs[job_id].update(job_data)
            logger.info("[JobService] Job %s updated to %s in memory", job_id, status)

    def get_job(self, job_id: str) -> dict[str, Any] | None:
        """Retrieve the current state of a job."""
        blob = self._get_job_blob(job_id)
        if blob and blob.exists():
            try:
                content = blob.download_as_text()
                return json.loads(content)
            except Exception:  # pragma: no cover
                logger.exception("GCS lookup failed for job %s", job_id)

        return self._local_jobs.get(job_id)

    def list_jobs(self) -> list[dict[str, Any]]:
        """List all current jobs (not recommended for GCS-backed service)."""
        if not self.bucket_name:
            return list(self._local_jobs.values())

        try:
            blobs = self.storage_client.list_blobs(self.bucket_name, prefix="jobs/")
            jobs = []
            for blob in blobs:
                if blob.name.endswith(".json"):  # pragma: no cover
                    jobs.append(json.loads(blob.download_as_text()))
            return jobs
        except Exception:  # pragma: no cover
            logger.exception("GCS list failed")
            return list(self._local_jobs.values())


job_service = JobService()
