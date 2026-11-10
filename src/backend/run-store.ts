import { kvs, Filter, FilterConditions, Sort } from '@forge/kvs';
import type { RunStore } from './runs';
import type { RunRecord } from '../shared/runs';

const entity = kvs.entity<RunRecord>('print-run');
export const runStore: RunStore = {
  get: (key) => entity.get(key),
  create: (record) => entity.set(record.id, record, { keyPolicy: 'FAIL_IF_EXISTS' }),
  compareAndSet: (record, expected) => kvs.transact().set(record.id, record, {
    entityName: 'print-run', conditions: new Filter<RunRecord>().and('revision', FilterConditions.equalTo(expected)),
  }).execute(),
  async list(issueId, cursor) {
    const query = entity.query().index('by-issue-created', { partition: [issueId] }).sort(Sort.DESC).limit(20);
    if (cursor) query.cursor(cursor);
    const result = await query.getMany();
    return { records: result.results.map((item) => item.value), cursor: result.nextCursor };
  },
};
