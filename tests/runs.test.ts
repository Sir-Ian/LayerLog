import assert from 'node:assert/strict';
import test from 'node:test';
import { runService, type RunStore } from '../src/backend/runs';
import { emptyDraft, type RunRecord } from '../src/shared/runs';

const body = { ...emptyDraft(), project: 'Test gear', modelRevision: 'A' };
const requestId = 'test-request-000001';
function fixture() {
  const rows = new Map<string, RunRecord>();
  const store: RunStore = {
    async get(id) { return rows.get(id); },
    async create(record) { if (rows.has(record.id)) throw new Error('exists'); rows.set(record.id, record); },
    async compareAndSet(record, expected) { if (rows.get(record.id)?.revision !== expected) throw new Error('conflict'); rows.set(record.id, record); },
    async list() { return { records: [...rows.values()], cursor: 'next' }; },
  };
  return { rows, store, service: runService(store, async () => ({ issueId: '123', accountId: 'user' })) };
}
test('duplicate creates are idempotent and changed retries cannot overwrite', async () => {
  const { rows, service } = fixture();
  const first = await service('create', {}, { requestId, body });
  assert.equal(first.status, 'ok');
  assert.deepEqual(await service('create', {}, { requestId, body }), first);
  assert.equal((await service('create', {}, { requestId, body: { ...body, notes: 'changed' } })).status, 'conflict');
  assert.equal(rows.size, 1);
});
test('denied access never reads storage and cross-issue records never escape', async () => {
  const { store, service } = fixture();
  const denied = runService(new Proxy(store, { get() { assert.fail('storage accessed'); } }), async () => null);
  for (const op of ['get', 'list', 'create', 'update'] as const) assert.equal((await denied(op, {}, {})).status, 'unavailable');
  const first = await service('create', {}, { requestId, body });
  assert.equal(first.status, 'ok'); if (first.status !== 'ok') return;
  const other = runService(store, async () => ({ issueId: '999', accountId: 'user' }));
  assert.equal((await other('get', {}, { id: first.records[0].id })).status, 'unavailable');
  assert.deepEqual(await other('list', {}, {}), { status: 'ok', records: [], cursor: 'next' });
  assert.equal((await other('update', {}, { id: first.records[0].id, expectedRevision: 1, body })).status, 'unavailable');
});
test('concurrent updates have one winner and preserve sample provenance', async () => {
  const { service } = fixture();
  const first = await service('create', {}, { requestId, body });
  if (first.status !== 'ok') return assert.fail();
  const id = first.records[0].id;
  assert.equal((await service('update', {}, { id, expectedRevision: 1, body: { ...body, sample: true } })).status, 'invalid');
  const results = await Promise.all(['one', 'two'].map(notes => service('update', {}, { id, expectedRevision: 1, body: { ...body, notes } })));
  assert.deepEqual(results.map(r => r.status).sort(), ['conflict', 'ok']);
  assert.equal((await service('update', {}, { id, expectedRevision: 1, body })).status, 'conflict');
});
test('invalid fields and failed storage return safe failures', async () => {
  const { service, store } = fixture();
  for (const patch of [{ plateNumber: 0 }, { project: '' }, { machineStatus: 'pass' }, { notes: 'x'.repeat(4001) }]) {
    assert.equal((await service('create', {}, { requestId, body: { ...body, ...patch } })).status, 'invalid');
  }
  store.create = async () => { throw new Error('private upstream information'); };
  assert.deepEqual(await service('create', {}, { requestId, body }), { status: 'error' });
});
