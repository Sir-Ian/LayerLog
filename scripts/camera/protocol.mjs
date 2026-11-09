import { Buffer } from 'node:buffer';
import { isIP } from 'node:net';

export const MAX_FRAME_BYTES = 8 * 1024 * 1024;

export function validateHost(host) {
  if (isIP(host) !== 4) throw new Error('Enter the printer’s private IPv4 address, not a URL or hostname.');
  const [a, b] = host.split('.').map(Number);
  if (!(a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168))) {
    throw new Error('Only private LAN addresses are supported.');
  }
  return host;
}

export function authPacket(code) {
  if (!/^[\x21-\x7e]{1,32}$/.test(code)) throw new Error('The LAN access code must be 1–32 printable ASCII characters.');
  const packet = Buffer.alloc(80);
  packet.writeUInt32LE(0x40, 0);
  packet.writeUInt32LE(0x3000, 4);
  packet.write('bblp', 16, 'ascii');
  packet.write(code, 48, 'ascii');
  return packet;
}

// Incremental, bounded parser: TCP chunks need not align with frame boundaries.
export class FrameReader {
  header = Buffer.alloc(16);
  offset = 0;
  payload = null;
  skipped = false;

  push(chunk) {
    let cursor = 0;
    while (cursor < chunk.length) {
      const target = this.payload ?? this.header;
      const count = Math.min(target.length - this.offset, chunk.length - cursor);
      chunk.copy(target, this.offset, cursor, cursor + count);
      this.offset += count;
      cursor += count;
      if (this.offset !== target.length) continue;
      this.offset = 0;
      if (!this.payload) {
        const size = this.header.readUInt32LE(0);
        if (size < 4 || size > MAX_FRAME_BYTES) throw new Error('Camera sent an unsupported frame size.');
        this.payload = Buffer.alloc(size);
      } else {
        const image = this.payload;
        this.payload = null;
        if (image.readUInt16BE(0) !== 0xffd8 || image.readUInt16BE(image.length - 2) !== 0xffd9) {
          throw new Error('Camera sent an invalid JPEG frame.');
        }
        // Some printers replay a buffered frame on connect. Skip it; freshness
        // still requires visual confirmation because the protocol has no timestamp.
        if (this.skipped) return image;
        this.skipped = true;
      }
    }
    return null;
  }
}
