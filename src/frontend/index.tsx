import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Button, Heading, SectionMessage, Spinner, Stack, Text } from '@forge/react';
import { invoke } from '@forge/bridge';
import type { PanelContext } from '../shared/panel';
import { RunPanel } from './RunPanel';

type State = PanelContext | { status: 'loading' };

function App() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [request, setRequest] = useState(0);

  useEffect(() => {
    let active = true;
    invoke<PanelContext>('getPanelContext')
      .then((result) => { if (active) setState('body' in result ? result.body : result); })
      .catch(() => { if (active) setState({ status: 'error' }); });
    return () => { active = false; };
  }, [request]);

  const retry = () => {
    setState({ status: 'loading' });
    setRequest((value) => value + 1);
  };

  if (state.status === 'loading') {
    return <Spinner label="Loading LayerLog" />;
  }
  if (state.status === 'unavailable') {
    return (
      <Stack space="space.200">
        <SectionMessage title="Issue unavailable" appearance="warning">
          <Text>Open LayerLog from a Jira issue you can access. If access has changed, contact your Jira administrator.</Text>
        </SectionMessage>
        <Button onClick={retry}>Retry</Button>
      </Stack>
    );
  }
  if (state.status === 'error') {
    return (
      <Stack space="space.200">
        <SectionMessage title="Could not load LayerLog" appearance="error">
          <Text>We could not check this issue right now. Please try again.</Text>
        </SectionMessage>
        <Button onClick={retry}>Retry</Button>
      </Stack>
    );
  }
  return (
    <Stack space="space.200">
      <Heading as="h2">Print attempts</Heading>
      <Text>{`Track model revisions, print settings, and test observations for ${state.issueKey}.`}</Text>
      <RunPanel />
    </Stack>
  );
}

ForgeReconciler.render(<App />);
