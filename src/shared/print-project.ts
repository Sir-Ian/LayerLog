export type PrintStatus = 'unknown' | 'queued' | 'preparing' | 'printing' | 'paused' | 'completed' | 'failed' | 'canceled';
export type PhysicalResult = 'not-tested' | 'pass' | 'fail' | 'inconclusive';

export interface PlateReference {
  plateId: string;
  plateNumber: number;
  name: string;
}

export interface PrintAttempt {
  attemptId: string;
  revisionId: string;
  plateId: string;
  status: PrintStatus;
  physicalResult: PhysicalResult;
  source: 'bambu-history' | 'bambu-live' | 'manual';
  observedAt: string;
  sourceJobId?: string;
}

export interface ProjectProgress {
  totalPlates: number;
  completedPlates: number;
  activePlateIds: string[];
  needsAttentionPlateIds: string[];
  unknownPlateIds: string[];
  allPlatesReportedComplete: boolean;
}

/** Summarize latest observed attempt per plate; never infer attempts from files.
 * The caller must explicitly resolve a source job to this revision and plate.
 * Physical test results are intentionally not inferred from machine completion.
 */
export function summarizeProject(revisionId: string, plates: PlateReference[], attempts: PrintAttempt[]): ProjectProgress {
  const ids = new Set(plates.map((plate) => plate.plateId));
  if (ids.size !== plates.length) throw new Error('Duplicate plate identity');
  const latest = new Map<string, PrintAttempt>();
  const attemptIds = new Set<string>();
  for (const attempt of attempts) {
    if (attempt.revisionId !== revisionId || !ids.has(attempt.plateId)) {
      throw new Error('Attempt belongs to a different project revision or plate');
    }
    if (attemptIds.has(attempt.attemptId)) throw new Error('Duplicate attempt identity');
    attemptIds.add(attempt.attemptId);
    if (!Number.isFinite(Date.parse(attempt.observedAt))) throw new Error('Invalid observation time');
    const previous = latest.get(attempt.plateId);
    if (previous && Date.parse(previous.observedAt) === Date.parse(attempt.observedAt)) {
      throw new Error('Ambiguous latest attempt; resolve the source job order');
    }
    if (!previous || Date.parse(attempt.observedAt) > Date.parse(previous.observedAt)) latest.set(attempt.plateId, attempt);
  }
  const result: ProjectProgress = {
    totalPlates: plates.length, completedPlates: 0, activePlateIds: [],
    needsAttentionPlateIds: [], unknownPlateIds: [], allPlatesReportedComplete: false,
  };
  for (const plate of plates) {
    const status = latest.get(plate.plateId)?.status ?? 'unknown';
    if (status === 'completed') result.completedPlates++;
    else if (['queued', 'preparing', 'printing', 'paused'].includes(status)) result.activePlateIds.push(plate.plateId);
    else if (['failed', 'canceled'].includes(status)) result.needsAttentionPlateIds.push(plate.plateId);
    else result.unknownPlateIds.push(plate.plateId);
  }
  result.allPlatesReportedComplete = plates.length > 0 && result.completedPlates === plates.length;
  return result;
}
