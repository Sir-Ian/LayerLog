# Bambu records and multiple plates

## Current implementation

The optional local importer reads Bambu 3MF metadata and saves immutable JSON snapshots in Git-ignored `.tmp/bambu-imports`. It preserves explicit plate numbers/names, global settings, object/part overrides, and sliced estimates when available. It does not parse CAD geometry, extract archive files, run G-code, or communicate with the printer.

```sh
npm run import:bambu -- /absolute/path/to/project.3mf
```

Requires Python 3.11+ (`python3`; this Mac has 3.12) and the existing Node/npm toolchain. No new third-party package is installed. Identical file content reuses the existing snapshot without overwriting it; changed content gets a new revision hash. Plate identity is scoped to that revision. Imports contain no print attempts: owning a file is not proof it was printed.

`src/shared/print-project.ts` defines plate references, print attempts, and project progress. Progress uses the latest observed attempt per plate, keeps reprints separate, rejects ambiguous/cross-revision associations, and never treats machine completion as physical success. The Jira panel is not wired to this data yet.

## Main workflow: record actual print runs

Ian usually changes settings or filament colors immediately before printing. Therefore **saved-project imports and UI snapshots are optional context, not the authoritative print-run record**.

Target hierarchy: project → revision → plate → print attempts. A repeat print creates a new attempt even if the filename and plate number are unchanged. Preserve the submitted job's settings and selected filament mapping with source/time evidence; keep subsequent printer observations as history rather than rewriting the initial record. A project changed in Studio after submission must not retroactively change the attempt.

The next integration must verify actual job identifiers, plate association, selected AMS mapping/material/color, and access to the exact submitted sliced job before claiming full capture. Do not identify jobs by filename alone, substitute current AMS inventory for the selected mapping, or backfill missing start-of-print data from later settings. Unknown/unobserved fields stay explicit. If tracking starts mid-print or the Mac misses a session, mark coverage incomplete.

Read-only status tracking is now part of the core integration requirement. Periodic photos and automatic OpenAI defect analysis remain deferred; no background tracker has been enabled. Printer control remains out of scope.

## Evidence and limitations — November 9, 2026

- Bambu Studio UI exposed an active job, recent project names, print history, and object settings. Local notes are in `.tmp/bambu-observations/PRINT_LOG.md` and `studio-observation.json`; these are dated observations, not live sync, and stay out of Git.
- Imported accessible local two-plate and single-plate projects successfully. Object overrides remain distinct from global defaults.
- Downloads project reads were blocked by macOS even after a sandbox escalation. Ian prefers using Studio rather than granting Downloads access; do not repeatedly request that permission or treat it as a blocker to visible UI logging.
- A TLS probe reached the printer's local status endpoint on port 8883 without credentials or commands. Authentication, actual report contents on this A1 firmware, exact job retrieval, and historical API access remain unverified. Seeing data in Studio does not establish that LayerLog has a reusable API integration.
- Community [MQTT protocol research](https://github.com/Doridian/OpenBambuAPI/blob/main/mqtt.md), reviewed November 9, describes report fields for job identifiers, progress, and AMS inventory. This is a feasibility lead, not proof of complete print-time settings or vendor API support.

## Verification

`npm run test:imports` checks two-plate metadata, overrides, sliced estimates, idempotency, revision changes, private output permissions, unsupported/ambiguous metadata, XML entities, size limits, and non-extraction. Synthetic fixtures contain no private projects. `npm test` checks plate progress, reprints, cross-project identities, and physical-result separation. Both are included in `npm run check`.

Remaining work: authenticated read-only live connector, job-to-plate matching and settings evidence, persistent Jira records/UI, and end-to-end validation. Do not describe this local foundation as an installed or synchronized app.

Checks on November 9: `npm run check` passed lint, typecheck, 10 application/domain tests, 4 toolchain tests, 8 camera tests, 6 Python import tests, and build (28 total). `git diff --check` and 26 relative documentation links passed. The loopback TLS test used authorized sandbox escalation. No live authenticated status, full history import, Jira deployment, or UI persistence test has run.
