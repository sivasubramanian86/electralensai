"""ElectraLensAI — Hardened Cloud Run deployment script.

Builds the container image using Cloud Build and deploys to Cloud Run
following the ElectraLensAI-proven secure subprocess pattern.
All API keys are sourced from GCP Secret Manager — zero .env in production.
"""

from __future__ import annotations

import argparse
import logging
import subprocess  # nosec B404
import sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

_SERVICE_NAME = "electralensai-backend"
_REGION = "us-central1"
_IMAGE_NAME = "gcr.io/{project}/electralensai-backend:latest"


def _run(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    """Execute a subprocess command using list-based args (no shell=True).

    Args:
        args: Command and arguments as a list — never a shell string.
        check: If True, raise CalledProcessError on non-zero exit code.

    Returns:
        The completed process result.

    Raises:
        subprocess.CalledProcessError: If the command exits with a non-zero code.
    """
    logger.info("Running: %s", " ".join(args))
    return subprocess.run(args, check=check, capture_output=False, text=True)  # noqa: S603, S607


def build_image(project: str) -> None:
    """Build the Docker image using Cloud Build.

    Args:
        project: The GCP project ID to build within.
    """
    image = _IMAGE_NAME.format(project=project)
    _run(
        [
            "gcloud",
            "builds",
            "submit",
            "--tag",
            image,
            "--project",
            project,
            ".",
        ]
    )
    logger.info("Image built: %s", image)


def deploy_service(project: str, service_account: str) -> None:
    """Deploy the container to Cloud Run.

    Args:
        project: The GCP project ID.
        service_account: The Cloud Run service account email (least-privilege IAM).
    """
    gcloud_bin = "gcloud.cmd" if sys.platform == "win32" else "gcloud"
    # Vertex AI env vars are required for LLM model auth in Cloud Run.
    # GOOGLE_MODEL_LIVE must be set explicitly — without it the live agent falls back
    # to gemini-2.5-flash which is not supported by the Live bidiGenerateContent API.
    env_vars = ",".join([
        f"GOOGLE_CLOUD_PROJECT={project}",
        f"GOOGLE_CLOUD_LOCATION={_REGION}",
        "GOOGLE_GENAI_USE_VERTEXAI=1",
        "GOOGLE_MODEL_FLASH=gemini-2.5-flash",
        "GOOGLE_MODEL_LIVE=gemini-live-2.5-flash-native-audio",
    ])
    _run(
        [
            gcloud_bin,
            "run",
            "deploy",
            _SERVICE_NAME,
            "--source",
            ".",
            "--region",
            _REGION,
            "--platform",
            "managed",
            "--allow-unauthenticated",
            "--service-account",
            service_account,
            "--set-env-vars",
            env_vars,
            "--memory",
            "1Gi",
            "--cpu",
            "1",
            "--min-instances",
            "0",
            "--max-instances",
            "10",
            "--port",
            "8080",
            "--project",
            project,
            "--quiet",
        ]
    )
    logger.info("Deployed %s to Cloud Run (%s)", _SERVICE_NAME, _REGION)


def main() -> None:
    """Parse CLI args and execute the build + deploy pipeline."""
    parser = argparse.ArgumentParser(description="Deploy ElectraLensAI to Cloud Run.")
    parser.add_argument("--project", required=True, help="GCP project ID")
    parser.add_argument(
        "--service-account",
        required=True,
        help="Cloud Run service account email",
    )
    parser.add_argument(
        "--build-only",
        action="store_true",
        help="Only build the image; skip deployment.",
    )
    args = parser.parse_args()

    if not args.build_only:
        deploy_service(args.project, args.service_account)

    logger.info("Done.")


if __name__ == "__main__":
    sys.exit(main())
