import process from 'node:process';
import { spawn } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { mkdir, readFile, access, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { validateHost } from '../camera/protocol.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
function child(file, args, input = '') {
  return new Promise((resolveResult, reject) => {
    const command = spawn(file, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    const chunks = []; let size = 0;
    command.stdout.on('data', chunk => { size += chunk.length; if (size > 4096) command.kill(); else chunks.push(chunk); });
    // Never surface native errors: they can include arguments or Keychain details.
    command.stderr.resume(); command.stdin.on('error', () => {});
    command.on('error', () => reject(new Error('Keychain helper could not start. Check Xcode Command Line Tools.')));
    command.on('close', code => resolveResult({ code, output: Buffer.concat(chunks).toString('utf8') }));
    command.stdin.end(input);
  });
}
async function executable() {
  if (process.platform !== 'darwin') throw new Error('Saved printer credentials require macOS Keychain.');
  const source = resolve(root, 'scripts/keychain/PrinterCredential.swift');
  const hash = createHash('sha256').update(await readFile(source)).digest('hex').slice(0, 16);
  const directory = resolve(root, '.tmp/keychain');
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if ((await lstat(directory)).isSymbolicLink()) throw new Error('Keychain helper directory must not be a symlink.');
  const binary = resolve(directory, `printer-credential-${hash}`);
  try { await access(binary); } catch {
    const result = await child('/usr/bin/xcrun', ['swiftc', source, '-o', binary]);
    if (result.code !== 0) throw new Error('Could not build the Keychain helper. Install Xcode Command Line Tools.');
  }
  return binary;
}
export async function keychain(operation, host, value) {
  validateHost(host);
  const result = await child(await executable(), [operation, host], value === undefined ? '' : JSON.stringify(value));
  if (operation === 'get' && result.code === 3) return null;
  if (result.code !== 0) throw new Error('macOS Keychain denied or failed this operation. Unlock your login Keychain and retry.');
  if (operation !== 'get') return;
  try { return JSON.parse(result.output); } catch { throw new Error('Saved printer credential is invalid. Use --forget-credential, then pair again.'); }
}
export async function printerCredential(host, fingerprint, prompt, storage = keychain) {
  const saved = await storage('get', host);
  if (saved) {
    if (saved.fingerprint !== fingerprint) throw new Error('Printer certificate changed. Saved code was not sent. Verify the device before using --forget-credential to pair again.');
    if (typeof saved.code !== 'string' || !/^[\x21-\x7e]{1,32}$/.test(saved.code)) throw new Error('Saved code has invalid format. Use --forget-credential to pair again.');
    return saved.code;
  }
  if (await prompt('Confirm this printer IP and certificate on your trusted LAN. Type yes to pair and remember securely: ') !== 'yes') throw new Error('Canceled before authentication.');
  const code = await prompt('Printer LAN access code (hidden; saved only in macOS Keychain): ', true);
  if (!/^[\x21-\x7e]{1,32}$/.test(code)) throw new Error('Invalid code format. Type the code directly using English letters/numbers at the hidden prompt; do not paste it at a shell prompt.');
  await storage('set', host, { version: 1, fingerprint, code });
  return code;
}
