"""API router for multimedia content generation."""

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from api.services.job_service import job_service
from api.services.multimedia_service import multimedia_service

router = APIRouter(prefix="/multimedia", tags=["multimedia"])
logger = logging.getLogger(__name__)


class MultimediaRequest(BaseModel):
    """Request schema for multimedia generation."""

    topic: str
    language: str = "en"


class JobResponse(BaseModel):
    """Response returned when a job is successfully queued."""

    job_id: str
    status: str


async def run_multimodal_job(job_id: str, topic: str, language: str) -> None:
    """Background task to run the generation pipeline."""
    try:
        job_service.update_job(job_id, "processing")
        content = multimedia_service.generate_multimodal_package(topic=topic, language=language)
        job_service.update_job(job_id, "completed", result=content)
    except Exception as e:
        logger.error("Job %s failed: %s", job_id, e)
        job_service.update_job(job_id, "failed", error=str(e))


@router.post("/generate", response_model=JobResponse)
async def generate_multimodal_content(
    request: MultimediaRequest, background_tasks: BackgroundTasks
) -> dict:
    """Queues an asynchronous multimodal generation job."""
    try:
        job_id = job_service.create_job(f"Multimodal: {request.topic}")
        background_tasks.add_task(run_multimodal_job, job_id, request.topic, request.language)
        return {"job_id": job_id, "status": "pending"}
    except Exception as e:
        logger.error("Error creating multimodal job: %s", e)
        raise HTTPException(status_code=500, detail="Failed to queue generation job") from e


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str) -> dict:
    """Polling endpoint to check job progress."""
    try:
        job = job_service.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error retrieving job %s: %s", job_id, e)
        raise HTTPException(status_code=500, detail="Internal server error") from e


@router.get("/jobs", response_model=list)
async def list_multimedia_jobs() -> list:
    """Lists all active and completed multimedia jobs."""
    return job_service.list_jobs()
