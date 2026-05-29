# Feature: AI Insights

**Milestone:** v0.2
**Status:** planned

---

## What it does
Generates concise, factual, non-predictive textual explanations for individual drawings and for cluster regimes. Uses a language model to translate numeric metrics into natural language that a non-technical user can understand. Language is always descriptive ("this drawing had unusually high entropy") and never predictive ("the next drawing will be similar").

---

## Data flow

```
drawing_metrics + cluster assignment
              ↓
analytics/insights/prompt_builder.py   (builds structured context)
              ↓
Claude API (claude-haiku-4-5 or claude-sonnet-4-6)
              ↓
Insight text stored in drawing_insights table
              ↓
GET /insights/{drawing_id}
```

---

## Database
Tables involved: `drawing_insights`

`drawing_insights` schema:
- `drawing_id` — FK to drawings
- `insight_type` — `drawing` | `cluster_summary` | `metric_explanation`
- `content` — markdown text
- `model` — model ID used for generation
- `generated_at`
- `prompt_version` — hash or tag of the prompt template used

---

## Insight types

| Type | Trigger | Description |
|------|---------|-------------|
| `drawing` | on demand or batch | Narrative summary of a specific drawing's metrics and how they compare to average |
| `cluster_summary` | after clustering run | Description of what makes each regime distinctive |
| `metric_explanation` | static (cached) | Plain-language explanation of each metric definition |

---

## Prompt design principles
- Always describe, never predict
- Reference the actual numeric values in the explanation
- Compare to historical average to give context ("above the historical median")
- Keep language factual and quantitative — avoid "lucky", "good", "trending"
- Max output length: ~200 words per drawing insight

---

## Backend

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/insights/{drawing_id}` | drawing-level insight text |
| GET | `/insights/cluster/{cluster_id}` | cluster regime summary |
| GET | `/insights/metric/{feature_name}` | plain-language metric definition |
| POST | `/insights/generate/{drawing_id}` | trigger generation for a drawing (premium) |
| POST | `/insights/batch` | batch generate for all drawings missing insights (admin) |

---

## Frontend

### Components
| Component | Description |
|-----------|-------------|
| `InsightPanel` | renders markdown insight in the drawing detail drawer |
| `MetricTooltip` | hover tooltip using `metric_explanation` insights |
| `ClusterNarrative` | regime description card in cluster view |

---

## Analytics module

```
analytics/
├── insights/
│   ├── prompt_builder.py   # assembles context dict → prompt string
│   ├── generator.py        # calls Claude API, returns text
│   └── templates/
│       ├── drawing.txt
│       └── cluster.txt
└── tests/
    └── insights/
        └── test_prompt_builder.py
```

---

## Acceptance criteria
- [ ] `GET /insights/{drawing_id}` returns a factual, non-predictive text summary
- [ ] Insight references actual metric values from `drawing_metrics`
- [ ] No prediction language in any generated text
- [ ] `MetricTooltip` shows the plain-language definition on hover
- [ ] Batch generation runs without errors for all historical drawings
- [ ] Regenerating an insight for the same drawing updates `generated_at` and content
