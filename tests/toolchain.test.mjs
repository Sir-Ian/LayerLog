import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { dirname, join } from 'node:path';
import { URL } from 'node:url';

const requireTool = createRequire(new URL('../tools/forge/package.json', import.meta.url));

test('Forge package validator uses patched glob for matches and missing paths', async () => {
  const { PackageValidator } = requireTool(join(dirname(requireTool.resolve('@forge/manifest')), 'validators/package-validator.js'));
  const validator = new PackageValidator();
  assert.equal(await validator.fileExistsForGlob('src/**/*.tsx'), true);
  assert.equal(await validator.fileExistsForGlob('src/missing-example/**/*.tsx'), false);
  const invalid = await validator.validate({
    typedContent: { app: { package: { extraFiles: ['src/missing-example/**/*.tsx'] } } },
  });
  assert.equal(invalid.success, false);
});

test('patched diff supports the patch and JSON operations used by Forge', () => {
  const diff = requireTool('diff');
  const before = 'title: LayerLog\n';
  const after = 'title: LayerLog development\n';
  const patch = diff.createTwoFilesPatch('before', 'after', before, after);
  assert.equal(diff.applyPatch(before, patch), after);
  assert.ok(diff.diffJson({ read: false }, { read: true }).some((part) => part.added));
});

test('SockJS can load its patched UUID CommonJS API', () => {
  const sockjsRequire = createRequire(requireTool.resolve('sockjs'));
  const { v4, validate } = sockjsRequire('uuid');
  const first = v4();
  assert.equal(validate(first), true);
  assert.notEqual(first, v4());
  assert.equal(typeof requireTool('sockjs').createServer, 'function');
});

test('external editor can use patched temporary-file create and cleanup API', () => {
  const editorRequire = createRequire(requireTool.resolve('@inquirer/external-editor'));
  const tmp = editorRequire('tmp');
  const temporary = tmp.fileSync({ prefix: 'layerlog-toolchain-' });
  assert.equal(typeof temporary.name, 'string');
  temporary.removeCallback();
});
