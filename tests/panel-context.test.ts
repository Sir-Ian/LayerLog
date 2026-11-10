import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadPanelContext } from '../src/backend/panel-context';

const context = { accountId: 'test-user', extension: { issue: { id: '10001' } } };
const response = (status: number, body: unknown = {}) => ({
  status, ok: status >= 200 && status < 300, json: async () => body,
});

test('uses the resolver issue ID and returns only identity after user access succeeds', async () => {
  const result = await loadPanelContext(context, async (id) => {
    assert.equal(id, '10001');
    return response(200, { id, key: 'GEAR-1', fields: { summary: 'Private summary' } });
  });
  assert.deepEqual(result, { status: 'ready', issueId: '10001', issueKey: 'GEAR-1' });
});

test('rejects missing identity or malformed context without calling Jira', async () => {
  for (const invalid of [null, {}, { extension: context.extension },
    { ...context, extension: { issue: { id: '../other' } } },
    { ...context, extension: { issue: { id: 10001 } } }]) {
    assert.deepEqual(await loadPanelContext(invalid, async () => {
      assert.fail('Jira must not be called');
    }), { status: 'unavailable' });
  }
});

test('does not distinguish denied, missing, and unauthenticated issues', async () => {
  for (const status of [401, 403, 404]) {
    assert.deepEqual(await loadPanelContext(context, async () => response(status)), { status: 'unavailable' });
  }
});

test('fails closed on upstream failure, mismatched issue, and malformed data', async () => {
  for (const upstream of [response(429), response(500), response(200, null),
    response(200, { id: '999', key: 'OTHER-1' }), response(200, { id: '10001' })]) {
    assert.deepEqual(await loadPanelContext(context, async () => upstream), { status: 'error' });
  }
});

test('does not expose exception details', async () => {
  assert.deepEqual(await loadPanelContext(context, async () => {
    throw new Error('Sensitive upstream response');
  }), { status: 'error' });
});
