# 🧠 ElectraLensAI — Session Context
**Date:** 2026-04-24
**Status:** Scaffold Complete — Ready for ADK Integration

## Active Project
- **Name:** ElectraLensAI
- **Domain:** CivicTech / Election Education
- **Hackathon:** Gen AI APAC 2026

## Architecture Decisions
- **Agent Framework:** Google ADK (native Gemini, no extra deps)
- **Topology:** SequentialAgent root → 4 specialist sub-agents
- **Backend:** FastAPI 0.115 + SSE streaming on Cloud Run
- **Frontend:** React 18 + Vite 6 + TypeScript (Civic Dashboard aesthetic)
- **Region:** asia-southeast1 (Cloud Run)

## Agent Mesh
| Agent | Model | Tools |
|---|---|---|
| TimelineArchitectAgent | gemini-2.5-flash | google_search |
| BallotScribeAgent | gemini-2.5-flash | google_search |
| RumorGuardAgent | gemini-2.5-pro | google_search |
| SimulationEngineAgent | gemini-2.5-flash | (none — self-contained) |

## Quality Hardening Applied
- Ruff: D, ANN, S, E, W, F, B, I selectors
- Ghost diagnostic suppression: __pyrefly_virtual__ excluded
- Secure subprocess: list-based + noqa: S603, S607 on argument line
- All public functions: Google-style PEP 257 imperative docstrings
- 100% type annotations on all public interfaces

## Next Steps
1. `pip install -e ".[dev]"` in repo root
2. Set GOOGLE_API_KEY via Secret Manager or .env (dev only)
3. Run `uvicorn main:app --reload` for local backend
4. Run `npm run dev` in web/ for frontend
5. Deploy: `python scripts/deploy_cloudrun.py --project <PROJECT_ID> --service-account <SA_EMAIL>`
