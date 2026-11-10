import React, { useEffect, useRef, useState } from 'react';
import { Button, Heading, Label, SectionMessage, Select, Stack, Text, TextArea, Textfield } from '@forge/react';
import { invoke } from '@forge/bridge';
import { emptyDraft, MACHINE_STATES, PHYSICAL_RESULTS, type RunDraft, type RunRecord, type RunsReply } from '../shared/runs';

const requestId = () => globalThis.crypto.randomUUID();
async function call(operation: string, payload: object): Promise<RunsReply> {
  const response = await invoke<RunsReply>(`${operation}Runs`, payload);
  return 'body' in response ? response.body : response;
}
const errorText = (result: RunsReply) => result.status === 'invalid' ? result.message
  : result.status === 'conflict' ? 'This record changed, or this save request was already used. Your draft is preserved. Reopen the saved record to review before editing again.'
    : result.status === 'unavailable' ? 'You no longer have access to this issue or permission to edit it.'
      : 'Could not complete the request. Your draft is preserved; you can retry.';

export function RunPanel() {
  const [records, setRecords] = useState<RunRecord[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [draft, setDraft] = useState<RunDraft>(emptyDraft);
  const [editing, setEditing] = useState<RunRecord>();
  const [saveId, setSaveId] = useState(requestId);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    let active = true;
    setBusy(true);
    call('list', {}).then((result) => {
      if (!active) return;
      if (result.status === 'ok') { setRecords(result.records); setCursor(result.cursor); }
      else setMessage(errorText(result));
    }).catch(() => { if (active) setMessage('Could not load print attempts. Use Refresh to retry.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  async function load(more = false) {
    setBusy(true); setMessage('');
    try {
      const result = await call('list', more ? { cursor } : {});
      if (result.status !== 'ok') { setMessage(errorText(result)); return; }
      setRecords((previous) => more ? [...new Map([...previous, ...result.records].map((record) => [record.id, record])).values()] : result.records);
      setCursor(result.cursor);
    } catch { setMessage('Could not load attempts. Try again.'); }
    finally { setBusy(false); }
  }
  function begin(sample = false, plate = 1) {
    setDraft(sample ? { ...emptyDraft(), project: 'Sample smart-blind gear', modelRevision: 'Illustrative revision A', plateNumber: plate,
      plateName: plate === 1 ? 'Gear' : 'Fit-test coupon', material: 'Sample PETG', sample: true,
      notes: 'Synthetic example only. No actual measurements or test results.' } : emptyDraft());
    setEditing(undefined); setSaveId(requestId()); setMessage(''); setIsOpen(true);
  }
  async function reopen(id: string) {
    setBusy(true); setMessage('');
    try {
      const result = await call('get', { id });
      if (result.status !== 'ok' || !result.records[0]) { setMessage(errorText(result)); return; }
      setEditing(result.records[0]); setDraft(result.records[0].body); setIsOpen(true);
    } catch { setMessage('Could not reopen this record. Try again.'); }
    finally { setBusy(false); }
  }
  async function save() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true); setMessage('');
    try {
      const result = await call(editing ? 'update' : 'create', editing
        ? { id: editing.id, expectedRevision: editing.revision, body: draft }
        : { requestId: saveId, body: draft });
      if (result.status !== 'ok') { setMessage(errorText(result)); return; }
      const saved = result.records[0];
      // Display the successful write immediately; indexed lists are eventually consistent.
      setRecords((previous) => [saved, ...previous.filter((item) => item.id !== saved.id)]);
      setEditing(saved); setDraft(saved.body); setIsOpen(false); setMessage('Saved.');
    } catch { setMessage('Save response was interrupted. Your draft is preserved. Retry to check the same save request.'); }
    finally { saving.current = false; setBusy(false); }
  }
  const textFields = [
    ['project', 'Project'], ['modelRevision', 'Model revision'], ['plateName', 'Plate name'],
    ['material', 'Material (leave blank if unknown)'], ['filamentColor', 'Filament color / selection (if verified)'],
  ] as const;
  return <Stack space="space.200">
    <SectionMessage title="Print records" appearance="information">
      <Text>Record separate attempts for each plate. Live Bambu synchronization is not connected yet. Enter only verified information; saved project settings may differ from the job that was printed.</Text>
    </SectionMessage>
    {message && <Text>{message}</Text>}
    <Button onClick={() => load()} isDisabled={busy}>Refresh</Button>
    {!isOpen && <Button onClick={() => begin()} isDisabled={busy}>Add print attempt</Button>}
    {!isOpen && records.length === 0 && <Stack space="space.100">
      <Text>No attempts loaded. Start with a real attempt or prepare a clearly labeled sample.</Text>
      <Button onClick={() => begin(true, 1)} isDisabled={busy}>Prepare sample gear plate</Button>
      <Button onClick={() => begin(true, 2)} isDisabled={busy}>Prepare sample fit-test plate</Button>
    </Stack>}
    {isOpen && <Stack space="space.100">
      <Heading as="h3">{editing ? 'Edit attempt' : 'New attempt'}</Heading>
      {draft.sample && <Text>SAMPLE — illustrative data, not a real print.</Text>}
      {textFields.map(([key, label]) => <Stack key={key} space="space.050">
        <Label labelFor={key}>{label}</Label>
        <Textfield id={key} value={draft[key]} isDisabled={busy} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} />
      </Stack>)}
      <Label labelFor="plateNumber">Plate number</Label>
      <Textfield id="plateNumber" type="number" value={String(draft.plateNumber)} isDisabled={busy} onChange={(event) => setDraft({ ...draft, plateNumber: Number(event.target.value) })} />
      <Label labelFor="machineStatus">Machine status (not a quality judgment)</Label>
      <Select inputId="machineStatus" isDisabled={busy} options={MACHINE_STATES.map((value) => ({ label: value, value }))}
        value={{ label: draft.machineStatus, value: draft.machineStatus }}
        onChange={(option) => { if (option) setDraft({ ...draft, machineStatus: (option as { value: RunDraft['machineStatus'] }).value }); }} />
      <Label labelFor="physicalResult">Your physical test result</Label>
      <Select inputId="physicalResult" isDisabled={busy} options={PHYSICAL_RESULTS.map((value) => ({ label: value, value }))}
        value={{ label: draft.physicalResult, value: draft.physicalResult }}
        onChange={(option) => { if (option) setDraft({ ...draft, physicalResult: (option as { value: RunDraft['physicalResult'] }).value }); }} />
      <Label labelFor="settingsNotes">Verified settings and their source</Label>
      <TextArea id="settingsNotes" value={draft.settingsNotes} isDisabled={busy} onChange={(event) => setDraft({ ...draft, settingsNotes: event.target.value })} />
      <Label labelFor="notes">Observations / intended test</Label>
      <TextArea id="notes" value={draft.notes} isDisabled={busy} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
      <Button appearance="primary" onClick={save} isDisabled={busy}>Save attempt</Button>
      {editing && <Button onClick={() => reopen(editing.id)} isDisabled={busy}>Reopen saved version (discard draft)</Button>}
      <Button onClick={() => { setIsOpen(false); setMessage(''); }} isDisabled={busy}>Cancel draft</Button>
    </Stack>}
    {records.map((record) => <Stack key={record.id} space="space.100">
      <Heading as="h3">{`${record.body.sample ? '[SAMPLE] ' : ''}${record.body.project} · ${record.body.modelRevision} · Plate ${record.body.plateNumber}${record.body.plateName ? ` — ${record.body.plateName}` : ''}`}</Heading>
      <Text>{`Machine: ${record.body.machineStatus} · Physical test: ${record.body.physicalResult}`}</Text>
      <Text>{`Material: ${record.body.material || 'unknown'} · Color/selection: ${record.body.filamentColor || 'unknown'}`}</Text>
      <Text>{`Saved ${record.updatedAt} · revision ${record.revision}`}</Text>
      <Button onClick={() => reopen(record.id)} isDisabled={busy || isOpen}>Open / edit attempt</Button>
    </Stack>)}
    {cursor && <Button onClick={() => load(true)} isDisabled={busy}>Load more attempts</Button>}
    <Text>Counts shown cover loaded attempts only. A completed plate does not mean every plate in the project has completed.</Text>
  </Stack>;
}
