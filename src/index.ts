import api, { route } from '@forge/api';
import Resolver from '@forge/resolver';
import { loadPanelContext } from './backend/panel-context';

const resolver = new Resolver();
resolver.define('getPanelContext', async ({ context }) =>
  loadPanelContext(context, (issueId) =>
    api.asUser().requestJira(route`/rest/api/3/issue/${issueId}?fields=summary`),
  ),
);

export const handler = resolver.getDefinitions();
