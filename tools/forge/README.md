# LayerLog's Forge toolchain

This directory runs the official Forge CLI 15.0.0 executable with a separately reviewed dependency lock. The executable code is unchanged; this dependency composition differs from Atlassian's published shrinkwrap and is maintained by this project.

## Install and run

From the repository root:

```sh
npm ci
npm run setup:forge
npm run check
npm run audit:all
npm run forge -- lint
```

`setup:forge` downloads `@forge/cli@15.0.0` from npm, verifies its archive against the SHA-512 integrity value recorded in `vendor.json`, then extracts only its unchanged `out/` files and license. It runs `npm ci` here against the committed toolchain lockfile. It does not register, deploy, install into Jira, change credentials, or enable analytics. Dependencies' own install scripts still run, as required by the toolchain.

`npm run forge -- <arguments>` launches that local CLI with the project's current working directory, so it uses the existing LayerLog manifest and normal Forge authentication. Downloaded vendor code, licenses, and node_modules are ignored; the version, integrity, manifest, and lockfile are committed. The official CLI's optional postinstall analytics worker is not run by the bootstrap.

## Why this exists

The official CLI's published `npm-shrinkwrap.json` fixed vulnerable transitive versions that ordinary root npm overrides did not replace. Moving the CLI's dependency manifest to its own install root allows npm to resolve patched releases without editing Atlassian's executable JavaScript, silently downgrading the CLI, or hiding findings from an audit.

Most upstream declared ranges now resolve patched versions. Two direct dependencies need explicit changes: `diff` 7 -> 8.0.3 and `tmp` -> 0.2.7. Root overrides in this directory fix glob, minimatch, SockJS's UUID dependency, and older tmp consumers. TypeScript is pinned to the same version as the app for the CLI's optional peer. The CLI's development/build dependencies and publication scripts are not needed to run its precompiled executable and are omitted; `private: true` prevents publishing this local composition.

Tests exercise the changed APIs: Forge's actual glob validator; diff patch/JSON operations; the UUID CommonJS API resolved from SockJS; and temporary-file creation/cleanup resolved from Inquirer's editor. Forge lint, version, deploy help, and install help also ran successfully. This is not a claim that every CLI feature or a live deployment has been tested.

## Maintenance

Audit both trees with `npm run audit:all`; auditing only the application tree is insufficient. Keep the vendor version and integrity coupled. For upgrades, review the official package's dependency manifest and code, update this directory's pins deliberately, regenerate its lock, bootstrap, and repeat both audits and all checks. Do not loosen the integrity check or use `npm audit fix --force` blindly.

When Atlassian ships a compatible CLI with a clean dependency tree, prefer returning to a normal project-local CLI dependency after equivalent verification. No automatic update or background monitoring has been configured.
