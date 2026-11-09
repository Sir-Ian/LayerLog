import tls from 'node:tls';
import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import { setTimeout, clearTimeout } from 'node:timers';
import mqtt from 'mqtt';
import { validateHost } from '../camera/protocol.mjs';

export function probeCertificate(host, signal) {
  validateHost(host);
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port: 8883, rejectUnauthorized: false, minVersion: 'TLSv1.2' });
    const abort = () => finish(new Error('Canceled.'));
    const timer = setTimeout(() => finish(new Error('Status connection timed out. Check power, IP, and local network.')), 10000);
    let done = false;
    function finish(error, value) {
      if (done) return; done = true;
      clearTimeout(timer); signal?.removeEventListener('abort', abort); socket.destroy();
      if (error) reject(error); else resolve(value);
    }
    signal?.addEventListener('abort', abort, { once: true });
    socket.once('error', () => finish(new Error('Status TLS connection failed. Check local network access.')));
    socket.once('close', () => finish(new Error('Printer disconnected during certificate probe.')));
    socket.once('secureConnect', () => {
      const cert = socket.getPeerCertificate(true);
      if (!cert.raw || !cert.fingerprint256) return finish(new Error('Missing printer certificate.'));
      const chain = [];
      const seen = new Set();
      for (let peer = cert; peer?.raw && !seen.has(peer.fingerprint256); peer = peer.issuerCertificate) {
        seen.add(peer.fingerprint256);
        chain.push(`-----BEGIN CERTIFICATE-----\n${peer.raw.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----\n`);
      }
      const pem = chain.join('');
      finish(null, { fingerprint: cert.fingerprint256, pem });
    });
    if (signal?.aborted) abort();
  });
}

const stringFields = ['gcode_state', 'subtask_name', 'gcode_file', 'project_id', 'profile_id', 'task_id', 'subtask_id', 'gcode_start_time', 'nozzle_diameter'];
const numberFields = ['mc_percent', 'mc_remaining_time', 'layer_num', 'total_layer_num', 'nozzle_temper', 'nozzle_target_temper', 'bed_temper', 'bed_target_temper', 'print_error'];
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const boundedText = (value) => typeof value === 'string' && value.length <= 500 && ![...value].some((char) => char.charCodeAt(0) < 32);

// Allowlist only. Never persist raw reports: they may include cloud URLs or credentials.
export function sanitizeReport(topic, payload, retained = false) {
  if (!/^device\/[^/+#]+\/report$/.test(topic) || payload.length > 256 * 1024) return null;
  let data;
  try { data = JSON.parse(payload.toString()); } catch { return null; }
  if (!record(data?.print)) return null;
  const source = data.print;
  const fields = {};
  for (const key of stringFields) if (boundedText(source[key])) fields[key] = source[key];
  if (typeof fields.gcode_file === 'string' && /[:?]/.test(fields.gcode_file)) delete fields.gcode_file;
  for (const key of numberFields) if (typeof source[key] === 'number' && Number.isFinite(source[key])) fields[key] = source[key];
  const trays = [];
  for (const unit of Array.isArray(source.ams?.ams) ? source.ams.ams.slice(0, 16) : []) {
    if (!record(unit)) continue;
    for (const tray of Array.isArray(unit.tray) ? unit.tray.slice(0, 16) : []) {
      if (!record(tray)) continue;
      const item = {};
      for (const key of ['id', 'tray_type', 'tray_color']) if (boundedText(tray[key])) item[key] = tray[key];
      if (boundedText(unit.id)) item.amsId = unit.id;
      if (Object.keys(item).length) trays.push(item);
    }
  }
  if (trays.length) fields.reportedAmsInventory = trays;
  if (boundedText(source.ams?.tray_now)) fields.reportedCurrentTray = source.ams.tray_now;
  if (!Object.keys(fields).length) return null;
  return { receivedAt: new Date().toISOString(), retained: Boolean(retained), fields };
}

export function observeStatus({ host, code, certificate, signal, durationMs = 30000 }, connect = mqtt.connect) {
  validateHost(host);
  return new Promise((resolve, reject) => {
    const events = [];
    let settled = false;
    let stage = 'before MQTT login was accepted';
    const client = connect({ protocol: 'mqtts', host, port: 8883, protocolVersion: 4,
      clientId: `layerlog_${randomUUID().replaceAll('-', '').slice(0, 16)}`, username: 'bblp', password: code,
      clean: true, reconnectPeriod: 0, resubscribe: false, connectTimeout: 10000, keepalive: 15,
      manualConnect: true, rejectUnauthorized: true, ca: certificate.pem,
      checkServerIdentity: (_hostname, peer) => peer.fingerprint256 === certificate.fingerprint ? undefined : new Error('Certificate changed'),
    });
    const abort = () => finish(new Error('Canceled.'));
    const timer = setTimeout(() => finish(events.length ? null : new Error('No usable reports arrived. Check the LAN code, printer activity, and firmware access. No status was invented.')), durationMs);
    function finish(error) {
      if (settled) return; settled = true;
      clearTimeout(timer); signal?.removeEventListener('abort', abort);
      client.end(true, {}, () => { if (error) reject(error); else resolve(events); });
    }
    client.on('error', () => finish(new Error('Printer authentication or TLS connection failed. Check the LAN code and certificate.')));
    client.on('close', () => { if (!settled) finish(new Error(`Printer disconnected ${stage}. No automatic retry was attempted.`)); });
    client.on('connect', () => {
      stage = 'after login, while subscribing to reports';
      // The only application operation is subscribing to reports; no publish API is used.
      client.subscribe('device/+/report', { qos: 0 }, (error, grants) => {
        if (error || !grants?.length || grants.some((grant) => grant.qos === 128)) finish(new Error('Printer denied read-only report subscription.'));
        else stage = 'after the report subscription was accepted';
      });
    });
    client.on('message', (topic, payload, packet) => {
      if (settled) return;
      const event = sanitizeReport(topic, Buffer.from(payload), packet?.retain);
      if (event) events.push(event);
      if (events.length >= 100) finish(null);
    });
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort(); else client.connect();
  });
}
