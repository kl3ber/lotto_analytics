# UX Vision

## Purpose
Describe the visual tone, interface goals, and user experience approach for the platform.

## Design Principles
- technical and premium rather than playful or casino-like
- clear analytics, not gambling entertainment
- emphasis on facts, patterns, and explainability
- fast access to metrics and insights
- scalable for advanced analytics without overwhelming users

## Visual Tone
- dark or neutral palette with technical accent colors
- dashboard cards, charts, and heatmaps
- clean typography and data-focused layouts
- avoid icons or imagery that evoke casinos or betting

## Pages and Components
### Dashboard
- overall randomness score
- latest draw summary
- draw comparison charts
- cluster/regime summary

### Drawing Detail
- numbers and draw metadata
- fingerprint metrics
- explanations and insight panel
- similar historical draws

### Analytics
- frequency heatmap
- distribution charts (even/odd, low/high)
- trend lines for entropy and delay
- cluster visualization and regime timeline

### Metrics Presentation
- use a results table as the entry point, but keep it lightweight and configurable
- default table columns should include drawing number, draw date, drawn numbers, sum, even/odd, and low/high
- provide a column manager so users can enable or disable extra metric columns on demand
- support saved table views such as `Basic`, `Entropy`, `Cluster`, and `Randomness`
- use a detail panel or drawer to show the full metric set for a selected drawing without overloading the main table
- group metrics into categories: Basic, Distribution, Randomness, Structure, and Cluster
- expose quick filters for regimes, entropy ranges, year, and metric thresholds
- include tooltips or inline descriptions for scores to maintain clarity
- surface important metrics as cards or KPI tiles on the dashboard, rather than forcing users to scan the full table

### Premium Features
- Monte Carlo simulation controls
- smart game generation settings
- advanced statistical reports
- AI-powered insight panel

## Flexibility
- keep components composable for future changes
- use a modular design system to swap modules as needed
- define UI in terms of data cards and charts, not fixed screens
