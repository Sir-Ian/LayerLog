import type { RunDraft, RunRecord } from './runs';
export const comparisonFields = [
  ['project', 'Project'], ['modelRevision', 'Model revision'], ['plateNumber', 'Plate'], ['plateName', 'Plate name'],
  ['material', 'Material'], ['filamentColor', 'Filament selection'], ['layerHeightMm', 'Layer height (mm)'],
  ['nozzleDiameterMm', 'Nozzle (mm)'], ['infillPercent', 'Infill (%)'], ['nozzleTemperatureC', 'Nozzle (°C)'],
  ['bedTemperatureC', 'Bed (°C)'], ['settingsNotes', 'Settings/source notes'], ['machineStatus', 'Machine status'],
  ['physicalResult', 'Physical test'], ['measurements', 'Measurements with units'], ['notes', 'Observations'],
] as const satisfies ReadonlyArray<readonly [keyof RunDraft, string]>;
export function compareRuns(a: RunRecord, b: RunRecord) {
  if (a.issueId !== b.issueId || a.id === b.id) throw new Error('Select two different attempts from the same issue.');
  return comparisonFields.map(([key, label]) => ({ label, before: String(a.body[key] ?? ''), after: String(b.body[key] ?? ''), changed: String(a.body[key] ?? '') !== String(b.body[key] ?? '') }));
}
export function evidenceGaps(body: RunDraft): string[] {
  const gaps = [];
  if (!body.material) gaps.push('Material is unrecorded.');
  if (!body.settingsNotes) gaps.push('Print-time settings source is unrecorded.');
  if (!body.photos?.length) gaps.push('No photo evidence is linked.');
  if (!body.notes) gaps.push('Test observations are unrecorded.');
  if (body.physicalResult === 'not-tested') gaps.push('Physical fit/function has not been tested.');
  if (body.physicalResult === 'pass' && !body.measurements) gaps.push('Pass is user-reported; no measurements with units are recorded.');
  return gaps;
}
