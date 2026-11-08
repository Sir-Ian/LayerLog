# Dependency review — November 8, 2026

## Final result after toolchain remediation

**Both the application and Forge toolchain audits now report zero vulnerabilities.** The earlier residual findings below are historical and are resolved in the installed, locked toolchain.

The official CLI executable is unchanged and SHA-512 verified. Its dependencies are installed from a separately maintained manifest/lock in `tools/forge`, allowing patched versions to replace the vendor shrinkwrap. The former root CLI dependency was removed; it was not moved out of audit scope. `npm run audit:all` explicitly audits both install roots. See [toolchain setup and maintenance](../../tools/forge/README.md).

Validation: clean bootstrap (`npm ci` in the toolchain), clean root `npm ci`, application checks, four toolchain API compatibility tests, CLI version 15.0.0, deploy/install command help, and authenticated Forge lint. Both audits exit 0. No deployment or artifact upload was performed. Live installation/rendering tests remain the next integration check, not a dependency-audit blocker.

This custom dependency composition is project-maintained, not Atlassian's vendor-tested shrinkwrap. All CLI features have not been exercised. Keep both audits and the compatibility checks in the documented workflow; a clean audit does not guarantee the absence of unknown vulnerabilities.

## Earlier review result (superseded)

Application dependencies: **0 npm-reported vulnerabilities**, reproduced after `npm ci`. Full tree: **40 findings remain** (3 low, 21 moderate, 13 high, 3 critical). This is a completed review with app fixes and a remaining upstream CLI blocker, not a clean full-tree security assessment or a deployment approval.

All remaining direct advisory locations are inside `node_modules/@forge/cli/node_modules/`. The full audit also marks ancestor packages such as `@forge/api` and `@forge/react` through dependency propagation; the separate production-only audit is clean. Counts describe npm's affected-package report, not 40 independently exploitable vulnerabilities.

## Changes and compatibility

Pinned root overrides in `package.json`:

| Dependency | Before | After | Reason |
| --- | --- | --- | --- |
| prosemirror-view | 1.41.5 | 1.42.9 | Fix HTML paste XSS; upstream identifies 1.42.3 as the first patched version. |
| glob | 13.0.7 | 14.0.4 | Fix AbortSignal cancellation bypass affecting versions through 14.0.1. |
| minimatch | 10.2.6 | 11.0.5 | Fix globparts amplification affecting versions below 11.0.1. |

Glob and minimatch cross major versions. The application does not call them directly; `@forge/manifest` uses the async `glob(pattern)` API for extra-file validation. An integration smoke check exercised that actual validator, confirmed matching TSX files, and rejected a missing-file pattern. Strict TypeScript, app tests, compilation, and Forge lint pass. Node 22.23.4 satisfies the patched packages' engine requirements.

The ProseMirror override is within major 1. LayerLog currently has no rich-text editor/paste surface. Type checks pass; the future rendered UI still requires a Jira integration test. Do not infer full SDK compatibility from the audit alone. Keep the overrides until updated upstream dependencies allow removing them while preserving clean production audit and passing checks.

