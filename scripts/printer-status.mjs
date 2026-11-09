import process from 'node:process';
import { parseArgs } from 'node:util';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Writable } from 'node:stream';
import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import { probeCertificate, observeStatus } from './printer/status.mjs';
import { validateHost } from './camera/protocol.mjs';

const controller = new globalThis.AbortController();
const stop = () => controller.abort();
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
async function prompt(label, hidden = false) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Run this helper in your own interactive Terminal.');
  const muted = new Writable({ write(_data, _encoding, done) { done(); } });
  const rl = createInterface({ input: process.stdin, output: hidden ? muted : process.stdout, terminal: true });
  rl.on('SIGINT', stop); rl.once('close', stop);
  if (hidden) process.stdout.write(label);
  try { return (await rl.question(hidden ? '' : label, { signal: controller.signal })).trim(); }
  finally { rl.removeListener('close', stop); rl.close(); muted.destroy(); if (hidden) process.stdout.write('\n'); }
}
try {
  const { values } = parseArgs({ options: { host: { type: 'string' }, help: { type: 'boolean' } } });
  if (values.help) {
    process.stdout.write('Usage: npm run printer:status -- [--host PRIVATE_IP]\nObserve report messages for 30 seconds, save sanitized evidence locally, and exit. Hidden LAN-code prompt; no printer commands, cloud calls, or automatic retries.\n');
  } else {
    const host = validateHost(values.host ?? await prompt('A1 local IP address: '));
    const certificate = await probeCertificate(host, controller.signal);
    process.stdout.write(`Printer status certificate SHA-256: ${certificate.fingerprint}\nConfirm this IP on your printer and use a trusted LAN. First-use certificate trust does not independently verify device identity.\n`);
    if (await prompt('Trust this device for this session? Type yes: ') !== 'yes') throw new Error('Canceled before authentication.');
    const code = await prompt('LAN access code (hidden, never saved): ', true);
    if (!/^[\x21-\x7e]{1,32}$/.test(code)) throw new Error('Invalid LAN code format.');
    process.stdout.write('Listening for read-only printer reports for 30 seconds…\n');
    const startedAt = new Date().toISOString();
    const events = await observeStatus({ host, code, certificate, signal: controller.signal });
    const base = resolve('.tmp');
    await mkdir(base, { recursive: true, mode: 0o700 });
    const directory = await mkdtemp(resolve(base, 'layerlog-status-'));
    const file = resolve(directory, 'status.json');
    await writeFile(file, JSON.stringify({ schemaVersion: 1, source: 'bambu-lan-report', sessionId: randomUUID(),
      startedAt, endedAt: new Date().toISOString(), coverage: 'partial-session', events,
      submittedSettings: null, verifiedPlateAssociation: null,
      warnings: ['Report fields are partial observations, not a complete submitted-job settings snapshot.',
        'AMS inventory and current tray do not prove the selected job mapping.', 'Machine completion is not physical validation.'],
    }, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    process.stdout.write(`Saved ${events.length} report observations to ${file}\nDisconnected. No background helper remains.\n`);
  }
} catch (error) {
  process.stderr.write(controller.signal.aborted ? 'Canceled. Disconnected.\n'
    : `${error.code ? 'Could not complete status capture. Check arguments, network access, and local write permissions.' : error.message}\n`);
  process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', stop); process.removeListener('SIGTERM', stop);
}
