import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeProject, type PrintAttempt } from '../src/shared/print-project';

const plates = [1, 2].map((number) => ({ plateId: `rev:${number}`, plateNumber: number, name: `Plate ${number}` }));
function attempt(plate: number, status: PrintAttempt['status'], day = 1): PrintAttempt {
  return { attemptId: `${plate}-${day}`, revisionId: 'rev', plateId: `rev:${plate}`, status,
    source: 'manual', physicalResult: 'not-tested', observedAt: `2026-11-0${day}T12:00:00Z` };
}

test('imported plates have unknown progress until observed attempts exist', () => {
  const result = summarizeProject('rev', plates, []);
  assert.equal(result.completedPlates, 0);
  assert.deepEqual(result.unknownPlateIds, ['rev:1', 'rev:2']);
  assert.equal(result.allPlatesReportedComplete, false);
});
test('plate one completed and plate two printing is not a completed project', () => {
  const result = summarizeProject('rev', plates, [attempt(1, 'completed'), attempt(2, 'printing')]);
  assert.equal(result.completedPlates, 1);
  assert.deepEqual(result.activePlateIds, ['rev:2']);
  assert.equal(result.allPlatesReportedComplete, false);
});
test('failed plate reprints preserve prior attempts while latest status drives progress', () => {
  const attempts = [attempt(1, 'completed'), attempt(2, 'failed'), attempt(2, 'printing', 2)];
  const result = summarizeProject('rev', plates, attempts);
  assert.equal(attempts.length, 3);
  assert.deepEqual(result.needsAttentionPlateIds, []);
  assert.deepEqual(result.activePlateIds, ['rev:2']);
});
test('machine completion does not change physical test results', () => {
  const attempts = [attempt(1, 'completed'), attempt(2, 'completed')];
  assert.equal(summarizeProject('rev', plates, attempts).allPlatesReportedComplete, true);
  assert.ok(attempts.every((a) => a.physicalResult === 'not-tested'));
  assert.equal(summarizeProject('rev', [], []).allPlatesReportedComplete, false);
});
test('rejects cross-project, unknown-plate, duplicate, or ambiguous attempts', () => {
  assert.throws(() => summarizeProject('other', plates, [attempt(1, 'completed')]));
  assert.throws(() => summarizeProject('rev', plates, [attempt(3, 'completed')]));
  assert.throws(() => summarizeProject('rev', plates, [attempt(1, 'completed'), attempt(1, 'completed')]));
  assert.throws(() => summarizeProject('rev', plates, [attempt(1, 'completed'), { ...attempt(1, 'failed'), attemptId: 'different' }]));
});