Sources: [ProseMirror advisory](https://github.com/ProseMirror/prosemirror-view/security/advisories/GHSA-c8x8-7fp4-3x9w), npm registry audit responses, and installed package manifests. [npm override documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json/#overrides).

## Why the original CLI install remained affected (resolved above)

`@forge/cli` 15.0.0 is the current published latest version checked during this review. It ships `npm-shrinkwrap.json`, pinning nested versions. Compatible audit fixes and explicit root overrides did not replace its affected nested dependencies; a clean installation confirmed this. Ineffective overrides were removed. The SDK/CLI were not downgraded and vendor files were not edited or repackaged.

The critical direct findings are `proxy-addr`, `shell-quote`, and `websocket-driver`. Additional findings affect tunneling/dev-server HTTP handling, command/editor helpers, archive/temp-file handling, HTTP clients, and parsers. These are development tools, but they can run with local credentials and filesystem access, so development-only classification does not make them harmless.

Current limits: do not expose a Forge tunnel/dev server, run the CLI over untrusted projects/archives, or treat local checks as proof of safe deployment tooling. The trusted local scaffold's lint/version commands passed, but exploitability of every CLI code path has not been proven absent. A vendor release with patched shrinkwrap or a separately reviewed toolchain remediation is needed to clear the full audit. No upstream issue was posted and no risk waiver was granted.

## Checks actually run

- `npm ci --no-fund`: exit 0; overrides reproduce with the lockfile. Upstream React peer/deprecation warnings remain.
- `npm run audit:production`: exit 0, zero vulnerabilities.
- `npm audit --json`: exit 1, 40 findings above.
- `npm run check`: exit 0; ESLint, strict typecheck, 5/5 tests, TypeScript compilation.
- Actual `@forge/manifest` package-validator smoke check: passed existing and missing file matching.
- `npm run forge -- lint`: exit 0, no issues found.
- `forge build --help` was inspected only. Forge build uploads artifacts, so it was not run. No deployment, installation, or cloud upload occurred.
- Live native UI and install/permission tests: not run.

Repeat with `npm run audit:production` and `npm run audit:all`. Audit requires registry access. A later clean audit is evidence for that date, not a guarantee of security.

## Original direct advisory inventory (resolved in patched toolchain)

These rows identify leaf advisories, excluding ancestor-only reports. All paths below are relative to `node_modules/@forge/cli/`.

| Package | Severity | Installed paths | Advisory references |
| --- | --- | --- | --- |
| ajv | moderate | `node_modules/ajv-keywords/node_modules/ajv`, `node_modules/babel-loader/node_modules/ajv` | [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) |
| body-parser | high | `node_modules/body-parser` | [GHSA-v422-hmwv-36x6](https://github.com/advisories/GHSA-v422-hmwv-36x6), [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) |
| brace-expansion | high | `node_modules/recursive-readdir/node_modules/brace-expansion` | [GHSA-f886-m6hf-6m8v](https://github.com/advisories/GHSA-f886-m6hf-6m8v), [GHSA-3jxr-9vmj-r5cp](https://github.com/advisories/GHSA-3jxr-9vmj-r5cp), [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg), [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895), [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr), [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7), [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) |
| compression | high | `node_modules/compression` | [GHSA-vc2v-76pw-4v95](https://github.com/advisories/GHSA-vc2v-76pw-4v95) |
| diff | low | `node_modules/diff` | [GHSA-73rr-hh4g-fpgx](https://github.com/advisories/GHSA-73rr-hh4g-fpgx) |
| fast-uri | moderate | `node_modules/fast-uri` | [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg), [GHSA-xhq7-xmqj-769h](https://github.com/advisories/GHSA-xhq7-xmqj-769h), [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr), [GHSA-333x-w4r6-6crp](https://github.com/advisories/GHSA-333x-w4r6-6crp) |
| follow-redirects | moderate | `node_modules/follow-redirects` | [GHSA-r4q5-vmmm-2653](https://github.com/advisories/GHSA-r4q5-vmmm-2653) |
| form-data | high | `node_modules/form-data` | [GHSA-hmw2-7cc7-3qxx](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx) |
| glob | moderate | `node_modules/glob` | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) |
| http-proxy-middleware | moderate | `node_modules/http-proxy-middleware` | [GHSA-64mm-vxmg-q3vj](https://github.com/advisories/GHSA-64mm-vxmg-q3vj) |
| launch-editor | high | `node_modules/launch-editor` | [GHSA-v6wh-96g9-6wx3](https://github.com/advisories/GHSA-v6wh-96g9-6wx3), [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv), [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw), [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) |
| lodash | high | `node_modules/lodash` | [GHSA-r5fr-rjxr-66jc](https://github.com/advisories/GHSA-r5fr-rjxr-66jc), [GHSA-xxjr-mmjv-4gpg](https://github.com/advisories/GHSA-xxjr-mmjv-4gpg) |
| minimatch | high | `node_modules/glob/node_modules/minimatch`, `node_modules/readdir-glob/node_modules/minimatch`, `node_modules/recursive-readdir/node_modules/minimatch` | [GHSA-3ppc-4f35-3m26](https://github.com/advisories/GHSA-3ppc-4f35-3m26), [GHSA-7r86-cg39-jmmj](https://github.com/advisories/GHSA-7r86-cg39-jmmj), [GHSA-23c5-xmqv-rm74](https://github.com/advisories/GHSA-23c5-xmqv-rm74), [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| picomatch | high | `node_modules/picomatch` | [GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p), [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj) |
| proxy-addr | critical | `node_modules/proxy-addr` | [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) |
| qs | moderate | `node_modules/qs` | [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx), [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g), [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) |
| shell-quote | critical | `node_modules/shell-quote` | [GHSA-w7jw-789q-3m8p](https://github.com/advisories/GHSA-w7jw-789q-3m8p), [GHSA-395f-4hp3-45gv](https://github.com/advisories/GHSA-395f-4hp3-45gv) |
| tar-fs | high | `node_modules/tar-fs` | [GHSA-vj76-c3g6-qr5v](https://github.com/advisories/GHSA-vj76-c3g6-qr5v) |
| tmp | high | `node_modules/external-editor/node_modules/tmp` | [GHSA-52f5-9888-hmc6](https://github.com/advisories/GHSA-52f5-9888-hmc6), [GHSA-ph9p-34f9-6g65](https://github.com/advisories/GHSA-ph9p-34f9-6g65) |
| undici | high | `node_modules/undici` | [GHSA-4qv8-2p9j-2685](https://github.com/advisories/GHSA-4qv8-2p9j-2685), [GHSA-f72v-6w45-q472](https://github.com/advisories/GHSA-f72v-6w45-q472), [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c), [GHSA-4w7w-5xrc-9h26](https://github.com/advisories/GHSA-4w7w-5xrc-9h26), [GHSA-2m5v-pch6-74hx](https://github.com/advisories/GHSA-2m5v-pch6-74hx), [GHSA-qrxm-fqhp-jwvm](https://github.com/advisories/GHSA-qrxm-fqhp-jwvm), [GHSA-9fm3-97px-rjf6](https://github.com/advisories/GHSA-9fm3-97px-rjf6), [GHSA-55wc-3pg8-jfw6](https://github.com/advisories/GHSA-55wc-3pg8-jfw6) |
| uuid | moderate | `node_modules/sockjs/node_modules/uuid` | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |
| webpack-dev-middleware | high | `node_modules/webpack-dev-middleware` | [GHSA-g84c-rxfj-3j2c](https://github.com/advisories/GHSA-g84c-rxfj-3j2c) |
| webpack-dev-server | moderate | `node_modules/webpack-dev-server` | [GHSA-f5vj-f2hx-8m93](https://github.com/advisories/GHSA-f5vj-f2hx-8m93), [GHSA-m28w-2pqf-7qgj](https://github.com/advisories/GHSA-m28w-2pqf-7qgj) |
| websocket-driver | critical | `node_modules/websocket-driver` | [GHSA-mp7j-qc5w-4988](https://github.com/advisories/GHSA-mp7j-qc5w-4988), [GHSA-xv26-6w52-cph6](https://github.com/advisories/GHSA-xv26-6w52-cph6) |
| ws | high | `node_modules/webpack-bundle-analyzer/node_modules/ws`, `node_modules/ws` | [GHSA-58qx-3vcg-4xpx](https://github.com/advisories/GHSA-58qx-3vcg-4xpx), [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p), [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) |
| yaml | moderate | `node_modules/yaml` | [GHSA-48c2-rrv3-qjmp](https://github.com/advisories/GHSA-48c2-rrv3-qjmp) |
