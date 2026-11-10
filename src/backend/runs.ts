import { createHash } from 'node:crypto';
import { validateDraft, type RunRecord, type RunsReply } from '../shared/runs';

export interface RunStore {
  get(id: string): Promise<RunRecord | undefined>;
  create(record: RunRecord): Promise<void>;
  compareAndSet(record: RunRecord, expected: number): Promise<void>;
  list(issueId: string, cursor?: string): Promise<{ records: RunRecord[]; cursor?: string }>;
}
export type AccessCheck = (context: unknown, write: boolean) => Promise<{ issueId: string; accountId: string } | null>;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const object = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function runService(store: RunStore, access: AccessCheck, checkPhotos: (issueId: string, ids: string[]) => Promise<boolean> = async (_issueId, ids) => ids.length === 0) {
  return async (operation: 'list' | 'get' | 'create' | 'update', context: unknown, input: unknown): Promise<RunsReply> => {
    try {
      const identity = await access(context, operation === 'create' || operation === 'update');
      if (!identity) return { status: 'unavailable' };
      const data = object(input);
      if (operation === 'list') {
        if (data.cursor !== undefined && (typeof data.cursor !== 'string' || data.cursor.length > 4096)) return { status: 'invalid', message: 'Invalid page cursor.' };
        const page = await store.list(identity.issueId, data.cursor as string | undefined);
        // The server partition is authoritative even if a forged cursor is supplied.
        return { status: 'ok', records: page.records.filter((run) => run.issueId === identity.issueId), cursor: page.cursor };
      }
      if (operation === 'get') {
        if (typeof data.id !== 'string' || !/^run-[a-f0-9]{64}$/.test(data.id)) return { status: 'unavailable' };
        const saved = await store.get(data.id);
        return saved?.issueId === identity.issueId ? { status: 'ok', records: [saved] } : { status: 'unavailable' };
      }
      let body;
      try { body = validateDraft(data.body); } catch (error) { return { status: 'invalid', message: (error as Error).message }; }
      if (!await checkPhotos(identity.issueId, (body.photos ?? []).map(photo => photo.attachmentId))) return { status: 'invalid', message: 'A selected photo is unavailable on this issue. Refresh photos and remove unavailable references before saving.' };
      const now = new Date().toISOString();
      if (operation === 'create') {
        if (typeof data.requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(data.requestId)) return { status: 'invalid', message: 'A save request ID is required.' };
        const id = `run-${hash(`${identity.issueId}:${identity.accountId}:${data.requestId}`)}`;
        const creationHash = hash(JSON.stringify(body));
        const record: RunRecord = { id, issueId: identity.issueId, revision: 1, createdAt: now, updatedAt: now, creationHash, body };
        try { await store.create(record); return { status: 'ok', records: [record] }; }
        catch {
          const existing = await store.get(id);
          if (!existing) return { status: 'error' };
          return existing.issueId === identity.issueId && existing.creationHash === creationHash
            ? { status: 'ok', records: [existing] } : { status: 'conflict' };
        }
      }
      if (typeof data.id !== 'string' || !/^run-[a-f0-9]{64}$/.test(data.id)) return { status: 'unavailable' };
      if (!Number.isInteger(data.expectedRevision) || Number(data.expectedRevision) < 1) return { status: 'invalid', message: 'Reopen this attempt before editing.' };
      const current = await store.get(data.id);
      if (!current || current.issueId !== identity.issueId) return { status: 'unavailable' };
      if (current.revision !== data.expectedRevision) return { status: 'conflict' };
      if (current.body.sample !== body.sample) return { status: 'invalid', message: 'Sample provenance cannot be changed.' };
      const updated = { ...current, body, updatedAt: now, revision: current.revision + 1 };
      try { await store.compareAndSet(updated, current.revision); return { status: 'ok', records: [updated] }; }
      catch {
        const latest = await store.get(data.id);
        return { status: latest && latest.revision !== current.revision ? 'conflict' : 'error' };
      }
    } catch { return { status: 'error' }; }
  };
}
