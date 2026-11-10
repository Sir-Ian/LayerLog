# One-time printer pairing on macOS

Camera and status helpers now share a macOS Keychain credential and trusted certificate fingerprint for each private printer IP. The first run asks to trust the device and enter its LAN code at a hidden prompt. Later runs reuse it without repeating either prompt while the certificate matches. No real credential is seeded by development or tests.

```sh
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npm run printer:status -- --host 192.168.50.175
npm run camera -- --host 192.168.50.175 --firmware 01.08.01.00
```

Enter the code once at the helper prompt, never at the normal shell prompt or in chat. macOS may ask permission to access the login Keychain or require unlocking it. This OS authorization is distinct from re-entering the printer code. The first pairing must still be completed by Ian; the previous helpers intentionally did not retain his code.

The Swift bridge uses Apple's Security framework and the service `com.layerlog.printer`. It compiles locally with existing Xcode Command Line Tools into ignored `.tmp/keychain`. Secrets travel through child-process pipes, not command arguments, environment variables, files, or log messages. The main helper consumes retrieval output internally and never prints it. Credentials are local to this Mac's Keychain, not synced into Jira or Git.

A changed certificate fails closed: verify the printer/IP before removing the old pairing and entering the new code. If the code changes or an incorrect one was saved, forget and pair again:

```sh
npm run printer:status -- --host 192.168.50.175 --forget-credential
```

This deletes only LayerLog's entry for that IP; it does not alter Bambu Studio, printer settings, or any other credentials. Both helpers stop when their single operation completes. No background monitor or paid service is introduced.

Validation: credential reuse/no repeat prompts, pin mismatch/no transmission, first-use consent, invalid Unicode rejection, and existing TLS transport tests pass. Swift source typechecking passes on this Mac. Real Keychain pairing/access prompts and successful authenticated MQTT reports still need an actual run; mocked storage tests do not establish these outcomes.

On November 9, the earlier real MQTT test disconnected before completion and saved no status report. Diagnostics now distinguish disconnection before login acceptance, while subscribing, and after subscription acceptance. No cause has yet been established; the existing test output does not prove a firmware restriction or bad access code.
