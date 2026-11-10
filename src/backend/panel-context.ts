import type { PanelContext } from '../shared/panel';

interface JiraResponse {
  status: number;
  ok: boolean;
  json(): Promise<unknown>;
}

type ReadIssue = (issueId: string) => Promise<JiraResponse>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Only the resolver context supplies the issue ID. No client payload is accepted.
export async function loadPanelContext(
  context: unknown,
  readIssueAsUser: ReadIssue,
): Promise<PanelContext> {
  if (!isRecord(context) || typeof context.accountId !== 'string' || !context.accountId) {
    return { status: 'unavailable' };
  }
  const extension = context.extension;
  const issue = isRecord(extension) ? extension.issue : undefined;
  const issueId = isRecord(issue) ? issue.id : undefined;
  if (typeof issueId !== 'string' || !/^\d+$/.test(issueId)) {
    return { status: 'unavailable' };
  }

  try {
    // Jira enforces the current user's access, including issue security.
    const response = await readIssueAsUser(issueId);
    if ([401, 403, 404].includes(response.status)) return { status: 'unavailable' };
    if (!response.ok) return { status: 'error' };
    const body = await response.json();
    if (!isRecord(body) || body.id !== issueId || typeof body.key !== 'string' || !body.key) {
      return { status: 'error' };
    }
    return { status: 'ready', issueId, issueKey: body.key };
  } catch {
    // Never send upstream errors, tokens, or private issue content to the browser.
    return { status: 'error' };
  }
}
