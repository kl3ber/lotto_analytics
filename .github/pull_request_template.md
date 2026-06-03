## What this PR does
<!-- One line summarising the change -->

## Type of change
- [ ] feat — new functionality
- [ ] fix — bug fix
- [ ] refactor — no behaviour change
- [ ] docs — documentation only
- [ ] chore — config, dependencies, tooling

## Checklist
- [ ] Tests passing with coverage ≥ 80% (`pytest backend/tests/ --cov=app --cov-fail-under=80` from `backend/`)
- [ ] Ruff clean (`ruff check scripts/ backend/`)
- [ ] TypeScript clean (`tsc --noEmit` in `frontend/`) if frontend changed
- [ ] `docs/milestones.md` updated if a task was completed
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] `README.md` updated if setup instructions changed
- [ ] `.github/pull_request_template.md` updated if a new quality gate was added
- [ ] `.github/workflows/ci.yml` updated if a new component or test suite was added
- [ ] No `.env` or credentials in the diff

## Additional context
<!-- Links to issues, relevant ADRs, screenshots if UI -->
