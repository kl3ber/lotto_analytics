# ADR-004 — Python for the full backend and analytics stack

**Date:** 2026-05-29
**Status:** accepted

---

## Context
The platform combines a REST API, data ingestion scripts, statistical feature engineering, and ML clustering. A decision was needed on whether to use a single language for everything or split responsibilities across Python (ML) and another language (backend).

## Options considered

| | Python everywhere | Python (ML) + TypeScript (API) |
|---|---|---|
| Language boundary | None | Python ↔ TypeScript via HTTP or subprocess |
| ML library ecosystem | Full (pandas, numpy, scikit-learn, scipy) | Full only on Python side |
| Developer context switching | None | Frequent |
| Shared data models | One Pydantic model for both API and analytics | Duplicate types in two languages |
| Deployment | One container | Two containers or complex build |
| Team size fit | Single developer | Better for larger teams with specialization |

## Decision
**Python for the full stack.**

All the analytical value of this platform comes from the Python ML ecosystem. There is no compelling reason to introduce a second language when FastAPI, Pydantic, and SQLAlchemy already cover the API and persistence needs at production quality. A single-language stack eliminates the cross-language boundary, reduces cognitive overhead, and allows sharing data models between the analytics engine and the API layer.

React + TypeScript is used for the frontend, but this is the standard browser constraint — not a server-side language split.

## Consequences
- The frontend (React/TypeScript) is the only non-Python layer
- All backend services, ingestion scripts, and analytics logic are Python
- A single `pyproject.toml` or `requirements.txt` per module covers all dependencies
- TypeScript types for the frontend API contract are derived from FastAPI's auto-generated OpenAPI schema
