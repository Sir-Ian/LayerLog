import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeReport, observeStatus } from '../scripts/printer/status.mjs';

test('status evidence excludes secrets, cloud URLs, unknown fields, and inferred settings', () => {
  const report = sanitizeReport('device/test/report', Buffer.from(JSON.stringify({ print: {
    gcode_state: 'RUNNING', mc_percent: 42, subtask_id: 'job123', access_code: 'private',
    gcode_file: 'https://example.com/job?secret=private', upload: { oss_url: 'private' },
    ams: { tray_now: '3', ams: [{ id: '0', tray: [{ id: '3', tray_color: 'ABCDEF00', tray_type: 'PETG', tag_uid: 'private' }] }] },
  } })), true);
  assert.equal(report.fields.mc_percent, 42);
  assert.equal(report.fields.reportedCurrentTray, '3');
  assert.equal(report.retained, true);
  assert.ok(!JSON.stringify(report).includes('private'));
  assert.equal(report.fields.filamentMapping, undefined);
  assert.equal(sanitizeReport('device/test/report', Buffer.from('bad json')), null);
  assert.equal(sanitizeReport('device/test/request', Buffer.from('{}')), null);
  assert.equal(sanitizeReport('device/test/report', Buffer.alloc(300000)), null);
});

function fakeClient() {
  const client = new EventEmitter();
  client.subscriptions = [];
  client.ended = false;
  client.connect = () => client.emit('connect');
  client.subscribe = (topic, options, done) => { client.subscriptions.push(topic); done(null, [{ topic, qos: options.qos }]); };
  client.end = (_force, _options, done) => { client.ended = true; done(); };
  client.publish = () => assert.fail('Printer publishing must never occur');
  return client;
}
const options = { host: '192.168.1.2', code: 'testcode', certificate: { pem: 'test-pem', fingerprint: 'pin' }, durationMs: 10 };
test('uses authenticated verified TLS, subscribes only to reports, and ends without reconnecting', async () => {
  const client = fakeClient();
  const promise = observeStatus(options, (config) => {
    assert.equal(config.password, 'testcode'); assert.equal(config.rejectUnauthorized, true);
    assert.equal(config.reconnectPeriod, 0); assert.equal(config.clean, true);
    assert.equal(config.checkServerIdentity('', { fingerprint256: 'pin' }), undefined);
    assert.ok(config.checkServerIdentity('', { fingerprint256: 'wrong' }) instanceof Error);
    return client;
  });
  client.emit('message', 'device/test/report', Buffer.from('{"print":{"gcode_state":"RUNNING"}}'), {});
  const events = await promise;
  assert.equal(events.length, 1); assert.equal(client.ended, true);
  assert.deepEqual(client.subscriptions, ['device/+/report']);
});
test('auth failure, empty observation, and cancellation close without saving raw errors', async () => {
  for (const mode of ['error', 'empty', 'abort']) {
    const client = fakeClient();
    const controller = new globalThis.AbortController();
    const promise = observeStatus({ ...options, signal: controller.signal }, () => client);
    if (mode === 'error') client.emit('error', new Error('private-code'));
    if (mode === 'abort') controller.abort();
    await assert.rejects(promise, (error) => !error.message.includes('private-code'));
    assert.ok(client.ended);
  }
});

test('real TLS MQTT connection authenticates, receives reports, and rejects a changed pin before authentication', async () => {
  const { execFileSync } = await import('node:child_process');
  const { mkdtemp, readFile, rm } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { X509Certificate } = await import('node:crypto');
  const tls = await import('node:tls');
  const { default: mqtt } = await import('mqtt');
  const directory = await mkdtemp(join(tmpdir(), 'layerlog-status-test-'));
  const sockets = new Set();
  let server;
  let authentications = 0;
  const commands = [];
  try {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(directory, 'key.pem'), '-out', join(directory, 'cert.pem'), '-days', '1', '-subj', '/CN=layerlog-test'], { stdio: 'ignore' });
    const key = await readFile(join(directory, 'key.pem'));
    const pem = await readFile(join(directory, 'cert.pem'), 'utf8');
    server = tls.createServer({ key, cert: pem }, socket => {
      sockets.add(socket); socket.on('close', () => sockets.delete(socket));
      let pending = Buffer.alloc(0);
      socket.on('data', chunk => {
        pending = Buffer.concat([pending, chunk]);
        while (pending.length >= 2) {
          // Test messages are deliberately shorter than the MQTT variable-length boundary.
          const size = pending[1];
          assert.ok(size < 128);
          if (pending.length < size + 2) return;
          const packet = pending.subarray(0, size + 2); pending = pending.subarray(size + 2);
          const type = packet[0] >> 4; commands.push(type);
          if (type === 1) {
            authentications++;
            assert.ok(packet.includes(Buffer.from('testcode')));
            socket.write(Buffer.from([0x20, 2, 0, 0]));
          } else if (type === 8) {
            socket.write(Buffer.from([0x90, 3, packet[2], packet[3], 0]));
            const topic = Buffer.from('device/test/report');
            const payload = Buffer.from('{"print":{"gcode_state":"RUNNING"}}');
            socket.write(Buffer.concat([Buffer.from([0x30, 2 + topic.length + payload.length, 0, topic.length]), topic, payload]));
          } else assert.fail(`Unexpected MQTT packet type ${type}`);
        }
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const connect = config => mqtt.connect({ ...config, host: '127.0.0.1', port: server.address().port });
    const certificate = { pem, fingerprint: new X509Certificate(pem).fingerprint256 };
    const events = await observeStatus({ ...options, certificate, durationMs: 300 }, connect);
    assert.equal(events[0].fields.gcode_state, 'RUNNING');
    assert.deepEqual(commands, [1, 8]);
    await assert.rejects(observeStatus({ ...options, certificate: { ...certificate, fingerprint: 'wrong' }, durationMs: 300 }, connect));
    assert.equal(authentications, 1);
  } finally {
    for (const socket of sockets) socket.destroy();
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
