# ElectraLensAI Architecture

## High-Level Overview

ElectraLensAI is a **multi-agentic, multi-modal, and multi-lingual** civic platform designed to simplify complex election processes and laws for global citizens. It is built as a production-ready, hybrid-cloud application designed to be scaled for massive concurrent usage during election cycles.

## Core Pillars

1. **Frontend (Vite + React + Tailwind + Recharts)**
   - Modular, tab-based Single Page Application (SPA).
   - Fully localized via `i18next` with real-time translation pipelines.
   - Built to be accessible, responsive, and cross-platform.

2. **Backend (FastAPI + Google ADK)**
   - Asynchronous API framework utilizing HTTP/2 Server-Sent Events (SSE) for streaming agent responses.
   - Designed around a **Sequential Mesh Architecture** where a root orchestrator delegates to domain-specific RAG agents.

3. **Multi-Agent Orchestration (Google ADK)**
   - `ElectraLensOrchestrator`: The root routing agent (Gemini 2.5 Flash).
   - `BallotScribeAgent`: RAG specialist for voter ID and registration laws.
   - `TimelineArchitectAgent`: Handles election dates and milestone mapping.
   - `RumorGuardAgent`: Real-time fact-checking agent against verified sources (Gemini 2.5 Pro).
   - `SimulationEngineAgent`: Step-by-step walkthrough generation for first-time voters.

4. **Security & Privacy Layer (Google Cloud)**
   - **Data Loss Prevention (DLP)**: All PII is intercepted and masked (`***`) in-memory using GCP DLP patterns.
   - **Translation Service**: Dynamic backend routing to Google Cloud Translation API.

## Detailed Component Interaction

### 1. Sequential Mesh Orchestration
The core of ElectraLensAI is the **SequentialAgent** (Root). It acts as an intelligent router:
- **Intent Detection**: Analyzes query against sub-agent descriptions.
- **Specialist Delegation**: Routes query + context to the selected sub-agent.
- **Stream Synthesis**: Aggregates and streams output via HTTP/2 SSE.

### 2. Multimodal Live Session Flow
- **WebSocket Connection**: Persistent bi-directional link.
- **ADK LiveRequestQueue**: Buffers client inputs for Gemini Multimodal Live API.
- **Real-time processing**: Handles `transcript` and `audio` asynchronously.

## Deployment Strategy
The application is packaged in Docker and deployed to **Google Cloud Run**, ensuring:
- Zero-downtime rollouts.
- Scale-to-zero capabilities for cost efficiency.
- Built-in TLS termination and horizontal auto-scaling.

## Security Controls
- **IAM Least-Privilege**: Dedicated service account with scoped access.
- **Secret Management**: Keys injected via Environment Variables.
- **Frontend CORS**: Restricted to authorized origins.
