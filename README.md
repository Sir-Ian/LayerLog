# LayerLog

**Turn failed prints into repeatable progress.**

LayerLog is a Jira app built on Atlassian Forge that keeps a 3D-print project's model revisions, print settings, photos, and test results together. Instead of guessing what changed between attempts, a maker or small engineering team can compare the evidence and decide what to print next.

## Start here

- [Project brief](docs/PROJECT_BRIEF.md): problem, product scope, example workflow, and acceptance criteria.
- [Local setup](docs/SETUP.md): toolchain, checks, and secure account setup.
- [One-time printer pairing](docs/PRINTER_PAIRING.md): remember access securely in macOS Keychain.
- [A1 camera capture](docs/CAMERA_CAPTURE.md): local helper and real-printer verification.
- [Bambu records and plates](docs/BAMBU_IMPORT.md): metadata imports, multi-plate tracking, and pending live integration.
- [Photo evidence and comparison](docs/EVIDENCE_COMPARISON.md): structured settings, image references, and evidence checks.
- [Development plan](docs/DEVELOPMENT_PLAN.md): milestones, proposed architecture, and next steps.
- [Decisions and open questions](docs/DECISIONS.md): what is agreed and what still needs verification.
- [Git workflow](docs/GIT_WORKFLOW.md): small commits, feature branches, review, and recovery.
- [Agent instructions](AGENTS.md): operating rules for anyone working in this repository.

## Status

November 9 update: the [read-only status helper and Jira attempt workflow](docs/LIVE_PRINTS.md) are implemented locally. Printer TLS verification passed; authenticated real printer reports remain unverified; hosted Jira create/refresh/reopen/update now pass. The form supports per-plate attempts but automatic Bambu synchronization is not connected. Development version 2.0.0 is deployed and installed on the demo site; no paid AI calls have occurred.

Bambu integration: an optional local 3MF metadata importer and multi-plate progress model are implemented. Studio's visible history/settings have been logged locally. Actual print-run synchronization is the next integration priority so last-minute settings and filament selections are preserved. These tools are not yet connected to the Jira panel.

Current status: the local A1 helper has captured one readable real-printer photo and stopped. Repeatability and unobstructed defect visibility remain unverified. Next: saved attempts, photo evidence, and comparison. Periodic capture and automatic AI monitoring are deferred TODOs in the development plan. No OpenAI calls have been made; the development-only installation is now available.

Local Forge scaffold started November 8, 2026: TypeScript, a native Jira issue panel, backend issue-access checks, and local test/build commands. Attempt persistence is now implemented locally and awaits hosted verification. The app is registered in the LayerLog Developer Space and passes Forge lint; development version 2.0.0 is deployed and installed. The private GitHub repository is [Sir-Ian/LayerLog](https://github.com/Sir-Ian/LayerLog). Ian has created a personal Atlassian account and signed in through his browser. Browser sign-in does not establish Forge CLI authentication.

The initial target is Codegeist 2026, with a proposed manufacturing/specialized-industries entry. Contest requirements and pricing must be rechecked before implementation and submission. Ian reviews and submits the contest entry himself.
