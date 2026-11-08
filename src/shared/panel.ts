export type PanelContext =
  | { status: 'ready'; issueId: string; issueKey: string }
  | { status: 'unavailable' }
  | { status: 'error' };
