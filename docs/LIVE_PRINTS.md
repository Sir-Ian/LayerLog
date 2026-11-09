# Read-only printer reports and saved Jira attempts

## Implemented locally — November 9, 2026

The status helper authenticates to local MQTT over TLS, subscribes to `device/+/report`, observes for 30 seconds (at most 100 usable reports), disconnects, and saves selected fields under ignored `.tmp/layerlog-status-*/status.json`. There are no application publish calls, printer controls, cloud logins, automatic retries, or background service. MQTT authentication/subscription and transport keepalive packets are necessary for reading reports.

```sh
cd /Users/iandeuberry/Projects/LayerLog
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm run printer:status -- --host PRIVATE_PRINTER_IP
```

Confirm the displayed certificate fingerprint on a trusted LAN; enter the LAN code only at the hidden Terminal prompt. Credentials are kept in process memory for the session and never saved. Ctrl+C cancels and closes the connection. Files are created with owner-only permissions. Failed or empty observations produce an explanatory error instead of invented status.

A credential-free probe obtains the presented certificate chain. The authenticated connection trusts that chain for this run and additionally requires the exact leaf fingerprint before sending MQTT credentials. This is first-use trust, not independent vendor/device authentication. Tests verify changed-pin rejection before authentication. A real A1 TLS handshake verified successfully; real authenticated report capture remains pending Ian's private code entry.

Only bounded, allowlisted fields are persisted: reported job identifiers/names, progress, temperatures, machine state, and reported AMS inventory/current tray. Unknown fields and raw messages are discarded. Reports stay separate with receipt timestamps and retained-message flags; partial updates are not merged across potentially different jobs. Receipt time does not prove when a retained value was measured.

**This is not full print synchronization yet.** The helper does not retrieve historical jobs or submitted sliced files, prove plate identity, or verify selected filament mappings. Current AMS inventory does not establish what a job used. Missing settings and plate association remain explicitly null. Firmware may restrict reports or send no usable data during the observation window. A real authenticated test determines the next integration step; no printer setting changes have been made.

## Jira attempts

The native issue panel now has add/edit/list forms for project, model revision, plate number/name, material, filament selection, settings/source notes, observations, machine status, and a separate physical test result. It starts empty; sample gear/coupon forms are explicit, labeled, and require Save. Sample provenance cannot be removed through editing. Reprints are separate records; project/revision/plate labels are manually supplied until the live association is verified. The panel is not connected to local printer evidence yet.

`print-run` custom entities use the issue ID from the trusted resolver context. Every operation rechecks Jira access as the user; writes additionally require issue edit permission. Records from other issues are excluded. Pagination returns at most 20 records per page; indexed lists are eventually consistent. Strong reads reopen individual attempts.

Create requests have stable idempotency IDs, so repeating a lost response cannot duplicate the attempt. Revision-conditional transactions prevent concurrent edits from silently overwriting each other. The form preserves its draft on failures/conflicts and offers an explicit reopen action for edits. Cancel deliberately discards a draft; reload/navigation does not persist unsaved form state. No delete operation exists yet.

The app requests `read:jira-work` and `storage:app`. No deployment or installation has occurred. Hosted rendering, actual Jira permission denial, and real Forge storage transactions must be exercised on the development site after Ian authorizes deployment/install. Local tests do not establish those integration results.

## Verification and next work

- `npm run check`: lint, typecheck, 14 application tests, 4 toolchain tests, 8 camera tests, 4 status tests, 6 import tests, and build. TLS tests require loopback-server permission and OpenSSL.
- `npm run audit:all`: checks both app and isolated CLI dependency trees.
- `npm run forge -- lint`: validates manifest/API usage without deployment.
- Real printer: TLS verified without credentials; authenticated status, disconnected-printer experience, and useful job fields remain pending.
- Jira: hosted save/reload, two-editor conflicts, permission revocation, and rendering remain pending development deployment.

Next: inspect an actual sanitized report, establish job/plate identity and exact submitted settings access, then connect per-run evidence to Jira without guessing associations. After that: photo references, comparison, on-demand visual assessment with an approved budget. Periodic photos and automatic AI remain deferred.

Implementation references: [MQTT.js](https://github.com/mqttjs/MQTT.js), [community Bambu report protocol](https://github.com/Doridian/OpenBambuAPI/blob/main/mqtt.md), and [Forge entity transactions](https://developer.atlassian.com/platform/forge/storage-reference/entities-transactions/). Community documentation is not a vendor compatibility guarantee.
