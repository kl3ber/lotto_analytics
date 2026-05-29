# Feature: Metrics Calculation

**Milestone:** v0.1 (basic) / v0.2 (advanced)
**Status:** planned

---

## What it does
Transforms each raw drawing into a structured statistical feature vector. Basic metrics are calculated at ingestion time; advanced metrics (entropy, Hurst exponent, etc.) are computed in a separate pipeline pass and stored in `drawing_metrics`.

---

## Data flow

```
drawings table
      ↓
analytics/metrics/basic.py      (sum, even/odd, low/high, consecutive, ...)
analytics/metrics/advanced.py   (entropy, autocorrelation, Hurst, ...)
analytics/metrics/scores.py     (normalize → score 0–100)
      ↓
drawing_metrics table
      ↓
GET /metrics/{drawing_id}
```

---

## Database
Tables involved: `drawings`, `drawing_metrics`

`drawing_metrics` schema:
- `drawing_id` — FK to drawings
- `feature_name` — string key (e.g. `shannon_entropy`)
- `value` — raw float value
- `score` — normalized 0–100 score (percentile across all drawings)
- `version` — pipeline version tag

---

## Metric catalog

### Basic (v0.1)
| Feature | Description |
|---------|-------------|
| `sum` | Sum of the 6 drawn numbers |
| `even_count` | Count of even numbers |
| `odd_count` | Count of odd numbers |
| `low_count` | Count of numbers ≤ 30 |
| `high_count` | Count of numbers > 30 |
| `consecutive_count` | Count of pairs of consecutive numbers |
| `prime_count` | Count of prime numbers |
| `fibonacci_count` | Count of Fibonacci numbers |
| `range` | Max minus min of drawn numbers |
| `delay_avg` | Average gap (in drawings) since each number last appeared |
| `delay_max` | Maximum gap of the slowest number |

### Advanced (v0.2)
| Feature | Description |
|---------|-------------|
| `shannon_entropy` | Shannon entropy of the number distribution |
| `approx_entropy` | Approximate entropy (regularity measure) |
| `autocorrelation_lag1` | Autocorrelation of the sorted number sequence |
| `hurst_exponent` | Hurst exponent of drawing sums over time |
| `balance_score` | Spatial dispersion across the 1–60 range |
| `compressibility` | Approximate compressibility ratio |
| `fourier_peak` | Dominant frequency in the Fourier spectrum of number gaps |
| `anti_human_score` | Distance from typical human-chosen number patterns |
| `rarity_score` | Inverse frequency score for the specific combination |

---

## Backend

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/metrics/{drawing_id}` | all metrics for a drawing |
| GET | `/metrics/{drawing_id}/{feature}` | single metric value and score |
| GET | `/metrics/summary` | distribution stats for each feature across all drawings |
| POST | `/metrics/recalculate` | trigger full recalculation (admin) |

---

## Analytics module

```
analytics/
├── metrics/
│   ├── basic.py        # pure functions, no I/O
│   ├── advanced.py     # pure functions, no I/O
│   └── scores.py       # percentile normalization
└── tests/
    └── metrics/
        ├── test_basic.py
        └── test_advanced.py
```

Each function takes a drawing dict and returns a float. No database access inside the analytics module.

---

## Acceptance criteria
- [ ] All basic metrics calculated correctly for a known historical drawing
- [ ] `drawing_metrics` table populated for all historical drawings after pipeline run
- [ ] Scores are normalized 0–100 (no value outside the range)
- [ ] `GET /metrics/{drawing_id}` returns all features with values and scores
- [ ] Advanced metrics available in v0.2 for all drawings
- [ ] Recalculation is idempotent — running twice produces the same result
