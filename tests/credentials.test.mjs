import test from 'node:test';
import assert from 'node:assert/strict';
import { printerCredential } from '../scripts/keychain/credentials.mjs';
const host = '192.168.1.2';
test('saved credential is reused without a prompt and a changed certificate fails closed', async () => {
  const storage = async () => ({ code: 'test-only', fingerprint: 'pin' });
  const prompt = async () => assert.fail('must not ask again');
  assert.equal(await printerCredential(host, 'pin', prompt, storage), 'test-only');
  await assert.rejects(printerCredential(host, 'other', prompt, storage), /certificate changed/);
});
test('first pairing saves only after explicit local trust and hidden code entry', async () => {
  const writes = [];
  const storage = async (operation, target, value) => { if (operation === 'get') return null; writes.push({ target, value }); };
  const prompt = async (_label, hidden) => hidden ? 'test-only' : 'yes';
  assert.equal(await printerCredential(host, 'pin', prompt, storage), 'test-only');
  assert.deepEqual(writes, [{ target: host, value: { version: 1, fingerprint: 'pin', code: 'test-only' } }]);
});
test('declined trust and invalid unicode codes are never stored', async () => {
  const storage = async operation => { assert.equal(operation, 'get'); return null; };
  await assert.rejects(printerCredential(host, 'pin', async () => 'no', storage), /Canceled/);
  await assert.rejects(printerCredential(host, 'pin', async (_label, hidden) => hidden ? 'non-ascii-\u0435' : 'yes', storage), /Invalid code format/);
});
