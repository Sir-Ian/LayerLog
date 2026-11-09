# A1 camera capture proof

The helper passes local tests, including a simulated TLS camera. **Ian's A1 has not been connected or photographed yet.** Firmware compatibility and image quality remain unverified; this milestone is not complete.

## Run on your Mac

Use the existing Node 22 installation; no new runtime dependency is needed. Connect the Mac and A1 to the same trusted network, then run in Terminal:

```sh
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
cd /Users/iandeuberry/Projects/LayerLog
npm run camera
```

1. Enter the printer's local IP and firmware from its settings. Only private IPv4 addresses are accepted; no network scanning or cloud relay.
2. The helper probes camera port 6000 without credentials and displays its certificate fingerprint. Confirm the address on your A1 and type `yes` on a trusted LAN. This is first-use trust, not independently verified device identity; it lasts for this invocation only.
3. Enter the LAN access code at the **hidden local prompt**. It is sent only if the second TLS connection presents the same certificate. It is never saved or printed. Do not send it through chat or command arguments.
4. The helper skips the first buffered frame, saves the following complete JPEG, disconnects, and exits. Connections have a 20-second deadline and no automatic retries. Ctrl-C cancels; no daemon remains running.
5. Open the printed `snapshot.jpg` path in Preview and confirm the current scene is visible.

Captures use private directories/files under Git-ignored `.tmp/layerlog-camera-*`. Preserve useful evidence before clearing `.tmp`. `capture.json` records source, receipt time, image hash, and user-reported firmware; it contains no code or IP. Receipt time does not prove freshness because the stream supplies no trustworthy capture timestamp. Nothing is uploaded or assessed by AI.

Optional nonsecret arguments: `npm run camera -- --host PRIVATE_IP --firmware VERSION`. Use `npm run camera -- --help` for offline help.

## Troubleshooting and settings

- Unreachable/timeout: check power, IP, same-network access, VPN routing, and macOS Local Network permission for Terminal/Node if prompted.
- Refused/disconnected: close other live viewers and check the LAN code and firmware's camera options. The stream does not reliably distinguish bad credentials from unavailable camera access.
- Certificate changed: no credentials are sent. Verify the device before retrying.
- Invalid/truncated frame: no snapshot is saved. The parser checks frame size and JPEG boundary markers; Preview must still confirm decoding and quality.

Do not change LAN-only mode, Developer Mode, firmware, or router settings merely to try this helper. Test the existing configuration first. Explain any necessary setting changes to Ian before making them. Never expose the camera port to the internet.

## Hardware acceptance

All hardware checks are **unrun**, awaiting Ian's IP/firmware and local credential entry:

- Capture twice; both files open and show the current gear/bed scene.
- With the printer idle, change a harmless visible object and confirm a subsequent image reflects it. Never reach into a moving printer.
- Ian judges whether gear teeth, fine stringing, and obvious failure are discernible using available examples; do not manufacture failed prints for testing.
- Verify understandable failures and recovery after cancellation/disconnection.
- Verify the command returns and no helper/connection remains.

Poor image detail must be recorded as a limitation, not a successful visual assessment.

## Implementation and verification

The entry point is `scripts/camera.mjs`; protocol/transport code is under `scripts/camera/`. It makes two outbound TLS connections only: certificate probe and authenticated capture. No printer commands, MQTT, FTP, cloud API, or background monitoring.

`npm run test:camera` runs seven protocol/transport tests and one real loopback TLS test. The TLS test requires `openssl` and temporary loopback-listener permission; generated test keys are deleted. Fixtures are synthetic framing bytes, not photographic evidence. `npm run check` includes camera checks.

Sources reviewed November 8, 2026: [Bambu's integration policy](https://blog.bambulab.com/updates-and-third-party-integration-with-bambu-connect/) and [OpenBambuAPI's community protocol research](https://github.com/Doridian/OpenBambuAPI/blob/main/video.md). This is an experimental protocol implementation, not a vendor-supported API or proof of compatibility with Ian's firmware.

Verification on November 8, 2026: `npm run check` passed lint, typecheck, 5 app tests, 4 toolchain tests, 8 camera tests, and build. The first sandboxed attempt blocked the loopback listener with EPERM; the authorized rerun passed. CLI `--help` and interactive Ctrl-C cancellation passed. `git diff --check` and all 19 relative links in changed documentation passed. No physical printer, image-quality, OpenAI, or hosted Jira test ran.

After hardware verification: persistent Jira attempts, attached photo evidence, then on-demand OpenAI visual pass/fail/unclear results separate from physical testing. Live API use requires secure credentials and an agreed spending ceiling. Development deployment remains separately authorized.
