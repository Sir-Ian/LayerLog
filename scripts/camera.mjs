import { printerCredential, keychain } from './keychain/credentials.mjs';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import { Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, writeFile, lstat, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cameraRequest } from './camera/transport.mjs';
import { validateHost } from './camera/protocol.mjs';

const controller = new globalThis.AbortController();
const stop = () => controller.abort();
process.once('SIGINT', stop);
process.once('SIGTERM', stop);

async function prompt(label, hidden = false) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Run npm run camera in your own interactive terminal. Do not send the access code in chat or arguments.');
  const muted = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const rl = createInterface({ input: process.stdin, output: hidden ? muted : process.stdout, terminal: true });
  rl.on('SIGINT', stop);
  rl.once('close', stop);
  if (hidden) process.stdout.write(label);
  try {
    return (await rl.question(hidden ? '' : label, { signal: controller.signal })).trim();
  } finally {
    rl.removeListener('close', stop);
    rl.close();
    muted.destroy();
    if (hidden) process.stdout.write('\n');
  }
}

async function main() {
  const { values } = parseArgs({ options: { host: { type: 'string' }, firmware: { type: 'string' }, help: { type: 'boolean' }, 'forget-credential': { type: 'boolean' } } });
  if (values.help) {
    process.stdout.write('LayerLog A1 camera proof\nUsage: npm run camera -- [--host PRIVATE_IP] [--firmware VERSION]\nPairs once with macOS Keychain and remembers the certificate. Use --forget-credential to remove pairing. Saves one JPEG and metadata under .tmp/, then exits. No cloud services or printer commands.\n');
    return;
  }
  const host = validateHost(values.host ?? await prompt('A1 local IP address: '));
    if (values['forget-credential']) { await keychain('delete', host); process.stdout.write('Removed the saved LayerLog printer credential.\n'); return; }
  const firmware = values.firmware ?? await prompt('Firmware version shown on the A1 (or unknown): ');
  if (!/^[\w. -]{1,64}$/.test(firmware)) throw new Error('Enter a firmware version or unknown (up to 64 letters, digits, dots, spaces, or hyphens).');
  process.stdout.write('Checking the camera certificate without sending credentials…\n');
  const fingerprint = await cameraRequest({ host, signal: controller.signal });
  process.stdout.write(`Printer certificate SHA-256: ${fingerprint}\nFirst-use trust: this fingerprint alone does not prove device identity. Confirm the IP on your A1 and use a trusted LAN. No printer settings will be changed.\n`);
  const code = await printerCredential(host, fingerprint, prompt);
  const image = await cameraRequest({ host, fingerprint,
    code, signal: controller.signal });
  const receivedAt = new Date().toISOString();
  if (controller.signal.aborted) throw new Error('Capture canceled.');
  const base = resolve('.tmp');
  await mkdir(base, { recursive: true, mode: 0o700 });
  if (!(await lstat(base)).isDirectory() || (await lstat(base)).isSymbolicLink()) throw new Error('The local .tmp path must be a real directory.');
  const directory = await mkdtemp(resolve(base, 'layerlog-camera-'));
  try {
    await writeFile(resolve(directory, 'snapshot.jpg'), image, { flag: 'wx', mode: 0o600 });
    await writeFile(resolve(directory, 'capture.json'), JSON.stringify({
      schemaVersion: 1, source: 'bambu-a1-local-camera', firmwareReportedByUser: firmware,
      receivedAt, sha256: createHash('sha256').update(image).digest('hex'), bytes: Buffer.byteLength(image),
      skippedInitialFrame: true, freshness: 'unverified-no-camera-timestamp',
      visualResult: null, physicalResult: null,
    }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
  process.stdout.write(`Saved ${resolve(directory, 'snapshot.jpg')}\nConnection closed. Open the image to confirm it shows the current scene. No AI assessment was run.\n`);
}

try { await main(); }
catch (error) {
  // Never print raw transport exceptions or CLI argument errors (could contain input).
  const message = controller.signal.aborted ? 'Canceled. Camera connection closed.'
    : error.code ? 'Unable to complete capture. Check arguments, terminal access, and local write permissions; use --help.' : error.message;
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
}
