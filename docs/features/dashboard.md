# Feature: Results Dashboard

**Milestone:** v0.1
**Status:** planned

---

## What it does
The main entry point of the platform. Displays a configurable table of historical drawings with metric columns the user can toggle on/off. Includes KPI cards for key indicators, quick filters, and a detail drawer for full per-drawing analysis.

---

## Data flow

```
GET /drawings?page=1&limit=50&sort=draw_date:desc
GET /metrics/summary
              ↓
DrawingsTable (React)
              ↓
User opens row  →  GET /metrics/{drawing_id}
              ↓
DrawingDetailDrawer
```

---

## Backend

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/drawings` | paginated list with inline basic metrics |
| GET | `/drawings/{id}` | full drawing detail (numbers + all metrics) |
| GET | `/metrics/summary` | global distribution stats (for KPI cards) |
| GET | `/views` | list saved column views |
| POST | `/views` | save a named column view |

---

## Frontend

### Pages
| Page | Route | Description |
|------|-------|-------------|
| `DashboardPage` | `/` | main table + KPI cards |
| `DrawingDetailPage` | `/drawings/:id` | full metric view for one drawing |

### Components
| Component | Description |
|-----------|-------------|
| `DrawingsTable` | virtualized table, sortable, configurable columns |
| `ColumnManager` | sidebar/modal for toggling columns on/off |
| `ViewSelector` | dropdown to switch between saved views |
| `KpiCard` | single metric summary card (value + sparkline) |
| `DrawingDetailDrawer` | side panel with full metrics for a selected drawing |
| `MetricBadge` | inline colored score indicator in table cells |
| `QuickFilters` | filter bar for date range, sum range, even/odd, etc. |

### Default column views
| View name | Columns |
|-----------|---------|
| Basic | drawing_number, draw_date, numbers, sum, even/odd, low/high |
| Entropy | drawing_number, draw_date, shannon_entropy, approx_entropy, hurst_exponent |
| Cluster | drawing_number, draw_date, regime_label, cluster_id, anomaly_score |
| Randomness | drawing_number, draw_date, balance_score, anti_human_score, rarity_score |

### State (Zustand — `dashboardStore`)
- `drawings` — current page results
- `columns` — active column set
- `activeView` — selected saved view name
- `filters` — active filter state
- `selectedDrawingId` — for the detail drawer
- `isDrawerOpen`

---

## Acceptance criteria
- [ ] Table loads with default Basic view showing correct columns
- [ ] Clicking "Column Manager" toggles additional metric columns on/off
- [ ] Switching views (Basic → Entropy) changes the column set instantly
- [ ] Sorting by any column works correctly
- [ ] Clicking a row opens the detail drawer with all metrics for that drawing
- [ ] KPI cards at the top show global averages and recent trend
- [ ] Quick filters (date range, even/odd) narrow the table results
- [ ] No more than 8 columns visible at once without horizontal scroll
