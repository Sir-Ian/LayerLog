# Evidence and comparison workflow

## What is implemented

Attempts have optional numeric settings with explicit units: layer height/nozzle diameter (mm), infill (%), nozzle/bed temperatures (°C). Blank means unknown; zero infill is a recorded value. Validation bounds protect data entry, not printer safety. Existing saved records remain readable with optional fields absent. Measurements are free-text with an explicit units/test-method prompt; they are user observations, not verified instrument readings.

Select two saved attempts in the same Jira issue to compare fields, observations, and physical results. A/B labels show sample provenance, plate, and saved revision. Comparisons are snapshots: reselect after editing. Different plates/revisions can be compared but are clearly identified. Changed fields do not imply causation or a recommendation to print.

Deterministic evidence prompts flag missing material, settings provenance, photos, observations, physical tests, and unsupported pass claims. They never alter the user’s physical result or invent an AI assessment.

## Photo references

The panel reads existing JPEG/PNG/WebP attachments on the current Jira issue using the user’s access. Add images through Jira’s Attachments control, then refresh the photo list. Each attempt supports up to 12 unique image references with source, optional UTC capture time, and caption/limitations. Attachment upload time is not assumed to be camera capture time. Unknown capture time stays blank; source can explicitly be `unknown`.

Server-side saves verify that every selected image still belongs to the accessible issue. Unsupported, cross-issue, or removed attachments prevent the save with a useful error; the draft stays open. Unlinking a photo only edits the attempt reference, never deletes the original Jira attachment. The list verifies photo availability on demand before offering a link. Jira performs access checks when opening an original.

This is supporting evidence infrastructure. It does **not** replace the A1 camera milestone or establish automatic capture/upload/job association. No images are sent to OpenAI, and no AI result is carried from one photo to another because no live AI assessment exists yet.

## Cost and access

No new dependency, scope, scheduled job, external model, or paid service. Photos remain original Jira attachments; Forge stores small reference/metadata records. Calls happen on user actions. The existing development-only deployment authorization applies; watch usage during hosted tests.

## Checks

`npm run check` passes 41 tests: numeric unknown/zero/bounds, image allowlisting and issue identity, photo validation, unauthorized photo writes, comparison boundaries and evidence gaps, plus the existing storage, camera, printer transport, importer, and toolchain checks. Local tests do not establish real printer authentication, live denied-user behavior, or visual assessment accuracy.

Current external blockers: private LAN-code entry for an actual authenticated report, real image-quality/fit evaluation by Ian, and a separately approved budget before any paid OpenAI call. Automatic monitoring remains deferred.


## Hosted checkpoint — November 9, 2026

Deployed development version 2.1.0 after a transient upload connection reset. Verified that a second labeled sample plate saves independently, invalid infill 101 is rejected without losing the draft, and valid zero infill / 0.16 mm layer height can be saved. Rapid character typing into the updated notes field preserved the exact input. A two-session stale-edit test was started but its final result was not observed before the temporary tab closed; do not claim that hosted conflict test passed. Service-level concurrency tests pass.

The subsequent Keychain update raises the full local suite to 44 tests. See [pairing instructions](PRINTER_PAIRING.md). The live integration is still unfinished; successful MQTT reports and original-photo attachment flow need verification.
