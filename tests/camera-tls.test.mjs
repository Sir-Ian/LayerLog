import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import tls from 'node:tls';
import test from 'node:test';
import { cameraRequest } from '../scripts/camera/transport.mjs';

test('real local TLS probe and capture authenticate, reconstruct frames, and close', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'layerlog-camera-test-'));
  const sockets = new Set();
  let server;
  try {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(directory, 'key.pem'),
      '-out', join(directory, 'cert.pem'), '-days', '1', '-subj', '/CN=layerlog-test'], { stdio: 'ignore' });
    const key = await readFile(join(directory, 'key.pem'));
    const cert = await readFile(join(directory, 'cert.pem'));
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]); // Framing fixture only.
    const header = Buffer.alloc(16); header.writeUInt32LE(jpeg.length);
    let authentications = 0;
    server = tls.createServer({ key, cert }, (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      let auth = Buffer.alloc(0);
      socket.on('data', (chunk) => {
        auth = Buffer.concat([auth, chunk]);
        if (auth.length < 80) return;
        authentications++;
        assert.equal(auth.length, 80);
        assert.equal(auth.subarray(48, 56).toString(), 'testcode');
        socket.write(header.subarray(0, 3));
        socket.write(Buffer.concat([header.subarray(3), jpeg, header, jpeg]));
      });
    });
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const clients = [];
    // Test-only injection targets loopback; the public helper still rejects it.
    const connect = (options) => {
      const socket = tls.connect({ ...options, host: '127.0.0.1', port: server.address().port });
      clients.push(socket);
      return socket;
    };
    const fingerprint = await cameraRequest({ host: '192.168.1.2' }, connect);
    assert.equal(authentications, 0);
    const image = await cameraRequest({ host: '192.168.1.2', fingerprint, code: 'testcode' }, connect);
    assert.deepEqual(image, jpeg);
    assert.equal(authentications, 1);
    assert.ok(clients.every((socket) => socket.destroyed));
  } finally {
    for (const socket of sockets) socket.destroy();
    if (server?.listening) await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});
