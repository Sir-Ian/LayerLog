import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyDraft, validateDraft, type RunRecord } from '../src/shared/runs';
import { validatePhotos, issuePhotos } from '../src/shared/evidence';
import { compareRuns, evidenceGaps } from '../src/shared/comparison';
const body = { ...emptyDraft(), project: 'Gear', modelRevision: 'A' };
test('settings preserve unknown versus zero and validate numeric limits', () => {
  assert.equal(validateDraft({ ...body, infillPercent: '0' }).infillPercent, '0');
  assert.equal(validateDraft(body).infillPercent, '');
  assert.equal(validateDraft({ ...body, layerHeightMm: '0.20' }).layerHeightMm, '0.2');
  for (const patch of [{ infillPercent: '101' }, { layerHeightMm: '0' }, { nozzleTemperatureC: 'Infinity' }, { bedTemperatureC: '-1' }, { nozzleDiameterMm: 'oops' }]) assert.throws(() => validateDraft({ ...body, ...patch }));
});
test('photo references reject malformed IDs, duplicate images, and invalid capture metadata', () => {
  const photo = { attachmentId: '123', capturedAt: '', source: 'unknown', caption: '' };
  assert.deepEqual(validatePhotos([photo]), [photo]);
  assert.throws(() => validatePhotos([photo, photo]));
  assert.throws(() => validatePhotos([{ ...photo, attachmentId: 123 }]));
  assert.throws(() => validatePhotos([{ ...photo, capturedAt: 'yesterday' }]));
  assert.throws(() => validatePhotos([{ ...photo, source: '' }]));
});
test('only supported images on the exact issue are exposed; metadata does not include raw download URLs', () => {
  const payload = { id: '1', fields: { attachment: [
    { id: '2', mimeType: 'image/jpeg', filename: 'photo.jpg', created: '2026-11-09', content: 'private-url' },
    { id: '3', mimeType: 'application/pdf', filename: 'file.pdf', created: '2026-11-09' },
  ] } };
  assert.deepEqual(issuePhotos(payload, '1'), [{ id: '2', filename: 'photo.jpg', created: '2026-11-09' }]);
  assert.throws(() => issuePhotos(payload, 'other'));
});
test('comparison separates unknown and zero, rejects cross-issue data, and never declares success', () => {
  const a: RunRecord = { id: 'a', issueId: '1', revision: 1, createdAt: '', updatedAt: '', creationHash: '', body };
  const b = { ...a, id: 'b', body: { ...body, infillPercent: '0', physicalResult: 'pass' as const } };
  assert.equal(compareRuns(a, b).find(row => row.label === 'Infill (%)')?.changed, true);
  assert.throws(() => compareRuns(a, { ...b, issueId: '2' }));
  assert.throws(() => compareRuns(a, a));
  assert.ok(evidenceGaps(b.body).some(text => text.includes('user-reported')));
  assert.ok(evidenceGaps(body).some(text => text.includes('not been tested')));
});
