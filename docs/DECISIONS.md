# Decisions and open questions

Updated: November 9, 2026.

## Agreed with Ian

- Name: LayerLog. Working name only; trademark/domain availability has not been checked.
- Product: Jira-based 3D-print iteration tracker, built for the Atlassian contest.
- Work location: Ian's registered LayerLog project on his Mac.
- Start with model revisions, material/settings, photos, outcomes, and comparison. Use the smart-blind gear as a potential real example.
- Keep Git changes small, intentional, versioned, and organized into branches.
- Ian has created a personal Atlassian account and signed in. No credential values belong in this repository.
- Ian reviews and submits the contest entry. The current task authorizes planning documents and local Git setup, not paid services or publication.

## Research baseline to reverify

The prior official-source review reported a December 22, 2026 deadline at 2 p.m. Chicago time, a Forge app and installation link, setup instructions, and a public YouTube demo under five minutes. Judges need only watch the first three minutes. Manufacturing appears to fit Apps for Specialized Industries. Ownership remains with the entrant, subject to contest promotional rights. Re-read the rules before relying on these details.

- Rules: https://codegeist2026.devpost.com/rules
- Event: https://codegeist2026.devpost.com/
- Forge setup: https://developer.atlassian.com/platform/forge/getting-started/
- Demo development sites: https://developer.atlassian.com/platform/forge/provision-a-demo-development-site/
- Pricing: https://developer.atlassian.com/platform/forge/forge-platform-pricing/
- AI development tooling: https://developer.atlassian.com/platform/forge/ai-development-toolkit/

## Open gates

- Contest-specific AI permission/disclosure is unconfirmed; Ian authorized proceeding on November 8, 2026. It is no longer an implementation blocker.
- Forge free allowances, payment-method requirements, optional AI costs, and the current demo-site offer need checking before setup.
- Choose and validate the exact storage, attachment, and UI architecture during the scaffold milestone.
- Remote: Ian approved the private GitHub repository https://github.com/Sir-Ian/LayerLog under his authenticated personal account, Sir-Ian. Keep it private; verify pushed refs after each push.
- No open-source license has been selected. Do not add one without Ian's decision.

## Recording future decisions

Add a dated entry with the choice, reason, source, and consequences. Separate user-approved choices from proposals and verification results. Keep this file short; move significant technical decisions into individual decision records if needed.

## November 9, 2026 — actual print runs and multi-plate projects

Source: Ian's request to log Bambu projects/history/current jobs/settings, add multi-plate support, and account for changes made just before printing.

- Prioritize read-only print-run tracking over manual re-entry or static project imports. Per-attempt evidence must reflect the submitted job and selected filaments, not later Studio edits or current AMS contents. API completeness is not yet verified.
- Model separate plates and repeated attempts; report project progress across plates without conflating printer completion with physical validation.
- Ian prefers UI logging instead of Downloads permission changes. Visible Studio observations are logged locally; they are dated snapshots and do not satisfy the live-sync requirement.
- Added optional bounded 3MF metadata import and tested multi-plate progress logic on `feat/bambu-project-import`, based on the existing camera branch. Actual project data and UI observations stay in ignored `.tmp`, outside the remote backup. No printer-control command, cloud login, or continuous watcher was added. See [integration status](BAMBU_IMPORT.md).

## November 9, 2026 — defer automatic monitoring; prioritize core records

Source: Ian's request in chat to make periodic capture and eventual automatic analysis a TODO while other project features are built.

- Desired future behavior: periodic photos during prints to preserve evidence and eventually detect problems early with automatic OpenAI checks. Keep this in the [development backlog](DEVELOPMENT_PLAN.md), not the current implementation.
- Prioritize saved attempts, photo evidence, and comparison. Capture cadence (60 seconds was suggested), retention, analysis budget, and alert behavior remain to be decided before enabling monitoring. No background capture or paid calls started.
- Observed hardware progress: one real 1536 × 1080 JPEG captured on A1 firmware 01.08.01.00, with LAN Only Mode off; the helper process was no longer running afterward. The printhead obscures the part, so this does not establish defect-detection quality, freshness, or repeatability. Photos stay local and ignored by Git.

## November 8, 2026 — camera-first implementation

Source: Ian's approved implementation plan and choices in this chat; [camera research and verification](CAMERA_CAPTURE.md).

- Start with a manually invoked local Mac helper for the A1. Use on-demand capture; no printer control, background monitoring, or cloud calls. Do not change printer settings without explaining the actual requirement first.
- Implement the community-documented TLS/JPEG protocol with Node built-ins. Explicit per-run certificate trust precedes hidden local credential entry; pin the authenticated connection to the probed certificate. This is first-use trust, not vendor certification.
- Keep captures in ignored `.tmp` with source/time/hash metadata. Skip the initial buffered frame, but do not claim freshness without visual confirmation.
- Later: all-fields-visible attempt forms, opt-in samples, and automatically saved OpenAI visual pass/fail/unclear separate from physical results. Credentials/spending ceiling and development deployment are later gates.
- Branch from the existing clean scaffold rather than integrating its untested hosted behavior into main. No remote push or milestone tag. Actual printer IP/firmware and hardware capture are still pending; tests do not establish camera compatibility or AI accuracy.


