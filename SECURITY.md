# Security Policy

## Supported Versions

Only the `main` branch (latest release) is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please do **NOT** open public issues for security vulnerabilities. Instead, contact the maintainers directly via private channels or email.

## Data Privacy & PII Handling

ElectraLensAI enforces a strict "Fail-Closed" privacy architecture:
1. **DLP Middleware**: All multimodal inputs (e.g., Voter ID card uploads, conversational text containing Aadhar or PAN data) pass through the Google Cloud Data Loss Prevention (DLP) API.
2. **In-Memory Masking**: PII is identified and masked (`***`) entirely in-memory.
3. **No Persistence**: Unmasked user inputs, audio streams, and document uploads are **never** persisted to disk, databases, or application logs.
4. **Agent Sandbox**: The ADK LLM Agents only ever receive the sanitized/masked context to generate their answers.

## IAM & Least-Privilege Service Account

The Cloud Run service runs as a dedicated service account `electralens-run-sa` with the minimum IAM roles required for full functionality:

| Role | Purpose |
|---|---|
| `roles/aiplatform.user` | Invoke Vertex AI Gemini models (Flash + Live) |
| `roles/dlp.user` | Invoke the Cloud DLP API for PII masking |
| `roles/logging.logWriter` | Write structured logs to Cloud Logging |

No `roles/editor` or `roles/owner` access is granted to the runtime identity. Secrets are never mounted as files; they are injected via environment variables from the deploy script.
