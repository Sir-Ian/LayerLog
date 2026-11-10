import process from 'node:process';
import console from 'node:console';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const cli = resolve(dirname(fileURLToPath(import.meta.url)), '../tools/forge/out/bin/cli.js');
if (!existsSync(cli)) {
  console.error('Run npm run setup:forge first.');
  process.exit(1);
}
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
