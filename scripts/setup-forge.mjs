import console from 'node:console';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'tools/forge');
const vendor = JSON.parse(readFileSync(join(target, 'vendor.json'), 'utf8'));
const temporary = mkdtempSync(join(tmpdir(), 'layerlog-forge-'));
try {
  const metadata = JSON.parse(execFileSync('npm', [
    'pack', `${vendor.package}@${vendor.version}`, '--json', '--ignore-scripts', '--pack-destination', temporary,
  ], { encoding: 'utf8', cwd: root }))[0];
  const archive = join(temporary, metadata.filename);
  const actual = `sha512-${createHash('sha512').update(readFileSync(archive)).digest('base64')}`;
  if (actual !== vendor.integrity) throw new Error('Forge vendor archive integrity mismatch');
  const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split('\n');
  if (entries.some((entry) => !entry.startsWith('package/') || entry.split('/').includes('..'))) {
    throw new Error('Unexpected vendor archive paths');
  }
  execFileSync('tar', ['-xzf', archive, '-C', temporary]);
  // Keep upstream executable code and license unchanged. Our manifest/lockfile
  // resolve its dependencies instead of the vulnerable vendor shrinkwrap.
  for (const name of ['out', 'LICENSE.txt']) {
    const source = join(temporary, 'package', name);
    if (!existsSync(source)) throw new Error(`Vendor archive is missing ${name}`);
    if (name === 'out') rmSync(join(target, name), { recursive: true, force: true });
    cpSync(source, join(target, name), { recursive: true });
  }
  execFileSync('npm', ['ci', '--no-fund'], { cwd: target, stdio: 'inherit' });
  console.log(`Prepared verified Forge CLI ${vendor.version} with LayerLog's reviewed dependency lock.`);
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
