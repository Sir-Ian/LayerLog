# Development plan

## Current priority — November 9, 2026

Build the core saved-attempt workflow next, followed by photo evidence and revision comparison. One real A1 snapshot has been captured and opened successfully; repeat capture, freshness, and unobstructed defect visibility still need verification. Those checks remain open but do not block core record development. Automatic monitoring is deferred at Ian's request.

### TODO: periodic capture and automatic visual monitoring (deferred)

- [ ] Capture periodically during an explicitly tracked print session and associate each image with the correct attempt; include final/completion, failure, and cancellation evidence where supported.
- [ ] Verify read-only printer status detection, session start/stop, reconnection, freshness, and behavior when the Mac sleeps or the helper stops. Avoid misattributing buffered images.
- [ ] Add automatic OpenAI checks for visible defects and early warnings, retaining evidence and uncertainty separately from physical fit/function results. No automatic printer control.
- [ ] Before enabling: agree capture/analysis cadence, photo retention, secure credential handling, data-use consent, and enforced usage/spending limits. The suggested 60-second interval is a proposal, not an approved requirement.

Prerequisites: persistent attempts, photo association, usable camera evidence, and evaluated on-demand visual analysis. This TODO authorizes no background service, scheduled capture, paid API call, or notification integration now.

## Previous priority — November 8, 2026

Ian approved camera capture before persistence. The `feat/a1-camera-proof` branch starts from the existing scaffold commit `317540b` to preserve its unmerged toolchain work. The local helper is implemented; hardware verification is pending. Follow [Camera capture](CAMERA_CAPTURE.md) before starting later milestones. Do not merge/tag this as a proven camera milestone until repeat captures and image quality have been checked on Ian's A1.

Then build persistent add/edit/list attempts with all fields visible and opt-in labeled gear samples; associate snapshots; then add on-demand OpenAI visual assessment. AI records visual pass/fail/unclear automatically, while physical testing remains manual. No continuous monitoring, live AI spending, or deployment is authorized by this implementation. The original sequence below remains historical context where it conflicts with this update.

## Proposed technical direction

Use Atlassian Forge with TypeScript, a React-based Jira issue panel, Forge-hosted backend/storage where suitable, and Jira attachment references for photos if permission and API constraints permit. This is a starting proposal, not a verified scaffold. Confirm current Forge-supported UI/runtime choices, storage limits, attachment handling, and minimum scopes before implementation.

Keep domain validation and comparison logic independent of UI and platform calls. Store only the data needed for the demo. Use schema versions and stable attempt IDs. Validate issue access server-side; a client-supplied issue ID alone is not authorization. Tenant/install boundaries must be part of data access design.

## Milestones and suggested branches

1. `chore/forge-scaffold`: record contest/AI assumption and confirm cost gates, secure CLI authentication, verify supported runtime, scaffold and smoke-test the smallest issue panel.
2. `feat/print-attempts`: define schema and validation; implement persistence and add/edit/list flows with tests.
3. `feat/revision-comparison`: implement comparison and deterministic evidence checklist, with unit tests and a readable interface.
4. `feat/demo-workflow`: add labeled sample gear data, polish empty/error states and accessibility, test end-to-end behavior.
5. Optional `feat/evidence-assistant`: only after separate cost, rules, and data-use approval; add grounded summaries with evaluation cases.
6. `docs/contest-submission`: prepare installation/testing instructions and a concise demo script; Ian reviews and submits.

Create branches when work begins, not an empty branch for every future milestone. Each milestone should contain several small, coherent commits where needed, rather than one large dump.

## Before development starts

- Recheck Codegeist requirements before submission. Ian has authorized starting on the assumption that AI coding assistance is allowed; no organizer ruling has been established.
- Inspect installed development tools before installing or upgrading anything.
- Complete Forge CLI authentication through a secure flow. Never put a token in chat, source, logs, or command history.
- Check available developer-site options and current Forge billing requirements. Ask before billing setup or paid services; do not assume account creation makes all usage free.
- The approved remote is the private Sir-Ian/LayerLog repository on GitHub. Verify remote commit IDs after pushing. Do not change visibility without authorization.

