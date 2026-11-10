import { Buffer } from 'node:buffer';
import { EventEmitter } from 'node:events';
import assert from 'node:assert/strict';
import test from 'node:test';
import { authPacket, FrameReader, MAX_FRAME_BYTES, validateHost } from '../scripts/camera/protocol.mjs';
import { cameraRequest } from '../scripts/camera/transport.mjs';

const pin = Array(32).fill('AB').join(':');
const image = Buffer.from([0xff, 0xd8, 1, 2, 0xff, 0xd9]); // Synthetic framing fixture, not photographic evidence.
function frame(payload = image) {
  const header = Buffer.alloc(16);
  header.writeUInt32LE(payload.length);
  return Buffer.concat([header, payload]);
}
function fakeCamera(actualPin = pin) {
  const socket = new EventEmitter();
  socket.destroyed = false;
  socket.sent = [];
  socket.destroy = () => { socket.destroyed = true; };
  socket.getPeerCertificate = () => ({ fingerprint256: actualPin });
  socket.write = (data) => socket.sent.push(Buffer.from(data));
  return socket;
}

test('restricts targets to literal private IPv4 addresses', () => {
  for (const host of ['192.168.1.20', '10.0.0.4', '172.16.0.2', '172.31.1.2']) assert.equal(validateHost(host), host);
  for (const host of ['8.8.8.8', '127.0.0.1', '169.254.1.2', '172.32.0.1', 'printer.local', 'https://192.168.1.2', '::1']) assert.throws(() => validateHost(host));
});
test('authentication packet follows the documented wire layout and rejects overflow', () => {
  const packet = authPacket('testcode');
  assert.equal(packet.length, 80);
  assert.equal(packet.readUInt32LE(0), 64);
  assert.equal(packet.readUInt32LE(4), 0x3000);
  assert.equal(packet.subarray(16, 20).toString(), 'bblp');
  assert.equal(packet.subarray(48, 56).toString(), 'testcode');
  assert.throws(() => authPacket('x'.repeat(33)));
  assert.throws(() => authPacket('secret\n'));
});
test('handles every split boundary and skips the initial buffered frame', () => {
  const bytes = Buffer.concat([frame(), frame()]);
  for (let split = 1; split < bytes.length; split++) {
    const reader = new FrameReader();
    assert.equal(reader.push(bytes.subarray(0, split)), null);
    assert.deepEqual(reader.push(bytes.subarray(split)), image);
  }
  const reader = new FrameReader();
  for (const byte of frame()) assert.equal(reader.push(Buffer.from([byte])), null);
  assert.deepEqual(reader.push(frame()), image);
});
test('rejects oversized and malformed frames before saving anything', () => {
  for (const size of [0, 3, MAX_FRAME_BYTES + 1]) {
    const header = Buffer.alloc(16); header.writeUInt32LE(size);
    assert.throws(() => new FrameReader().push(header), /frame size/);
  }
  assert.throws(() => new FrameReader().push(frame(Buffer.alloc(4))), /invalid JPEG/);
});
test('probe sends no credentials; pin mismatch also sends nothing', async () => {
  const probe = fakeCamera();
  const result = cameraRequest({ host: '192.168.1.2' }, () => probe);
  probe.emit('secureConnect');
  assert.equal(await result, pin);
  assert.equal(probe.sent.length, 0);
  assert.ok(probe.destroyed);
  const mismatch = fakeCamera('different');
  const capture = cameraRequest({ host: '192.168.1.2', fingerprint: pin, code: 'testcode' }, () => mismatch);
  mismatch.emit('secureConnect');
  await assert.rejects(capture, /certificate changed/);
  assert.equal(mismatch.sent.length, 0);
  assert.ok(mismatch.destroyed);
});
test('capture authenticates once, receives second frame, and disconnects', async () => {
  const socket = fakeCamera();
  const result = cameraRequest({ host: '192.168.1.2', fingerprint: pin, code: 'testcode' }, () => socket);
  socket.emit('secureConnect');
  socket.emit('data', Buffer.concat([frame(), frame()]));
  assert.deepEqual(await result, image);
  assert.equal(socket.sent.length, 1);
  assert.ok(socket.destroyed);
});
test('disconnect, timeout, abort, and network errors close without retries or leaking errors', async () => {
  for (const mode of ['close', 'timeout', 'abort', 'error', 'partial']) {
    const socket = fakeCamera();
    const controller = new globalThis.AbortController();
    const result = cameraRequest({ host: '192.168.1.2', fingerprint: pin, code: 'testcode', signal: controller.signal, timeoutMs: 5 }, () => socket);
    socket.emit('secureConnect');
    if (mode === 'close') socket.emit('close');
    if (mode === 'abort') controller.abort();
    if (mode === 'partial') { socket.emit('data', frame().subarray(0, 18)); socket.emit('close'); }
    if (mode === 'error') socket.emit('error', new Error('DO-NOT-PRINT-SECRET'));
    await assert.rejects(result, (error) => !error.message.includes('DO-NOT-PRINT-SECRET'));
    assert.ok(socket.destroyed);
    assert.equal(socket.sent.length, 1);
  }
});
