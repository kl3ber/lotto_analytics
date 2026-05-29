# ADR-001 — FastAPI over Node.js Express

**Date:** 2026-05-29
**Status:** accepted

---

## Context
The platform needs a backend that exposes REST endpoints for drawings, metrics, and insights. Two options were evaluated: Python FastAPI and Node.js Express. The backend will sit alongside an analytics engine written entirely in Python (pandas, scikit-learn, numpy).

## Options considered

| | FastAPI | Express |
|---|---|---|
| Language | Python | JavaScript/TypeScript |
| Shared language with ML engine | Yes | No |
| Native async | Yes | Yes (event loop) |
| Data validation | Pydantic built-in | Manual or Zod |
| Auto-generated docs | Swagger out of the box | Extension required |
| Performance | High | High |
| Direct pandas/numpy calls | Yes (no IPC needed) | No (subprocess or microservice) |
| Ecosystem fit | Natural for data/ML projects | Common for pure web APIs |

## Decision
**FastAPI.**

The analytics engine is Python — metrics, clustering, and AI insights are all Python libraries. Using FastAPI means the backend can call the analytics module directly as a local import, with no inter-process communication, no serialization overhead, and no language boundary. Express would require either a subprocess call to a Python script or a separate microservice, both of which add complexity without any benefit for this project.

## Consequences
- SQLAlchemy is used as the ORM (standard pairing with FastAPI)
- Alembic handles database migrations
- The backend and analytics engine share the same Python environment
- Express/Node.js is not used anywhere in the stack
