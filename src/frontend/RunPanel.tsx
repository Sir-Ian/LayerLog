import React, { useEffect, useRef, useState } from 'react';
import { Button, Heading, Label, Link, SectionMessage, Select, Stack, Text, TextArea, Textfield } from '@forge/react';
import { invoke } from '@forge/bridge';
import { compareRuns, evidenceGaps } from '../shared/comparison';
import type { IssuePhoto, PhotosReply } from '../shared/evidence';
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
  const [formKey, setFormKey] = useState(0);
  const [photos, setPhotos] = useState<IssuePhoto[]>([]);
  const [photoMessage, setPhotoMessage] = useState('Photo list has not been checked.');
  const [comparison, setComparison] = useState<RunRecord[]>([]);
  async function refreshPhotos() {
    setPhotoMessage('Loading photos…');
    try {
      const response = await invoke<PhotosReply>('listPhotos');
      const result: PhotosReply = 'body' in response ? response.body : response;
      if (result.status !== 'ok') { setPhotos([]); setPhotoMessage('Photos unavailable. Check issue access and retry.'); return; }
      setPhotos(result.photos); setPhotoMessage(result.photos.length ? 'Choose evidence from this issue’s image attachments.' : 'No JPEG, PNG, or WebP attachments on this issue. Add a photo using Jira’s Attachments control, then refresh here.');
    } catch { setPhotos([]); setPhotoMessage('Could not load photos. Retry when connected.'); }
  }
  async function selectComparison(id: string) {
    setBusy(true); setMessage('');
    try {
      const result = await call('get', { id });
      if (result.status !== 'ok') { setMessage(errorText(result)); return; }
      setComparison(previous => [...previous.filter(item => item.id !== id).slice(-1), result.records[0]]);
    } catch { setMessage('Could not load comparison. Retry.'); }
    finally { setBusy(false); }
  }

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
    setFormKey(key => key + 1);
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
      setEditing(result.records[0]); setDraft(result.records[0].body); setFormKey(key => key + 1); setIsOpen(true);
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
    ['layerHeightMm', 'Layer height (mm; blank if unknown)'], ['nozzleDiameterMm', 'Nozzle diameter (mm)'],
    ['infillPercent', 'Infill (%)'], ['nozzleTemperatureC', 'Nozzle temperature (°C)'], ['bedTemperatureC', 'Bed temperature (°C)'],
    ['material', 'Material (leave blank if unknown)'], ['filamentColor', 'Filament color / selection (if verified)'],
  ] as const;
  return <Stack space="space.200">
    <SectionMessage title="Print records" appearance="information">
      <Text>Record separate attempts for each plate. Live Bambu synchronization is not connected yet. Enter only verified information; saved project settings may differ from the job that was printed.</Text>
    </SectionMessage>
    {message && <Text>{message}</Text>}
    <Button onClick={() => load()} isDisabled={busy}>Refresh</Button>
    {!isOpen && <Button onClick={refreshPhotos} isDisabled={busy}>Verify linked photos</Button>}
    {!isOpen && <Text>{photoMessage}</Text>}
    {!isOpen && <Button onClick={() => begin()} isDisabled={busy}>Add print attempt</Button>}
    {!isOpen && <Stack space="space.100">
      <Text>Optional demonstration records: prepare a clearly labeled sample.</Text>
      <Button onClick={() => begin(true, 1)} isDisabled={busy}>Prepare sample gear plate</Button>
      <Button onClick={() => begin(true, 2)} isDisabled={busy}>Prepare sample fit-test plate</Button>
    </Stack>}
    {isOpen && <Stack key={formKey} space="space.100">
      <Heading as="h3">{editing ? 'Edit attempt' : 'New attempt'}</Heading>
      {draft.sample && <Text>SAMPLE — illustrative data, not a real print.</Text>}
      {textFields.map(([key, label]) => <Stack key={key} space="space.050">
        <Label labelFor={key}>{label}</Label>
        <Textfield id={key} defaultValue={draft[key] ?? ''} isDisabled={busy} onChange={(event) => setDraft(previous => ({ ...previous, [key]: event.target.value }))} />
      </Stack>)}
      <Label labelFor="plateNumber">Plate number</Label>
      <Textfield id="plateNumber" type="number" defaultValue={String(draft.plateNumber)} isDisabled={busy} onChange={(event) => setDraft(previous => ({ ...previous, plateNumber: Number(event.target.value) }))} />
      <Label labelFor="machineStatus">Machine status (not a quality judgment)</Label>
      <Select inputId="machineStatus" isDisabled={busy} options={MACHINE_STATES.map((value) => ({ label: value, value }))}
        value={{ label: draft.machineStatus, value: draft.machineStatus }}
        onChange={(option) => { if (option) setDraft({ ...draft, machineStatus: (option as { value: RunDraft['machineStatus'] }).value }); }} />
      <Label labelFor="physicalResult">Your physical test result</Label>
      <Select inputId="physicalResult" isDisabled={busy} options={PHYSICAL_RESULTS.map((value) => ({ label: value, value }))}
        value={{ label: draft.physicalResult, value: draft.physicalResult }}
        onChange={(option) => { if (option) setDraft({ ...draft, physicalResult: (option as { value: RunDraft['physicalResult'] }).value }); }} />
      <Label labelFor="settingsNotes">Verified settings and their source</Label>
      <TextArea id="settingsNotes" defaultValue={draft.settingsNotes} isDisabled={busy} onChange={(event) => setDraft(previous => ({ ...previous, settingsNotes: event.target.value }))} />
      <Label labelFor="notes">Observations / intended test</Label>
      <TextArea id="notes" defaultValue={draft.notes} isDisabled={busy} onChange={(event) => setDraft(previous => ({ ...previous, notes: event.target.value }))} />
      <Label labelFor="measurements">Measurements with units and test method</Label>
      <TextArea id="measurements" defaultValue={draft.measurements ?? ''} isDisabled={busy} onChange={event => setDraft(previous => ({ ...previous, measurements: event.target.value }))} />
      <Heading as="h3">Photo evidence</Heading>
      <Text>{photoMessage}</Text>
      <Button onClick={refreshPhotos} isDisabled={busy}>Refresh issue photos</Button>
      {photos.filter(photo => !draft.photos?.some(selected => selected.attachmentId === photo.id)).map(photo => <Button key={photo.id} isDisabled={busy || (draft.photos?.length ?? 0) >= 12} onClick={() => setDraft(previous => ({ ...previous, photos: [...(previous.photos ?? []), { attachmentId: photo.id, capturedAt: '', source: 'unknown', caption: '' }] }))}>{`Link ${photo.filename}`}</Button>)}
      {(draft.photos ?? []).map(photo => <Stack key={photo.attachmentId} space="space.050">
        <Text>{photos.find(item => item.id === photo.attachmentId)?.filename ?? `Attachment ${photo.attachmentId} — refresh photos to verify availability`}</Text>
        <Label labelFor={`source-${photo.attachmentId}`}>Photo source (printer camera / phone / unknown)</Label>
        <Textfield id={`source-${photo.attachmentId}`} defaultValue={photo.source} isDisabled={busy} onChange={event => setDraft(previous => ({ ...previous, photos: previous.photos?.map(item => item.attachmentId === photo.attachmentId ? { ...item, source: event.target.value } : item) }))} />
        <Label labelFor={`time-${photo.attachmentId}`}>Capture time (UTC ISO timestamp; blank if unknown)</Label>
        <Textfield id={`time-${photo.attachmentId}`} defaultValue={photo.capturedAt} isDisabled={busy} onChange={event => setDraft(previous => ({ ...previous, photos: previous.photos?.map(item => item.attachmentId === photo.attachmentId ? { ...item, capturedAt: event.target.value } : item) }))} />
        <Label labelFor={`caption-${photo.attachmentId}`}>Caption / image limitations</Label>
        <TextArea id={`caption-${photo.attachmentId}`} defaultValue={photo.caption} isDisabled={busy} onChange={event => setDraft(previous => ({ ...previous, photos: previous.photos?.map(item => item.attachmentId === photo.attachmentId ? { ...item, caption: event.target.value } : item) }))} />
        <Button isDisabled={busy} onClick={() => setDraft(previous => ({ ...previous, photos: previous.photos?.filter(item => item.attachmentId !== photo.attachmentId) }))}>Unlink photo from draft</Button>
      </Stack>)}
      <Button appearance="primary" onClick={save} isDisabled={busy}>Save attempt</Button>
      {editing && <Button onClick={() => reopen(editing.id)} isDisabled={busy}>Reopen saved version (discard draft)</Button>}
      <Button onClick={() => { setIsOpen(false); setMessage(''); }} isDisabled={busy}>Cancel draft</Button>
    </Stack>}
    {records.map((record) => <Stack key={record.id} space="space.100">
      <Heading as="h3">{`${record.body.sample ? '[SAMPLE] ' : ''}${record.body.project} · ${record.body.modelRevision} · Plate ${record.body.plateNumber}${record.body.plateName ? ` — ${record.body.plateName}` : ''}`}</Heading>
      <Text>{`Machine: ${record.body.machineStatus} · Physical test: ${record.body.physicalResult}`}</Text>
      <Text>{`Material: ${record.body.material || 'unknown'} · Color/selection: ${record.body.filamentColor || 'unknown'}`}</Text>
      <Text>{`Saved ${record.updatedAt} · revision ${record.revision}`}</Text>
      <Text>{record.body.notes || 'No observations recorded.'}</Text>
      {evidenceGaps(record.body).map(gap => <Text key={gap}>{`Evidence needed: ${gap}`}</Text>)}
      {(record.body.photos ?? []).map(photo => <Stack key={photo.attachmentId} space="space.050">
        {photos.some(item => item.id === photo.attachmentId) ? <Link href={`/secure/attachment/${photo.attachmentId}/`}>{`Open photo ${photo.attachmentId} in Jira (access required)`}</Link> : <Text>{`Photo ${photo.attachmentId}: unavailable or not yet verified. Use Verify linked photos.`}</Text>}
        <Text>{`${photo.source} · captured ${photo.capturedAt || 'unknown'} · ${photo.caption || 'No caption'}`}</Text>
      </Stack>)}
      <Button onClick={() => selectComparison(record.id)} isDisabled={busy || isOpen}>Select for comparison</Button>
      <Button onClick={() => reopen(record.id)} isDisabled={busy || isOpen}>Open / edit attempt</Button>
    </Stack>)}
    {comparison.length > 0 && <Stack space="space.100">
      <Heading as="h3">Attempt comparison</Heading>
      <Text>{comparison.map((record, index) => `${index === 0 ? 'A' : 'B'}: ${record.body.sample ? '[SAMPLE] ' : ''}${record.body.modelRevision}, plate ${record.body.plateNumber}, saved revision ${record.revision}`).join(' · ')}</Text>
      <Text>Comparison uses the saved versions selected here. Reselect after editing. Changes show differences, not proof of what caused a result.</Text>
      {comparison.length === 1 && <Text>Select a second attempt to compare.</Text>}
      {comparison.length === 2 && compareRuns(comparison[0], comparison[1]).map(row => <Stack key={row.label} space="space.050">
        <Text>{`${row.changed ? 'CHANGED' : 'Same'} — ${row.label}`}</Text>
        <Text>{`A: ${row.before || 'Unrecorded'} · B: ${row.after || 'Unrecorded'}`}</Text>
      </Stack>)}
      <Button onClick={() => setComparison([])}>Clear comparison</Button>
    </Stack>}
    {cursor && <Button onClick={() => load(true)} isDisabled={busy}>Load more attempts</Button>}
    <Text>Counts shown cover loaded attempts only. A completed plate does not mean every plate in the project has completed.</Text>
  </Stack>;
}
