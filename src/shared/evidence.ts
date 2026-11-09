export interface PhotoReference { attachmentId: string; capturedAt: string; source: string; caption: string }
export interface IssuePhoto { id: string; filename: string; created: string }
export type PhotosReply = { status: 'ok'; photos: IssuePhoto[] } | { status: 'unavailable' | 'error' };
export function validatePhotos(value: unknown): PhotoReference[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 12) throw new Error('Select at most 12 photo references.');
  const ids = new Set<string>();
  return value.map(item => {
    if (!item || typeof item !== 'object' || typeof item.attachmentId !== 'string' || !/^\d+$/.test(item.attachmentId) || ids.has(item.attachmentId)) throw new Error('Photo IDs must be unique Jira attachment IDs.');
    ids.add(item.attachmentId);
    for (const key of ['capturedAt', 'source', 'caption']) if (typeof item[key] !== 'string' || item[key].length > (key === 'caption' ? 1000 : 160)) throw new Error('Invalid photo metadata.');
    if (item.capturedAt && (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(item.capturedAt) || !Number.isFinite(Date.parse(item.capturedAt)))) throw new Error('Capture time must be an ISO UTC timestamp or blank if unknown.');
    if (!item.source.trim()) throw new Error('Record the photo source, or explicitly state unknown.');
    return { attachmentId: item.attachmentId, capturedAt: item.capturedAt, source: item.source.trim(), caption: item.caption.trim() };
  });
}
export function issuePhotos(value: unknown, expectedIssueId: string): IssuePhoto[] {
  const data = value as { id?: unknown; fields?: { attachment?: unknown } };
  if (data?.id !== expectedIssueId || !Array.isArray(data.fields?.attachment)) throw new Error('Invalid issue attachment response.');
  return data.fields.attachment.filter(item => item && typeof item.id === 'string' && /^\d+$/.test(item.id) && ['image/jpeg', 'image/png', 'image/webp'].includes(item.mimeType) && typeof item.filename === 'string' && typeof item.created === 'string')
    .map(item => ({ id: item.id, filename: item.filename.slice(0, 255), created: item.created }));
}
