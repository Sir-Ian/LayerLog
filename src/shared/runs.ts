export const MACHINE_STATES = ['unknown', 'queued', 'preparing', 'printing', 'paused', 'completed', 'failed', 'canceled'] as const;
export const PHYSICAL_RESULTS = ['not-tested', 'pass', 'fail', 'inconclusive'] as const;
export interface RunDraft {
  project: string;
  modelRevision: string;
  plateNumber: number;
  plateName: string;
  material: string;
  filamentColor: string;
  settingsNotes: string;
  notes: string;
  machineStatus: typeof MACHINE_STATES[number];
  physicalResult: typeof PHYSICAL_RESULTS[number];
  sample: boolean;
}
export interface RunRecord {
  id: string;
  issueId: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  creationHash: string;
  body: RunDraft;
}
export type RunsReply =
  | { status: 'ok'; records: RunRecord[]; cursor?: string }
  | { status: 'invalid'; message: string }
  | { status: 'unavailable' | 'conflict' | 'error' };

export function validateDraft(value: unknown): RunDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Enter a print attempt.');
  const data = value as Record<string, unknown>;
  const text = (key: string, maximum: number, required = false) => {
    if (typeof data[key] !== 'string' || data[key].length > maximum) throw new Error(`${key} must contain at most ${maximum} characters.`);
    const result = data[key].trim();
    if (required && !result) throw new Error(`${key} is required.`);
    return result;
  };
  if (!Number.isInteger(data.plateNumber) || Number(data.plateNumber) < 1 || Number(data.plateNumber) > 999) throw new Error('Plate number must be between 1 and 999.');
  if (!MACHINE_STATES.includes(data.machineStatus as RunDraft['machineStatus']) || !PHYSICAL_RESULTS.includes(data.physicalResult as RunDraft['physicalResult'])) throw new Error('Choose a valid machine status and physical result.');
  if (typeof data.sample !== 'boolean') throw new Error('Sample provenance is required.');
  return {
    project: text('project', 160, true), modelRevision: text('modelRevision', 160, true),
    plateNumber: data.plateNumber as number, plateName: text('plateName', 160),
    material: text('material', 160), filamentColor: text('filamentColor', 160),
    settingsNotes: text('settingsNotes', 4000), notes: text('notes', 4000),
    machineStatus: data.machineStatus as RunDraft['machineStatus'], physicalResult: data.physicalResult as RunDraft['physicalResult'], sample: data.sample,
  };
}
export const emptyDraft = (): RunDraft => ({ project: '', modelRevision: '', plateNumber: 1, plateName: '', material: '', filamentColor: '', settingsNotes: '', notes: '', machineStatus: 'unknown', physicalResult: 'not-tested', sample: false });
