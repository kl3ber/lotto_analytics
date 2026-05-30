"""
CI docs check — fails with a non-zero exit code if any rule is violated.

Rules:
  1. CHANGELOG.md [Unreleased] section must not be empty.
  2. Every markdown link in README.md that points to a local file must exist.
  3. docs/milestones.md must not contain only unchecked tasks ([ ]) —
     at least one task must be checked ([x]) to confirm progress is tracked.
  4. Every feature spec listed in docs/features/ must declare a Status field.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
errors: list[str] = []


# ---------------------------------------------------------------------------
# Rule 1 — CHANGELOG [Unreleased] is not empty
# ---------------------------------------------------------------------------

changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
unreleased_match = re.search(
    r"## \[Unreleased\](.*?)(?=\n## |\Z)", changelog, re.DOTALL
)

if not unreleased_match:
    errors.append("CHANGELOG.md: [Unreleased] section not found")
else:
    body = unreleased_match.group(1).strip()
    has_versioned = bool(re.search(r"## \[\d+\.\d+\.\d+\]", changelog))
    if not body and not has_versioned:
        errors.append(
            "CHANGELOG.md: [Unreleased] section is empty — add entries for work in progress"
        )


# ---------------------------------------------------------------------------
# Rule 2 — README local links resolve to real files
# ---------------------------------------------------------------------------

readme = (ROOT / "README.md").read_text(encoding="utf-8")
local_links = re.findall(r"\[.*?\]\((?!https?://)([^)]+)\)", readme)

for link in local_links:
    target = (ROOT / link).resolve()
    if not target.exists():
        errors.append(f"README.md: broken link → {link}")


# ---------------------------------------------------------------------------
# Rule 3 — at least one milestone task is checked
# ---------------------------------------------------------------------------

milestones = (ROOT / "docs" / "milestones.md").read_text(encoding="utf-8")
checked = re.findall(r"- \[x\]", milestones, re.IGNORECASE)
unchecked = re.findall(r"- \[ \]", milestones)

if unchecked and not checked:
    errors.append(
        "docs/milestones.md: no tasks are checked off — mark completed work with [x]"
    )


# ---------------------------------------------------------------------------
# Rule 4 — every feature spec declares a Status field
# ---------------------------------------------------------------------------

features_dir = ROOT / "docs" / "features"
for spec in features_dir.glob("*.md"):
    content = spec.read_text(encoding="utf-8")
    if not re.search(r"\*\*Status:\*\*", content):
        errors.append(f"{spec.relative_to(ROOT)}: missing **Status:** field")


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

if errors:
    print("docs check FAILED:\n")
    for e in errors:
        print(f"  ✗ {e}")
    sys.exit(1)

print(f"docs check passed ({4} rules, 0 errors)")
