import api, { route, authorize } from '@forge/api';
import Resolver from '@forge/resolver';
import { loadPanelContext } from './backend/panel-context';
import { runService } from './backend/runs';
import { runStore } from './backend/run-store';

const resolver = new Resolver();
const records = runService(runStore, async (context, write) => {
  const panel = await loadPanelContext(context, (id) => api.asUser().requestJira(route`/rest/api/3/issue/${id}?fields=summary`));
  if (panel.status !== 'ready') return null;
  if (write && !await authorize().onJiraIssue(panel.issueId).canEdit()) return null;
  return { issueId: panel.issueId, accountId: (context as { accountId: string }).accountId };
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
