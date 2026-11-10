import api, { route, authorize } from '@forge/api';
import Resolver from '@forge/resolver';
import { loadPanelContext } from './backend/panel-context';
import { runService } from './backend/runs';
import { runStore } from './backend/run-store';
import { issuePhotos } from './shared/evidence';

async function photosForIssue(issueId: string) {
  const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueId}?fields=attachment`);
  if (!response.ok) throw new Error('Attachments unavailable');
  return issuePhotos(await response.json(), issueId);
}

const resolver = new Resolver();
const records = runService(runStore, async (context, write) => {
  const panel = await loadPanelContext(context, (id) => api.asUser().requestJira(route`/rest/api/3/issue/${id}?fields=summary`));
  if (panel.status !== 'ready') return null;
  if (write && !await authorize().onJiraIssue(panel.issueId).canEdit()) return null;
  return { issueId: panel.issueId, accountId: (context as { accountId: string }).accountId };
}, async (issueId, ids) => {
  if (!ids.length) return true;
  const photos = await photosForIssue(issueId);
  return ids.every(id => photos.some(photo => photo.id === id));
});
resolver.define('listPhotos', async ({ context }) => {
  try {
    const panel = await loadPanelContext(context, id => api.asUser().requestJira(route`/rest/api/3/issue/${id}?fields=summary`));
    if (panel.status !== 'ready') return { status: 'unavailable' };
    return { status: 'ok', photos: await photosForIssue(panel.issueId) };
  } catch { return { status: 'error' }; }
});
for (const operation of ['list', 'get', 'create', 'update'] as const) {
  resolver.define(`${operation}Runs`, ({ context, payload }) => records(operation, context, payload));
}
resolver.define('getPanelContext', async ({ context }) =>
  loadPanelContext(context, (issueId) =>
    api.asUser().requestJira(route`/rest/api/3/issue/${issueId}?fields=summary`),
  ),
);

export const handler = resolver.getDefinitions();
