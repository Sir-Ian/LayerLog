# Development plan

## Proposed technical direction

Use Atlassian Forge with TypeScript, a React-based Jira issue panel, Forge-hosted backend/storage where suitable, and Jira attachment references for photos if permission and API constraints permit. This is a starting proposal, not a verified scaffold. Confirm current Forge-supported UI/runtime choices, storage limits, attachment handling, and minimum scopes before implementation.

Keep domain validation and comparison logic independent of UI and platform calls. Store only the data needed for the demo. Use schema versions and stable attempt IDs. Validate issue access server-side; a client-supplied issue ID alone is not authorization. Tenant/install boundaries must be part of data access design.

## Milestones and suggested branches

1. `chore/forge-scaffold`: confirm contest/AI and cost gates, secure CLI authentication, verify supported runtime, scaffold and smoke-test the smallest issue panel.
2. `feat/print-attempts`: define schema and validation; implement persistence and add/edit/list flows with tests.
3. `feat/revision-comparison`: implement comparison and deterministic evidence checklist, with unit tests and a readable interface.
4. `feat/demo-workflow`: add labeled sample gear data, polish empty/error states and accessibility, test end-to-end behavior.
5. Optional `feat/evidence-assistant`: only after separate cost, rules, and data-use approval; add grounded summaries with evaluation cases.
6. `docs/contest-submission`: prepare installation/testing instructions and a concise demo script; Ian reviews and submits.

Create branches when work begins, not an empty branch for every future milestone. Each milestone should contain several small, coherent commits where needed, rather than one large dump.

## Before development starts

- Confirm current Codegeist eligibility, category, deliverables, and whether AI coding assistance is allowed. The published rules were not explicit in prior research.
- Inspect installed development tools before installing or upgrading anything.
- Complete Forge CLI authentication through a secure flow. Never put a token in chat, source, logs, or command history.
- Check available developer-site options and current Forge billing requirements. Ask before billing setup or paid services; do not assume account creation makes all usage free.
- The approved remote is the private Sir-Ian/LayerLog repository on GitHub. Verify remote commit IDs after pushing. Do not change visibility without authorization.

## Verification as the app grows

Establish documented lint, typecheck, unit-test, and build commands with the scaffold. Test validation, comparison, authorization boundaries, persistence, repeat actions, interrupted saves, and failure recovery. Use a development Jira site for integration checks. Record passed, failed, and unrun checks separately in each handoff. Never label an unrun suite as passing.

## Current handoff

Only planning and local version control are ready. There is no executable app or test suite yet. The next engineering task is the minimal Forge scaffold after the gates above are resolved, not an automatic deployment or contest submission.
