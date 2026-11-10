import tls from 'node:tls';
import { setTimeout, clearTimeout } from 'node:timers';
import { authPacket, FrameReader, validateHost } from './protocol.mjs';

function safeNetworkError(error) {
  const hints = {
    ECONNREFUSED: 'Camera port refused the connection. Check camera availability and close other live viewers.',
    EHOSTUNREACH: 'Printer is unreachable. Check its IP and that both devices share the local network.',
    ENETUNREACH: 'Printer network is unreachable. Check Wi-Fi or VPN routing.',
    ECONNRESET: 'Printer closed the connection. Check the LAN code and camera access for this firmware.',
    EPERM: 'Local network access was blocked. Check macOS Local Network permission.',
    EACCES: 'Local network access was blocked. Check macOS Local Network permission.',
  };
  return new Error(hints[error.code] ?? 'Camera TLS/network connection failed. Check printer access and firmware; no capture was saved.');
}

// rejectUnauthorized is false only to inspect the printer's self-signed cert.
// Authentication bytes are never sent until its SHA-256 pin matches.
export function cameraRequest({ host, fingerprint, code, signal, timeoutMs = 20000 }, connect = tls.connect) {
  validateHost(host);
  if (fingerprint && !/^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/.test(fingerprint)) {
    throw new Error('Invalid SHA-256 certificate fingerprint.');
  }
  if (code !== undefined && !fingerprint) throw new Error('Trust the printer certificate before entering credentials.');
  const packet = code === undefined ? null : authPacket(code);
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port: 6000, rejectUnauthorized: false, minVersion: 'TLSv1.2' });
    const reader = new FrameReader();
    let settled = false;
    const timer = setTimeout(() => finish(new Error('Camera timed out after 20 seconds. Check power, network, LAN code, and competing viewers.')), timeoutMs);
    const abort = () => finish(new Error('Capture canceled. Connection closed.'));
    function finish(error, value) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      socket.destroy();
      packet?.fill(0);
      if (error) reject(error);
      else resolve(value);
    }
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) { abort(); return; }
    socket.once('secureConnect', () => {
      const actual = socket.getPeerCertificate().fingerprint256;
      if (!actual) { finish(new Error('Printer did not provide a certificate fingerprint.')); return; }
      if (!packet) { finish(null, actual); return; }
      if (actual !== fingerprint) { finish(new Error('Printer certificate changed. No access code was sent. Verify the device before trusting it again.')); return; }
      socket.write(packet);
    });
    socket.on('data', (chunk) => {
      if (!packet || settled) return;
      try {
        const image = reader.push(chunk);
        if (image) finish(null, image);
      } catch (error) { finish(error); }
    });
    socket.once('error', (error) => finish(safeNetworkError(error)));
    socket.once('close', () => finish(new Error('Camera disconnected before a complete second frame. Check the LAN code and close other camera viewers.')));
  });
}
