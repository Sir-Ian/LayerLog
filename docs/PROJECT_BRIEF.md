# Project brief

## Problem and audience

3D-print experiments often scatter model files, slicer settings, photos, and observations across folders and messages. A later revision may fail for an entirely different reason, yet the team loses the record of what changed. LayerLog brings this work into the Jira issue already tracking the part or engineering task.

Primary audience: small prototyping/manufacturing teams using Jira. Individual makers are a useful demonstration case, not a reason to require every hobbyist to adopt Jira.

## Core experience

1. Open a Jira issue for a part, such as a replacement smart-blind gear.
2. Add an attempt with a model revision reference, material, relevant settings, and intended test.
3. Record observations, photographs, measurements, and pass/fail or inconclusive results.
4. Compare two attempts to see which settings changed and what the evidence says.
5. See missing-evidence prompts before declaring a design successful.

The smart-blind gear is Ian's proposed real-world demo. Actual measurements and results must come from his tests. Use clearly labeled synthetic examples until those are supplied.

## First-version scope

November 9 refinement: projects have multiple plates, and every plate can have repeated print attempts. Prefer recording actual Bambu jobs and their print-time settings/filament selections over manual entry. Saved-file metadata and UI observations remain supporting evidence, with explicit uncertainty when the actual job cannot be matched. [Integration status](BAMBU_IMPORT.md) distinguishes implemented local tools from pending live synchronization.

- A Jira issue panel with a list of print attempts and an add/edit form.
- Attempt records: ID, issue reference, model revision/link, material, nozzle/layer/infill and other optional settings, notes, timestamps, observed result, and test evidence references.
- Explicit units for measurements and temperatures; distinguish missing values from zero.
- Side-by-side comparison of two attempts, including results rather than settings alone.
- Deterministic prompts for missing evidence, such as an unrecorded outcome or no test observation. These are checklists, not AI judgments or physical certification.
- A clean demonstration that uses sample data and an ordinary Jira issue.

## Optional AI extension

November 9 update: periodic capture and eventual automatic OpenAI checks for early visible defects are desired future features, explicitly deferred to the [development backlog](DEVELOPMENT_PLAN.md). Build core saved attempts, photo evidence, and comparison first. This supersedes the earlier statement that continuous monitoring was not requested; it is now a future goal, not enabled functionality.

November 8 update: Ian selected A1 camera capture as the immediate proof milestone, followed by on-demand OpenAI photo analysis. The intended output is an automatically saved visual pass/fail/unclear assessment, separate from his physical fit/function result. A manually started Mac helper is acceptable; continuous monitoring is not requested. See [camera scope and verification](CAMERA_CAPTURE.md). This supersedes the earlier manual-photo-only ordering; API spending and deployment remain gated.

An evidence-grounded assistant could summarize changes and flag unsupported conclusions. Any suggestion must link back to recorded evidence, identify uncertainty, and require human judgment. Do not promise mechanical safety, run invented simulations, or claim that a part will fit or survive a load.

AI is a later gate, not a prerequisite for basic tracking. Verify contest-specific AI-coding rules, provider pricing, and data handling before adopting a service. Do not send private design files or user records to an external model without authorization.

## Out of scope for the first entry

Printer control, automatic slicing, STL/CAD parsing, finite-element simulation, printer telemetry, inventory management, autonomous physical validation, and a separate general-purpose project-management platform.

## MVP acceptance criteria

- An authorized user can create, reopen, edit, and compare attempts within the intended Jira issue.
- Attempts persist across refreshes and do not leak across projects or installations.
- Invalid values produce useful form errors; empty, loading, permission-denied, and failed-save states are handled.
- Missing evidence is visible and never silently replaced with invented data.
- The demo tells a clear revision -> print -> test -> learn story in under three minutes.
