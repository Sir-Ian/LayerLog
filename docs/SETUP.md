# Local development

## Installed toolchain

The initial scaffold uses Node.js 22.23.4, npm 10.9.9, and project-local Forge CLI 15.0.0. Exact dependencies are recorded in `package-lock.json`; `.nvmrc` selects the Node version for developers using nvm.

On Ian's Apple Silicon Mac, Node was installed through the existing Homebrew installation (`brew install node@22`). No shell profile was changed. In each new terminal, run:

```sh
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
cd /Users/iandeuberry/Projects/LayerLog
npm ci
npm run setup:forge
npm run check
npm run forge -- --version
```

On other machines, install a Forge-supported Node 22 release (at least 22.23.4), then run `npm ci` and `npm run setup:forge`. See [Atlassian's setup guide](https://developer.atlassian.com/platform/forge/getting-started/).

## Checks

| Command | What it verifies |
| --- | --- |
| `npm run lint` | ESLint checks application and test source. |
| `npm run typecheck` | Strict TypeScript checks application and tests. |
| `npm test` | Node's test runner checks issue identity validation, access failures, and safe errors using an injected Jira adapter. |
| `npm run build` | TypeScript compiles source into ignored `dist/`; this is a local compilation check, not Forge deployment packaging. |
| `npm run test:toolchain` | Checks the patched dependency APIs used by Forge. |
| `npm run check` | Runs lint, typecheck, app tests, toolchain tests, and build. |
| `npm run audit:all` | Audits both the app and the isolated Forge toolchain. |
| `npm run forge -- lint` | Forge-specific manifest/API checks; may require authenticated account access. |
| `git diff --check` | Checks changed lines for whitespace errors. |

Native UI Kit renders inside Jira. It is not a standalone website, and there is no local browser preview server in this milestone. Unit tests do not verify live Jira permissions or the rendered panel.

## Authentication and development deployment

The app is **registered but not deployed or installed**. The demo development site is https://one-atlas-xldf.atlassian.net (active; expires February 6, 2027). `manifest.yml` contains the real app ID from registration in the LayerLog Developer Space. The dated notes below preserve the setup history.

For future account setup and development deployment (login and registration are already complete on Ian's Mac):

1. Ian creates the required API token using the current Atlassian setup guide and enters it directly at the interactive prompt from `npm run forge -- login`. Do not send it through chat, a command argument, or a source file. Forge uses the operating system keychain.
2. Select the Jira development site. Browser account sign-in alone does not establish CLI authentication or create a Jira site.
3. Inspect actual account/billing requirements before registration/deployment. Get Ian's approval for any paid commitment; free allowances are not a guarantee that billing details are unnecessary.
4. Use the existing app ID; do not register another app. Run `npm run forge -- lint` to validate it.
5. With development deployment authorized, run `npm run forge -- deploy --environment development`, then `npm run forge -- install --environment development` and select the agreed site. Do not use production or publish a distribution link as part of this setup.
6. Open a test issue as a user with edit access, choose LayerLog, and verify loading, resolved issue key, and retry behavior. Repeat with denied access and an expired session. Record observed results separately from unit tests.

## Scaffold boundaries

The panel checks the current issue through a backend resolver and Jira's `asUser()` API. The frontend supplies no issue ID. Only issue identity is returned, never issue description or raw upstream errors. The manifest requests `read:jira-work`; there is no storage, external model, or write scope yet.

The ready screen intentionally explains that attempt recording is the next milestone. It does not pretend data is saved. Subsequent work adds validated records and storage with access checks, then editing, evidence references, and comparison.

## Dependency review

**Current result:** app and isolated Forge CLI toolchain audits both report zero vulnerabilities. The earlier 40 toolchain findings were resolved by installing unchanged official CLI code with a reviewed dependency lock. See the [dated review](reviews/DEPENDENCIES_2026-11-08.md) and [toolchain setup](../tools/forge/README.md) for compatibility checks and maintenance. The initial counts below are historical.

Initial installation on November 8, 2026 reported upstream advisories. `npm audit fix` did not clear them: the full dependency tree reported 55 (3 low, 28 moderate, 21 high, 3 critical), and `npm audit --omit=dev` reported 12 (4 moderate, 8 high). Production findings include transitive ProseMirror paste handling and glob/minimatch dependencies. This scaffold does not expose a rich-text editor or accept glob patterns, but that does not establish that dependencies are safe.

Do not use `npm audit fix --force` blindly: its suggested changes include major Forge SDK downgrades. Resolve or assess affected dependency paths before a deployment. Upstream React peer/deprecation warnings are also recorded; compilation alone does not prove runtime compatibility.


## Checkpoint results — November 8, 2026

- `npm run check`: passed (ESLint, strict typecheck, 5/5 unit tests, TypeScript build).
- `git diff --check`: passed; all 9 relative documentation links resolved.
- `npm run forge -- --version`: 15.0.0.
- `npm run forge -- lint`: blocked by missing Forge login. Initial sandboxed execution failed writing CLI state; unrestricted execution reached a first-run telemetry prompt. Optional local CLI usage analytics was disabled, and the next run explicitly reported “Not logged in.” No account credentials were read or entered.
- Live installation, rendered UI, and Jira permission tests: unrun; require authentication, real registration, target site, and authorized deployment.
- Dependency audit: findings remain as listed above; audit is not passing.


## Login follow-up — November 8, 2026

Ian completed CLI login. A new `npm run forge -- lint` invocation passed the missing-login stage but rejected the all-zero placeholder app ID; Forge validation is still not passing.

`npm run forge -- register LayerLog --personal` reached the authenticated account's Developer Space check. Forge reported no Developer Space membership and prompted to create one. The command was canceled at the name prompt: no space or app was created, and the manifest remains unchanged.

Next: obtain Ian's decision to create a Developer Space named LayerLog and register the app. Space creation links a billing account, so stop before any billing consent or payment setup. Then rerun Forge lint with the real app ID. The Jira installation target still needs selection.


## Developer Space created — November 8, 2026

Ian authorized creating the LayerLog Developer Space and registering the app, with an explicit stop before billing consent. The CLI confirmed creation of the **LayerLog** space. Registration then presented combined Developer Terms, Privacy Policy, and excess-usage billing consent. The agent answered **No**, as instructed; registration exited with “You must accept the terms and conditions.”

The space exists. The app remains unregistered, the manifest placeholder is unchanged, and no deployment occurred. Further registration requires Ian's explicit decision about the excess-usage billing agreement. Local implementation and checks can continue independently.


## Registration complete — November 8, 2026

Ian explicitly authorized accepting Developer Terms, Privacy Policy, and excess-usage billing consent, without adding a payment method or deploying. Standard `npm run forge -- register LayerLog` succeeded in the existing LayerLog Developer Space. The earlier `--personal` attempt failed because personal apps are not allowed in this space. Do not use that option for this project.

Forge created development, staging, and production environment entries; no code was deployed to any of them. `npm run forge -- lint` then passed with **No issues found** (exit 0). The real app ID is committed in the manifest. No payment method was added by this task.

## Cost controls and stopping testing

Ian requested minimizing charges and shutting down unused app activity. Apply these defaults to future work:

- Prefer local checks. Deploy only to the explicitly agreed development site/environment for planned integration tests; no automatic deployments.
- Keep the MVP on demand: no scheduled triggers, polling, background loops, containers, or paid LLM calls. The current manifest has none of these.
- Before and after hosted tests, review **Usage and charges** in the Developer Console. Document actual usage rather than promising a zero bill. Alerts, if configured later, are notifications rather than a spending cap.
- At the end of testing, stop local tunnels and uninstall disposable development installations when they are no longer needed. Confirm the target site and preserve/export any real attempt data before uninstalling; do not assume a reinstall restores data.
- Use the specific site and environment, not a broad batch operation:

```sh
npm run forge -- uninstall --site YOUR_TEST_SITE.atlassian.net --product Jira --environment development
```

- Verify the uninstall succeeded. Do not uninstall an installation still required for Ian's demo or judging without coordinating the timing.
- Closing the browser or stopping a local tunnel does not remove a hosted installation. There is no always-running server in this scaffold to switch off. Avoid equating an idle app or an uninstall with a guaranteed zero balance: accrued usage still counts, and future SQL or other retained resources can have storage/reservation costs.

Sources checked November 8, 2026: [Forge pricing](https://developer.atlassian.com/platform/forge/forge-platform-pricing/) (free allowances, usage charges, SQL stored-data billing) and [Forge uninstall](https://developer.atlassian.com/platform/forge/cli-reference/uninstall/) (site/environment-targeted removal). No uninstall is needed now because no app installation has been created.


## Development-site preparation — November 8, 2026

The signed-in in-app browser showed no Jira site in Atlassian Home's app switcher. Forge CLI 15.0.0 supports `site provision`; its help command was checked successfully without requesting a site.

Proposed next action, pending Ian's site-creation approval:

```sh
npm run forge -- site provision
```

This requests a demo site or returns an existing active one. It does not deploy LayerLog. The documented site includes Jira, other Atlassian apps, and seeded sample data, and is active for 90 days by default. Record the actual URL and expiry returned by provisioning. The CLI cannot extend or deactivate the site. Canceling the CLI after submission does not cancel a provisioning request, so do not run it merely to inspect account state.

Stop on any new payment requirement or billing consent. The provisioning guide does not explicitly state a site price; do not promise zero cost based on the word “demo.” Forge runtime usage remains subject to its separate free allowances and overage agreement. Deployment and installation remain separate authorization steps.

Source: [Provision a demo development site](https://developer.atlassian.com/platform/forge/provision-a-demo-development-site/), checked November 8, 2026. No site was provisioned during this preparation.


## Demo site active — November 8, 2026

Ian authorized the demo-site request without app deployment or installation. `npm run forge -- site provision` submitted the request; its initial watcher timed out while provisioning continued remotely. A subsequent invocation returned the existing site:

- Name: `one-atlas-xldf`
- URL: https://one-atlas-xldf.atlassian.net
- Status: **active**
- Expiry reported by Atlassian: **2027-02-06** (no time or timezone supplied).

No payment details or additional billing-consent prompt appeared during provisioning. This observation is not a guarantee about future Forge usage charges. No LayerLog deployment or installation was performed. Next: review dependency findings, then obtain approval for a development-only deployment and installation to this exact site. Preserve any needed demo evidence before the site expires; do not assume automatic extension.


## Patched toolchain ready — November 8, 2026

Use `npm run setup:forge` after a fresh checkout's `npm ci`. The Forge executable is downloaded from the official npm package, verified against a pinned SHA-512 hash, and run with the dependency tree committed in `tools/forge/package-lock.json`. This is a project-maintained dependency composition; the executable source is not modified. No global CLI replacement or credential change is required.

`npm run audit:all` now audits both roots and passes with zero vulnerabilities. `npm run check` includes five app tests and four toolchain tests. Authenticated Forge lint passes. The earlier dependency blocker is resolved for the verified local workflow; live deployment and UI verification remain separate next steps requiring the previously agreed authorization. No app code was deployed during remediation.