## Verification as the app grows

Establish documented lint, typecheck, unit-test, and build commands with the scaffold. Test validation, comparison, authorization boundaries, persistence, repeat actions, interrupted saves, and failure recovery. Use a development Jira site for integration checks. Record passed, failed, and unrun checks separately in each handoff. Never label an unrun suite as passing.

## Current handoff

Planning and Git version control are ready; private GitHub setup is recorded in the repository. This planning task does not verify live remote refs. The local Forge scaffold now includes a native issue panel and unit tests. See [Setup](SETUP.md) for actual commands and account prerequisites. Next: authenticate/register for the authorized development site, verify the panel in Jira, then implement attempt persistence.


## Implementation handoff — November 8, 2026

This is a proposed implementation sequence, not evidence that an app exists. Start only the next milestone; do not create branches for the entire backlog. The first useful vertical slice is **open a Jira issue -> save a print attempt -> reload and see it**.

### Gate 0: establish the development environment

Owner: the next scaffold agent, with Ian handling credentials and organizer clarification.

1. Follow Ian's decision to proceed with AI assistance, recorded in [Decisions](DECISIONS.md). Any later organizer clarification should be recorded with its source/date.
2. Inspect Node, package manager, and Forge CLI versions without reading credential files. Verify supported versions against current Forge documentation; pin the chosen runtime and package manager in setup instructions.
3. Verify development-site availability, usage allowances, and payment requirements. Browser login is not CLI authentication. Let Ian complete any necessary secure authentication; never request a token in chat.
4. Select the smallest supported Jira issue-panel template. Prefer UI Kit if its supported controls cover the forms and comparison; use Custom UI only if a specific requirement warrants it. Record the choice, storage API, scope list, and current documentation sources.
5. Separate local scaffolding from Forge registration, installation, and deployment. Record the intended development site and obtain authorization for account mutations/deployment before executing them.

Exit evidence: a dated environment record, recorded contest assumption, dependency versions, chosen architecture, and an explicit account/deployment scope. Unavailable access is a blocker, not a successful smoke test.

### Milestone 1: smallest issue panel (`chore/forge-scaffold`)

Suggested commit boundaries:

- Scaffold TypeScript and the issue panel; commit the manifest, lockfile, and necessary ignore rules.
- Add lint, typecheck, unit-test, and build scripts plus exact local setup commands.
- Add the panel's empty/loading/error states and document the authorized development installation smoke check.

Proposed layout, adjusted to the supported template: `src/domain/` for records and pure rules; `src/backend/` for resolvers, authorization, and storage; `src/frontend/` for the panel; `tests/` for behavior tests; `docs/` for setup and decisions. The initial scaffold uses the frontend/backend/shared directories; domain records will be added with persistence.

Done when: documented local checks pass, the panel can identify its authorized issue context, and any authorized development installation opens correctly. If no deployment is authorized, report the integration check as unrun and the milestone as locally verified only.

### Milestone 2: attempts and evidence (`feat/print-attempts`)

Build the domain contract first, then persistence, then add/edit/list UI. Use separate coherent commits with the relevant tests alongside each behavior.

| Record area | Proposed fields and rules |
| --- | --- |
| Identity | Server-issued stable attempt ID, schema version, immutable issue ID, created/updated timestamps, revision counter; never use a mutable issue key as the sole identity. |
| Model revision | Required human-readable revision label; optional HTTPS model reference. No CAD parsing, external fetching, or embedded credentials. |
| Material and settings | Required material label; optional printer label, nozzle diameter and layer height in mm, infill percent, nozzle/bed temperature in degrees C, orientation and slicer notes. Missing numeric values remain absent, not zero. |
| Test and outcome | Intended test, observations, outcome (`not-tested`, `pass`, `fail`, `inconclusive`), and optional measurements with explicit units. User-entered outcome is never a safety certification. |
| Evidence | Existing Jira attachment IDs plus captions, optional reference links, and notes. Verify attachment belongs to the current issue and is readable before display. Missing/deleted attachments remain visibly unavailable. |
| Provenance | Explicit sample/real flag on each attempt. Sample content stays visibly labeled in lists, detail views, and comparison. |

