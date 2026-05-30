# ADR-005 — Frontend stack: Next.js + TanStack Table + shadcn/ui

**Date:** 2026-05-30
**Status:** accepted

---

## Context
The platform needs an interactive dashboard to display historical lottery drawings with configurable columns, filters, and eventually metric overlays. The main UI challenge is a high-column-count data table with sorting, pagination, and column toggling — not a typical content site.

## Options considered

| | Next.js + TanStack Table | CRA / Vite + AG Grid | Remix + custom table |
|---|---|---|---|
| Table capability | Headless — full control over rendering | Feature-rich out of the box | Custom — more work |
| Bundle size | Lean (headless) | Heavy (~800KB) | Variable |
| SSR / SSG | Built-in | Manual setup | Built-in |
| UI components | shadcn/ui (copy-paste, Tailwind) | Separate library needed | Separate library needed |
| TypeScript support | Excellent | Good | Good |
| Security posture | Standard | AG Grid had licensing changes; TanStack had a npm incident (pre-pinned version used) | N/A |

## Decision
**Next.js + TanStack Table v8 (pinned to pre-incident version) + shadcn/ui + Tailwind CSS.**

Next.js provides routing, SSR and a production-ready React setup. TanStack Table is headless — we own the markup and styling, which fits the premium quant-terminal aesthetic defined in `docs/ux-vision.md`. shadcn/ui gives accessible, unstyled-by-default components that compose well with Tailwind. Zustand manages client state (active columns, filters, selected drawing).

TanStack Table is pinned to a version predating the May 2025 npm supply chain incident. The package is audited before any version bump.

## Consequences
- `frontend/` is a Next.js app; API types are generated from FastAPI's OpenAPI schema
- State management: Zustand (`dashboardStore`) for column config, filters, drawer state
- Charts (Recharts or Plotly) added in a later milestone when metric visualizations are needed
- `docs/sdd.md` section 9 (Frontend stack) should be updated to reflect this decision
- Any TanStack Table version bump requires explicit review of the changelog and a re-audit
