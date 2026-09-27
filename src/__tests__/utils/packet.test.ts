import { describe, it, expect } from 'vitest';
import { encodeChunkPacket, decodeChunkPacket } from '../../utils/packet';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeBuffer(bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  for (let i = 0; i < n; i++) buf[i] = Math.floor(Math.random() * 256);
  return buf;
}

// ─── Round-trip tests ────────────────────────────────────────────────────────

describe('encodeChunkPacket / decodeChunkPacket – round-trip', () => {
  it('encodes and decodes a basic chunk correctly', () => {
    const transferId = 'tr_test_123';
    const chunkIndex = 0;
    const data = new TextEncoder().encode('Hello, QuickDrop!').buffer;

    const packet = encodeChunkPacket(transferId, chunkIndex, data);
    const decoded = decodeChunkPacket(packet);

    expect(decoded).not.toBeNull();
    expect(decoded!.transferId).toBe(transferId);
    expect(decoded!.chunkIndex).toBe(chunkIndex);
    expect(new TextDecoder().decode(decoded!.data)).toBe('Hello, QuickDrop!');
  });

  it('preserves chunk index exactly', () => {
    const transferId = 'tr_abc';
    const chunkIndex = 65535; // Large chunk index
    const data = new Uint8Array([1, 2, 3, 4]).buffer;

    const packet = encodeChunkPacket(transferId, chunkIndex, data);
    const decoded = decodeChunkPacket(packet);

    expect(decoded!.chunkIndex).toBe(chunkIndex);
  });

  it('preserves chunk index of 0', () => {
    const packet = encodeChunkPacket('tr_x', 0, new Uint8Array([42]).buffer);
    const decoded = decodeChunkPacket(packet);
    expect(decoded!.chunkIndex).toBe(0);
  });

  it('handles a max uint32 chunk index (4294967295)', () => {
    const chunkIndex = 4294967295;
    const packet = encodeChunkPacket('tr_x', chunkIndex, new Uint8Array([1]).buffer);
    const decoded = decodeChunkPacket(packet);
    expect(decoded!.chunkIndex).toBe(chunkIndex);
  });

  it('handles empty data chunk (0 bytes)', () => {
    const transferId = 'tr_empty';
    const packet = encodeChunkPacket(transferId, 0, new ArrayBuffer(0));
    const decoded = decodeChunkPacket(packet);

    expect(decoded).not.toBeNull();
    expect(decoded!.transferId).toBe(transferId);
    expect(decoded!.data.byteLength).toBe(0);
  });

  it('handles a 16 KB chunk (default chunk size)', () => {
    const transferId = 'tr_big';
    const chunkData = randomBytes(16 * 1024).buffer;

    const packet = encodeChunkPacket(transferId, 99, chunkData);
    const decoded = decodeChunkPacket(packet);

    expect(decoded).not.toBeNull();
    expect(decoded!.data.byteLength).toBe(16 * 1024);
    // Verify byte-for-byte integrity
    const original = new Uint8Array(chunkData);
    for (let i = 0; i < original.length; i++) {
      expect(decoded!.data[i]).toBe(original[i]);
    }
  });

  it('handles a transfer ID with unicode characters', () => {
    const transferId = 'tr_हिंदी_test';
    const packet = encodeChunkPacket(transferId, 0, new Uint8Array([1, 2, 3]).buffer);
    const decoded = decodeChunkPacket(packet);
    expect(decoded!.transferId).toBe(transferId);
  });

  it('handles a very long transfer ID (100 chars) without crashing', () => {
    const transferId = 'tr_' + 'a'.repeat(97);
    const packet = encodeChunkPacket(transferId, 0, new Uint8Array([5]).buffer);
    const decoded = decodeChunkPacket(packet);
    expect(decoded!.transferId).toBe(transferId);
  });

  it('preserves binary data integrity (all byte values 0-255)', () => {
    const allBytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) allBytes[i] = i;

    const packet = encodeChunkPacket('tr_bytes', 0, allBytes.buffer);
    const decoded = decodeChunkPacket(packet);

    expect(decoded!.data.byteLength).toBe(256);
    for (let i = 0; i < 256; i++) {
      expect(decoded!.data[i]).toBe(i);
    }
  });
});

// ─── Rejection / safety tests ─────────────────────────────────────────────

describe('decodeChunkPacket – malformed inputs', () => {
  it('returns null for an empty ArrayBuffer', () => {
    expect(decodeChunkPacket(new ArrayBuffer(0))).toBeNull();
  });

  it('returns null for a buffer that is too short (< 6 bytes)', () => {
    expect(decodeChunkPacket(makeBuffer([0x43, 0x02, 0x61]))).toBeNull();
  });

  it('returns null for a buffer with wrong magic byte', () => {
    const buf = new Uint8Array(10);
    buf[0] = 0xFF; // wrong magic
    buf[1] = 2;
    expect(decodeChunkPacket(buf.buffer)).toBeNull();
  });

  it('returns null for a buffer where id length exceeds total buffer', () => {
    const buf = new Uint8Array(8);
    buf[0] = 0x43; // correct magic
    buf[1] = 250;  // claims 250-byte ID, but buffer is only 8 bytes
    expect(decodeChunkPacket(buf.buffer)).toBeNull();
  });
});

// ─── Multiple simultaneous transfer IDs ──────────────────────────────────

describe('packet demultiplexing correctness', () => {
  it('correctly identifies transfer IDs from different transfers', () => {
    const transfers = [
      { id: 'tr_001', chunkIndex: 0, payload: new Uint8Array([10, 20]) },
      { id: 'tr_002', chunkIndex: 1, payload: new Uint8Array([30, 40]) },
      { id: 'tr_003', chunkIndex: 2, payload: new Uint8Array([50, 60]) },
    ];

    const packets = transfers.map(({ id, chunkIndex, payload }) =>
      encodeChunkPacket(id, chunkIndex, payload.buffer)
    );

    const decoded = packets.map((p) => decodeChunkPacket(p)!);

    expect(decoded[0].transferId).toBe('tr_001');
    expect(decoded[1].transferId).toBe('tr_002');
    expect(decoded[2].transferId).toBe('tr_003');

    expect(decoded[0].data[0]).toBe(10);
    expect(decoded[1].data[0]).toBe(30);
    expect(decoded[2].data[0]).toBe(50);
  });
});
