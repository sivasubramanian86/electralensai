#!/bin/bash
# ElectraLensAI — Cloud Deployment Scaffolding Script
# This script sets up the necessary IAM roles and resources for deployment.

PROJECT_ID=$(gcloud config get-value project)
SERVICE_ACCOUNT_NAME="github-deploy-sa"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Using Project: ${PROJECT_ID}"

# 1. Create Service Account
gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
    --display-name="GitHub Actions Deployment Account" || echo "SA already exists"

# 2. Grant Roles to Deployment SA
ROLES=(
    "roles/artifactregistry.writer"
    "roles/run.admin"
    "roles/iam.serviceAccountUser"
    "roles/secretmanager.viewer"
)

for ROLE in "${ROLES[@]}"; do
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="${ROLE}" --quiet
done

# 3. Grant Secret Access to Cloud Run Runtime (Default Compute SA)
COMPUTE_SA="301947480687-compute@developer.gserviceaccount.com"
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor" --quiet

echo "IAM Setup Complete."
