# Project Structure

Actual folder layout as of 2026-06-03. Items marked `✓` are implemented.

```
lotto_analytics/
│
├── backend/                        ✓  FastAPI REST API + all analytics logic
│   ├── app/
│   │   ├── main.py                 ✓  app factory, router registration, CORS
│   │   ├── database.py             ✓  SQLAlchemy engine, Drawing ORM model, get_db
│   │   ├── schemas.py              ✓  all Pydantic request/response models
│   │   └── routers/
│   │       ├── drawings.py         ✓  GET /drawings, GET /drawings/{number}
│   │       ├── analytics.py        ✓  GET /analytics/frequency, /prizes, /cooccurrence
│   │       ├── patterns.py         ✓  GET /analytics/patterns (13 metrics)
│   │       └── statistics.py       ✓  GET /analytics/statistics, /bootstrap,
│   │                                      /autocorrelation, /hurst, /runs-test,
│   │                                      /gap-distribution, /pair-bias,
│   │                                      /monte-carlo
│   ├── tests/
│   │   ├── conftest.py             ✓  in-memory SQLite fixtures, TestClient setup
│   │   ├── test_drawings.py        ✓
│   │   ├── test_analytics.py       ✓
│   │   ├── test_patterns.py        ✓
│   │   └── test_statistics.py      ✓  66 tests
│   └── requirements.txt            ✓  fastapi, uvicorn, sqlalchemy, scipy, numpy,
│                                          pytest, pytest-cov
│
├── frontend/                       ✓  Next.js 16 (App Router) + TypeScript + Tailwind
│   ├── app/
│   │   ├── layout.tsx              ✓  root layout with global navbar
│   │   ├── page.tsx                ✓  home → redirects to /concursos
│   │   ├── concursos/
│   │   │   └── page.tsx            ✓  results table (DrawingsTable)
│   │   ├── analises/
│   │   │   ├── layout.tsx          ✓  sidebar navigation (Frequência, Padrões,
│   │   │   │                              Prêmios, Estatísticas groups)
│   │   │   ├── frequencia/
│   │   │   │   └── page.tsx        ✓  heatmap, histogram, decades, ranking,
│   │   │   │                              drought table, co-occurrence
│   │   │   ├── padroes/
│   │   │   │   └── page.tsx        ✓  13 pattern charts with date filter
│   │   │   ├── premios/
│   │   │   │   └── page.tsx        ✓  prize history, accumulation cycles, milestones
│   │   │   └── estatisticas/
│   │   │       └── page.tsx        ✓  chi-square, KS, desvios, bootstrap,
│   │   │                                  autocorrelação, hurst, runs, intervalos,
│   │   │                                  viés de pares
│   │   └── jogo/
│   │       └── page.tsx            ✓  scaffold (content pending M11/M13)
│   ├── components/
│   │   ├── analysis-layout.tsx     ✓  AnalysisPageLayout + AnalysisSection
│   │   ├── date-filter.tsx         ✓  shared date inputs + quick presets
│   │   ├── pattern-chart.tsx       ✓  3-variant chart (default, soma, bars)
│   │   ├── prize-chart.tsx         ✓  multi-series log-scale scatter
│   │   ├── frequency-grid.tsx      ✓  1–60 heatmap with trend badges
│   │   ├── frequency-histogram.tsx ✓
│   │   ├── frequency-decades.tsx   ✓
│   │   ├── frequency-ranking.tsx   ✓
│   │   ├── drought-table.tsx       ✓
│   │   └── cooccurrence-table.tsx  ✓
│   ├── lib/
│   │   └── api.ts                  ✓  typed fetch functions + all response interfaces
│   └── package.json                ✓  next, react, recharts, tailwindcss, tanstack
│
├── scripts/                        ✓  ingestion and data pipeline
│   ├── ingest_mega_sena.py         ✓  fetch from Caixa API → raw JSON → trusted CSV
│   ├── export.py                   ✓  regenerate CSV from raw JSONs (offline)
│   ├── seed_db.py                  ✓  bulk-load DB from CSV; supports --truncate
│   └── requirements.txt            ✓
│
├── data/
│   ├── raw/                        ✓  raw JSON artifacts from Caixa API
│   └── trusted/                    ✓  mega_sena.csv (source of truth)
│
├── docs/
│   ├── milestones.md               ✓  committed deliverables by version (authoritative)
│   ├── roadmap.md                  ✓  phases and long-term vision
│   ├── structure.md                ✓  this file — actual folder layout
│   ├── product-spec.md               vision, user stories, acceptance criteria
│   ├── sdd.md                        architecture and ML pipeline design
│   ├── ux-vision.md                  UX principles
│   ├── operational-plan.md           ingestion schedule, monitoring, deployment
│   ├── features/                     per-feature specs (planning docs)
│   └── decisions/                    ADRs (architectural decision records)
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                  ✓  pytest with 80% coverage floor
│   └── pull_request_template.md    ✓
│
├── lotto.db                        ✓  SQLite database (project root — not in backend/)
├── CLAUDE.md                       ✓  project conventions for AI-assisted development
├── CHANGELOG.md                    ✓  delivery history
└── README.md                       ✓  setup instructions
```

## Module dependency rules

```
scripts/  ──►  database (SQLAlchemy directly)
               ↓
backend/app/routers/  ──►  database.py + schemas.py
               ↓
frontend/lib/api.ts  ──►  REST API only (never imports Python)
```

- `backend/` analytics logic lives directly in routers — no separate `analytics/` package yet (planned refactor in M7.5)
- `backend/app/routers/statistics.py` uses `scipy` and `numpy` for all statistical computations
- `frontend/` communicates only via the REST API
- `lotto.db` must be at the project root; backend started with `PYTHONPATH=backend` from root