## November 8, 2026 — implementation planning and rules recheck

Source: the delegated planning request and the [official Codegeist 2026 rules](https://codegeist2026.devpost.com/rules), read November 8, 2026, especially section 4 (Intellectual Property).

- The rules permit contracted technical assistance under entrant creativity/work-product and ownership conditions. The reviewed rules do not explicitly settle AI-generated code permission or disclosure. This is an unresolved interpretation, not a finding that AI coding is forbidden or permitted.
- Next step for Ian: ask the organizer whether using Codex to generate/review implementation code is allowed and whether tool use must be disclosed. Suggested question: “May I use Codex for AI-assisted coding on my own project, and are there attribution or disclosure requirements?” No organizer message was sent by this task.
- At the time of the planning review, implementation was gated pending clarification; Ian subsequently authorized proceeding (see entry below). No personal eligibility determination has been made.
- The expanded development plan is a proposal: start with one issue-scoped create/reload flow, reference existing Jira attachments, and defer AI features and direct binary uploads. Verify actual platform APIs, permissions, storage concurrency, and pricing before implementation.
- This task owns `docs/implementation-plan` in an isolated worktree. GitHub setup remains with its existing worker; no remote/account changes are part of this planning task.


## November 8, 2026 — start implementation

Source: Ian's instruction in the project chat to assume AI assistance is allowed and start building.

- Proceed with AI-assisted implementation on Ian's working assumption. This supersedes the earlier clarification gate; it does not establish an organizer ruling. Do not contact organizers without authorization.
- Confirmed equipment: Bambu Lab A1 with AMS Lite. The slicer application has not been independently identified. Use labeled sample records until actual gear revisions and observations are available.
- Manual entry, Jira attachment references, and comparison remain the first-version scope.
- Begin `chore/forge-scaffold`: local Node/npm tooling, a TypeScript Forge UI Kit issue panel, and repeatable checks. Use native Atlassian components for this initial panel; visual product design comes with the attempt-entry milestone.
- Account authentication, app registration, development-site selection, and any billing consent remain separate setup steps. No credentials, paid services, or deployment are needed for local compilation and unit tests.


## November 8, 2026 — local scaffold architecture

- Use native UI Kit with a TypeScript resolver; keep the initial surface within Atlassian's existing design system. Sources: [issue panel](https://developer.atlassian.com/platform/forge/manifest-reference/modules/jira-issue-panel/) and [resolver](https://developer.atlassian.com/platform/forge/runtime-reference/forge-resolver/) documentation, checked today.
- Node 22.23.4 was installed with the existing Homebrew; npm dependencies and Forge CLI are pinned locally. No shell profile was edited.
- The resolver validates its context issue ID and uses Jira `asUser()` to check access. Only `read:jira-work` is requested; storage and writes are deferred to the next milestone.
- UI Kit's issue-panel button is limited to users with issue edit permission according to Atlassian's module documentation. Read-only viewing needs a separate surface decision if it becomes a requirement.
- Local checks do not establish a working installation. Authentication, real registration/site selection, live UI/permission checks, and dependency advisory review remain before development deployment. See [Setup](SETUP.md).


## November 8, 2026 — Developer Space prerequisite

Source: authenticated Forge CLI registration check and [Atlassian Developer Space creation documentation](https://developer.atlassian.com/platform/forge/developer-space/create-developer-space/), reviewed today.

- Ian completed CLI login. Validation now rejects the unregistered placeholder app ID.
- Forge reports no Developer Space membership. Registration was canceled before entering a new space name; no app or space was created.
- Space creation assigns the creator as admin and links a billing account. Ian's decision is requested before creating LayerLog's space; no billing consent, payment method, or deployment is authorized by this check.


## November 8, 2026 — space created; billing consent declined

Source: Ian's explicit approval to create the LayerLog space while stopping before billing consent, and the subsequent Forge CLI output.

- Created the Developer Space named LayerLog; the CLI confirmed success.
- App registration required consent to be billed when any Forge app in the space exceeds its free allowance. Answered No under Ian's restriction. Registration did not complete; the manifest is unchanged.
- No payment method was added and nothing was deployed. Local development remains available; registration is pending an explicit billing-consent decision from Ian.


## November 8, 2026 — registration authorized and cost controls

Source: Ian's explicit approval to accept terms and register, followed by his request to shut down unused activity and minimize charges.

- Accepted Developer Terms, Privacy Policy, and excess-usage billing agreement as authorized. Created no payment method and made no deployment.
- Standard registration succeeded in the existing LayerLog space after personal registration was rejected. The manifest now contains the real app ID; `npm run forge -- lint` passed with no issues.
- Prefer local testing and on-demand functionality. Avoid background polling, schedules, containers, and paid AI services. Review usage around hosted test sessions and remove unused test installations after preserving required data. Detailed shutdown instructions are in [Setup](SETUP.md).
- Registration/billing-consent blockers are resolved. Remaining before hosted testing: dependency advisory review, Jira site selection, and development-deployment authorization. No ongoing monitoring or automatic shutdown job has been configured.


## November 8, 2026 — proposed demo site

Source: signed-in Atlassian Home app switcher, installed CLI help, and [official demo-site guide](https://developer.atlassian.com/platform/forge/provision-a-demo-development-site/).

- No Jira site was visible for the browser account. The installed CLI supports a standalone demo-site request, so no app deployment is needed to obtain a test site.
- Proposed demo-site provisioning is pending Ian's approval. Respect the existing limits: no new billing consent, payment setup, or app deployment as part of this step. Record actual expiry because the default 90-day lifetime may not cover every later demo or judging date.


## November 8, 2026 — demo development site provisioned

Source: Ian's approval to create the demo development site and Forge CLI's returned site details.

- Demo site `one-atlas-xldf` is active at https://one-atlas-xldf.atlassian.net and expires February 6, 2027. The CLI did not supply an expiry time or timezone.
- Provisioning completed after the initial CLI watcher timed out. The next status retrieval returned the existing active site; no second site was created.
- No payment method, new billing consent, deployment, or LayerLog installation was performed. The existing restrictions on deployment and cost controls remain in force.


## November 8, 2026 — dependency remediation and residual CLI risk

Source: registry audit and installed package analysis, recorded in the [dependency review](reviews/DEPENDENCIES_2026-11-08.md).

- Added exact patched overrides for ProseMirror view, glob, and minimatch. Production audit is now clean after a reproducible `npm ci`; local checks, five tests, manifest glob integration, and Forge lint pass.
- Full audit still reports 40 affected packages through Forge CLI 15.0.0's shipped shrinkwrap. Root overrides did not fix that nested tree and ineffective overrides were removed. No vendor code edits, SDK downgrade, deployment, or risk waiver occurred.
- Keep local development available, but treat the unresolved CLI toolchain findings as an outstanding deployment review item. The full inventory and limits are in the review; do not describe the full dependency tree as clean.


## November 8, 2026 — resolve CLI dependency blocker

Source: Ian's request to own and solve the technical blocker; clean installs, audits, and CLI verification in this session.

- Keep official Forge CLI 15.0.0 executable code unchanged and verify its npm archive by pinned SHA-512. Resolve its dependencies at an isolated project install root with a committed reviewed lock, instead of relying on its vulnerable published shrinkwrap.
- Both app and toolchain audits now pass with zero vulnerabilities. `audit:all` explicitly covers both; no findings are hidden by excluding development dependencies. Retain API compatibility tests for the changed major versions.
- This is a project-maintained dependency composition, not a claim of vendor support for the modified lock. Prefer a conventional vendor CLI install again once a clean compatible release is available.
- The prior CLI dependency blocker is resolved for local validation. No deployment, installation, account/billing change, or external report was made. See [toolchain maintenance](../tools/forge/README.md).

## November 9, 2026 — read-only reports and stored attempts

Source: Ian’s requests for actual print-run settings, multi-plate support, and continued implementation. Details and references: [live print checkpoint](LIVE_PRINTS.md).

- Added a manually invoked 30-second authenticated MQTT subscriber with per-session certificate-chain trust plus leaf pinning, no application publish calls, no retries, and allowlisted local evidence. Verified the real A1 TLS handshake without credentials; authenticated reports are pending private code entry. Do not promote partial reports/current AMS inventory into a submitted-job settings claim.
- Added native Jira attempt forms and Forge custom entity storage with server-side issue access/edit checks, idempotent create IDs, and conditional revision updates. Tests exercise the service with an injected store; hosted transactions and UI remain unverified. `storage:app` is the new scope. No deployment/install occurred.
- Added pinned MQTT.js 5.16.1 (local tooling) and Forge KVS 2.1.2 (runtime). Keep private reports and photos outside Git. Continue on a stacked feature branch until hosted acceptance supports integration into main. No background monitoring or paid services were enabled.


## November 9, 2026 — authorized development deployment

Source: Ian's explicit “yes you can deploy” with the constraint to watch costs and avoid paying.

- Deployed and installed only development version 2.0.0 on the existing demo site. New payment details/agreements and paid capabilities were not enabled.
- Fixed TypeScript emit/root configuration required by the actual Forge bundler; local typecheck/build and deploy lint passed. Verified active entity indexes and hosted create/list/reopen/update using one labeled sample in PLAT-1.
- Usage dashboard displayed $0 charges/$0 forecast before and after tests, with up to one-hour reporting delay. No hard zero-dollar cap has been established. Retain on-demand-only behavior and review usage around future tests. Keep the installation available for Ian; no background service or AI calls are active. See [deployment results](SETUP.md#development-deployment-verified--november-9-2026).