Proposed validation: required labels must contain non-whitespace text; optional dimensions must be positive; infill must be within 0–100 inclusive; numeric values must be finite; measurement units must be present. Decide and document string/collection limits before exposing writes. Temperature limits are data validation choices, not claims about printer/material safety. An unsupported pass result may be saved with an evidence warning so the record reflects what the user actually reported.

Backend contract: list attempts for the current issue; get an attempt; create an attempt; update with an expected revision. Treat every identifier from the UI as untrusted. Resolve the installation/context server-side, check the caller's issue access on every read and write, and agree the write-permission policy before implementing it. Partition storage by installation and issue. Recheck access on reopen; do not rely on cached permission or an app's broad access alone.

Use one record per attempt with bounded/paginated listing, subject to verified storage capabilities. Choose an atomic concurrency mechanism supported by that API before promising stale-edit protection. A stale revision must produce a reload/resolve conflict, not silently overwrite another edit. Make create retries idempotent within the same authorized issue; repeated clicks and interrupted responses must not duplicate attempts. Do not implement an unbounded whole-issue array or pretend a read-then-write check is atomic.

Photo scope: select/reference files already attached through Jira's own interface. Direct uploads and external binary storage are deferred. Validate current attachment APIs and scopes during the scaffold; if access is unavailable, show a clear limitation and retain textual observations rather than inventing a photo.

Done when: create/edit/reload works, blank and invalid fields have actionable errors, failed saves preserve input, and two issues plus two installations cannot read or change one another's records. Test forged IDs, denied access, stale updates, retry behavior, pagination, deleted attachments, and absent-vs-zero values. Live integration evidence is required for actual Jira permissions and installation isolation; mocks alone are insufficient.

### Milestone 3: comparison and evidence prompts (`feat/revision-comparison`)

Compare exactly two selected attempts from the same issue. Display model revision, material, settings, observations, outcome, and evidence side by side. Distinguish unchanged, changed, added, and missing values; compare numbers with their units. Do not silently convert incompatible measurements or infer that a setting caused an outcome.

Keep the deterministic checklist separate from the outcome: missing intended test, missing observations, unrecorded outcome, or a referenced-but-unavailable attachment. Each prompt names the missing field. A complete checklist does not certify the part. Unit-test missing fields, numeric zero, unit differences, identical attempts, sample labels, and differing outcomes. Finish with keyboard/screen-reader checks of selection and comparison.

### Milestone 4: smart-blind gear demo (`feat/demo-workflow`)

Create an explicit opt-in sample fixture with two or three clearly synthetic gear attempts. Illustrate a revision change and a reported fit observation without presenting invented measurements as Ian's results. Do not seed real Jira issues automatically. Keep an untested or inconclusive attempt in the story so uncertainty is visible.

Demo sequence: open the gear issue; inspect revision A and its evidence; add revision B with the intended change; record an observation; compare; identify the next missing test. Replace synthetic content only when Ian provides real evidence. Verify empty, loading, denied-access, failed-save, and unavailable-photo states on the development site, plus a fresh installation using written setup steps.

Done when: the workflow is understandable in under three minutes and checks have recorded outcomes. Prepare a script and installation guide locally. Publication, distribution, and contest submission remain separate authorized actions; Ian submits.

### Checks and Git handoff for every milestone

- Run the documented lint, typecheck, test, and build commands once those commands exist. Add `forge lint` if supported by the selected scaffold. Record exact commands, exit results, and any unrun integration checks.
- For documentation changes, run `git diff --check` and verify relative Markdown links resolve. A working URL does not resolve an unanswered contest interpretation.
- Review and stage explicit paths. Preserve small commits on the milestone branch; integrate with `--no-ff` only when the main checkout is available and the applicable checks pass.
- Parallel agents must own separate worktrees and non-overlapping files. Assign domain/backend/UI ownership only after the shared contract is agreed. Leave main untouched while another worker owns it.
- Report branch, commit IDs, changed files, checks, blockers, and the next task. Remote setup is owned separately; local commits are not a remote backup until their remote IDs are verified.
