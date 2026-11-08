# Local development

## Installed toolchain

The initial scaffold uses Node.js 22.23.4, npm 10.9.9, and project-local Forge CLI 15.0.0. Exact dependencies are recorded in `package-lock.json`; `.nvmrc` selects the Node version for developers using nvm.

On Ian's Apple Silicon Mac, Node was installed through the existing Homebrew installation (`brew install node@22`). No shell profile was changed. In each new terminal, run:

```sh
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
cd /Users/iandeuberry/Projects/LayerLog
npm ci
npm run check
npm run forge -- --version
```

On other machines, install a Forge-supported Node 22 release (at least 22.23.4), then run `npm ci`. See [Atlassian's setup guide](https://developer.atlassian.com/platform/forge/getting-started/).

## Checks

| Command | What it verifies |
| --- | --- |
| `npm run lint` | ESLint checks application and test source. |
| `npm run typecheck` | Strict TypeScript checks application and tests. |
| `npm test` | Node's test runner checks issue identity validation, access failures, and safe errors using an injected Jira adapter. |
| `npm run build` | TypeScript compiles source into ignored `dist/`; this is a local compilation check, not Forge deployment packaging. |
| `npm run check` | Runs the four checks above in order. |
| `npm run forge -- lint` | Forge-specific manifest/API checks; may require authenticated account access. |
| `git diff --check` | Checks changed lines for whitespace errors. |

Native UI Kit renders inside Jira. It is not a standalone website, and there is no local browser preview server in this milestone. Unit tests do not verify live Jira permissions or the rendered panel.

## Authentication and development deployment

The app is **not registered or deployed**. The all-zero app ID in `manifest.yml` is an explicit local placeholder, not a real Atlassian registration.

When ready to connect the account:

1. Ian creates the required API token using the current Atlassian setup guide and enters it directly at the interactive prompt from `npm run forge -- login`. Do not send it through chat, a command argument, or a source file. Forge uses the operating system keychain.
2. Select the Jira development site. Browser account sign-in alone does not establish CLI authentication or create a Jira site.
3. Inspect actual account/billing requirements before registration/deployment. Get Ian's approval for any paid commitment; free allowances are not a guarantee that billing details are unnecessary.
4. With the account and target authorized, run `npm run forge -- register` to replace the placeholder ID. Review that manifest change and rerun `npm run forge -- lint`.
5. With development deployment authorized, run `npm run forge -- deploy --environment development`, then `npm run forge -- install --environment development` and select the agreed site. Do not use production or publish a distribution link as part of this setup.
6. Open a test issue as a user with edit access, choose LayerLog, and verify loading, resolved issue key, and retry behavior. Repeat with denied access and an expired session. Record observed results separately from unit tests.

## Scaffold boundaries

The panel checks the current issue through a backend resolver and Jira's `asUser()` API. The frontend supplies no issue ID. Only issue identity is returned, never issue description or raw upstream errors. The manifest requests `read:jira-work`; there is no storage, external model, or write scope yet.

The ready screen intentionally explains that attempt recording is the next milestone. It does not pretend data is saved. Subsequent work adds validated records and storage with access checks, then editing, evidence references, and comparison.

## Dependency review

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
