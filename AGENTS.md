# LayerLog agent instructions

## Read first

Read README.md, docs/PROJECT_BRIEF.md, docs/DEVELOPMENT_PLAN.md, docs/DECISIONS.md, and docs/GIT_WORKFLOW.md before changing this project. Inspect git status and the current branch. Preserve unrelated edits. Check .agents/skills for relevant repository guidance if that directory appears later.

## Product boundaries

LayerLog is a focused Jira/Forge print-iteration tracker, not a slicer, printer controller, CAD engine, or engineering certification tool. Keep evidence separate from inference. Label sample data. Do not invent real measurements, test results, or contest eligibility findings.

## Working habits

- Implement the requested milestone, not the entire backlog at once.
- Follow the Git workflow: short-lived branches, small descriptive commits, checks before integration, and a clean handoff.
- For concurrent work, use separate worktrees and explicit ownership. Never switch another worker's shared checkout while it is active.
- Record material decisions and blockers in docs/DECISIONS.md, with dates and sources. Keep documentation aligned with actual behavior.
- Once tooling exists, run the applicable documented checks and report their exact outcomes. Documentation-only changes still need link/path and whitespace checks.
- Update setup instructions when adding a dependency or configuration requirement.

## Credentials, costs, and publication

Do not read or print secrets. Keep credentials in approved secure storage, not Git or chat. Do not assume browser login authenticates Forge CLI. Do not enable paid services, create billing commitments, push to a remote, publish a demo, register/submit the contest entry, or deploy beyond the requested scope without authorization. Ian submits the entry himself. Recheck contest AI-assistance rules before substantial AI-assisted implementation.

## Handoff

Report the current branch, commits, files changed, checks actually run, remaining blockers, and recommended next step. Do not claim a local commit is backed up remotely.
