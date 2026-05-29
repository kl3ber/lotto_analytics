# CLAUDE.md

Project conventions for Claude to follow in every conversation.

---

## Branching strategy

The project uses GitHub Flow:

- `main` — always stable; represents what is (or will be) in production
- `feat/name` — one branch per feature; opened as a PR into main when ready
- `fix/name` — for bug fixes

### Rules
- Never push directly to `main` for features or fixes — always branch
- When starting work on a new feature or fix that would benefit from a branch, ask the user first: "Would you like me to create a branch `feat/name` for this?"
- Keep branch names short and lowercase with hyphens (e.g. `feat/ingestion-pipeline`, `fix/metrics-query`)
- Delete the branch after the PR is merged

---

## Git commits

- Never add `Co-Authored-By` lines to commit messages
- Use conventional commits with the following prefixes:
  - `feat:` — new feature or functionality
  - `fix:` — bug fix
  - `docs:` — documentation only
  - `refactor:` — code change that neither fixes a bug nor adds a feature
  - `chore:` — tooling, config, dependencies, project setup
  - `test:` — adding or updating tests
  - `style:` — formatting, whitespace, no logic change
  - `perf:` — performance improvement
  - `build:` — changes to build system or external dependencies (Docker, pyproject.toml)
  - `ci:` — CI/CD pipeline configuration
  - `revert:` — reverts a previous commit
- Keep commits atomic — one logical change per commit
- Write messages in English
- **Never commit unless explicitly asked by the user**

---

## Releases

When a milestone is fully complete:
1. Move `[Unreleased]` entries in `CHANGELOG.md` to a versioned section `[x.y.z] - YYYY-MM-DD`
2. Update milestone `Status` to `done` in `docs/milestones.md`
3. Commit the docs update
4. Create a git tag: `git tag vx.y.z && git push origin vx.y.z`
5. Create a GitHub Release pointing to the tag — use the `CHANGELOG.md` section as release notes

Version numbers follow the milestones: v0.1.0, v0.2.0, etc.
Patch releases (v0.1.1) are used for bug fixes after a milestone is shipped.

---

## Planning docs

The three planning files form a pipeline — ideas flow from left to right as they are built:

```
docs/roadmap.md  →  docs/milestones.md  →  CHANGELOG.md
(phases/vision)     (committed tasks)       (delivered)
```

- **`docs/roadmap.md`** — phases and long-term vision; no delivery dates
- **`docs/milestones.md`** — committed deliverables grouped by version; tasks checked off with `[x] *(YYYY-MM-DD)*` when done
- **`CHANGELOG.md`** — frozen record of what shipped; `[Unreleased]` tracks in-progress work until a milestone closes

### Before every commit, check and update if needed:
- `docs/milestones.md` — check off any completed tasks, add tasks that emerged, update `Status` field
- `CHANGELOG.md` — add new items to `[Unreleased]`; move to a versioned section when a milestone is fully done
- `docs/roadmap.md` — update phase status when milestones close
- `docs/decisions/` — if a significant architectural or technical decision was made, create a new ADR (`NNN-title.md`); if an existing decision changed, update its status
- READMEs — check if the root `README.md` needs updating when new components or modules are added
- Tests — check if the change introduces new behaviour that lacks test coverage; never commit untested features
- Include any changed planning files in the same commit

### Rules
- Never edit a checked task `[x]` — it is a historical record
- Never edit a versioned section in `CHANGELOG.md` after it is created
- When moving an item from roadmap to a milestone, remove it from `docs/roadmap.md` backlog section

---

## Tests

### When implementing a feature or fix:
- Analytics logic tests go in `analytics/tests/`, mirroring the module structure (`metrics/`, `clustering/`, `features/`, etc.)
- Backend tests go in `backend/tests/`, mirroring the route/service structure
- Run affected tests after every implementation change and report the result
- Do not mark a task done if tests fail
- **Never commit code that fails tests**

---

## Code quality

### Before every commit:
- Run `ruff check .` and fix any reported issues before committing
- Run `ruff format .` to format the code
- Do not commit code that fails ruff checks
- If new Python packages were imported, check that they are declared in the relevant `requirements.txt` or `pyproject.toml`
