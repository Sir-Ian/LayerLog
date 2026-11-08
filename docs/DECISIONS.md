# Decisions and open questions

Updated: November 8, 2026.

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
