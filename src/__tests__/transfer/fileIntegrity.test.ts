/**
 * WebRTC Transfer Logic Integration Tests
 *
 * Tests the core data-integrity contract of the transfer system:
 * - Chunk encoding/decoding round-trip
 * - Binary data byte-for-byte integrity
 * - Multiple simultaneous transfer demultiplexing
 * - Edge cases: empty files, small files, binary data
 *
 * These tests operate at the packet/protocol level without requiring
 * actual WebRTC connections (which cannot be established in a test environment).
 */

import { describe, it, expect } from 'vitest';
import { encodeChunkPacket, decodeChunkPacket } from '../../utils/packet';
import { DEFAULT_CHUNK_SIZE } from '../../constants';

// ─── Helpers ─────────────────────────────────────────────────────────────

function chunkBuffer(data: ArrayBuffer, chunkSize: number): ArrayBuffer[] {
  const chunks: ArrayBuffer[] = [];
  let offset = 0;
  while (offset < data.byteLength) {
    chunks.push(data.slice(offset, offset + chunkSize));
    offset += chunkSize;
  }
  return chunks;
}

function reassembleChunks(chunks: Uint8Array[]): ArrayBuffer {
  const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}

function compareBuffers(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const ua = new Uint8Array(a);
  const ub = new Uint8Array(b);
  for (let i = 0; i < ua.length; i++) {
    if (ua[i] !== ub[i]) return false;
  }
  return true;
}

// ─── File integrity simulation ─────────────────────────────────────────

describe('File transfer integrity – chunk round-trip', () => {
  it('transfers a small text file byte-for-byte correctly', () => {
    const transferId = 'tr_text_001';
    const original = new TextEncoder().encode('Hello, World! This is a QuickDrop test file.').buffer;
    const chunks = chunkBuffer(original, DEFAULT_CHUNK_SIZE);

    // Encode each chunk into a packet
    const packets = chunks.map((chunk, i) => encodeChunkPacket(transferId, i, chunk));

    // Decode and reassemble
    const receivedChunks: Uint8Array[] = [];
    for (const packet of packets) {
      const decoded = decodeChunkPacket(packet);
      expect(decoded).not.toBeNull();
      expect(decoded!.transferId).toBe(transferId);
      receivedChunks[decoded!.chunkIndex] = decoded!.data;
    }

    const reconstructed = reassembleChunks(receivedChunks);
    expect(compareBuffers(original, reconstructed)).toBe(true);
    expect(new TextDecoder().decode(reconstructed)).toBe('Hello, World! This is a QuickDrop test file.');
  });

  it('transfers a 1 MB binary file byte-for-byte correctly', () => {
    const transferId = 'tr_binary_001';
    // Create deterministic binary data
    const size = 1024 * 1024; // 1 MB
    const original = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      original[i] = i % 256;
    }

    const chunks = chunkBuffer(original.buffer, DEFAULT_CHUNK_SIZE);

    const packets = chunks.map((chunk, i) => encodeChunkPacket(transferId, i, chunk));

    const receivedChunks: Uint8Array[] = [];
    for (const packet of packets) {
      const decoded = decodeChunkPacket(packet);
      expect(decoded).not.toBeNull();
      receivedChunks[decoded!.chunkIndex] = decoded!.data;
    }

    const reconstructed = reassembleChunks(receivedChunks);
    expect(compareBuffers(original.buffer, reconstructed)).toBe(true);
  });

  it('handles a 0-byte (empty) file without errors', () => {
    const transferId = 'tr_empty_001';
    const original = new ArrayBuffer(0);
    const chunks = chunkBuffer(original, DEFAULT_CHUNK_SIZE);

    // Empty file produces 0 chunks
    expect(chunks.length).toBe(0);

    // Reassemble empty chunks array
    const reconstructed = reassembleChunks([]);
    expect(reconstructed.byteLength).toBe(0);
    expect(compareBuffers(original, reconstructed)).toBe(true);
  });

  it('handles a single-byte file (1 byte)', () => {
    const transferId = 'tr_onebyte_001';
    const original = new Uint8Array([42]).buffer;
    const chunks = chunkBuffer(original, DEFAULT_CHUNK_SIZE);

    expect(chunks.length).toBe(1);

    const packets = chunks.map((chunk, i) => encodeChunkPacket(transferId, i, chunk));
    const receivedChunks: Uint8Array[] = [];

    for (const packet of packets) {
      const decoded = decodeChunkPacket(packet);
      receivedChunks[decoded!.chunkIndex] = decoded!.data;
    }

    const reconstructed = reassembleChunks(receivedChunks);
    expect(compareBuffers(original, reconstructed)).toBe(true);
  });

  it('transfers all-zero bytes correctly', () => {
    const transferId = 'tr_zeros_001';
    const original = new Uint8Array(32 * 1024).fill(0).buffer; // 32 KB of zeros
    const chunks = chunkBuffer(original, DEFAULT_CHUNK_SIZE);
    const packets = chunks.map((chunk, i) => encodeChunkPacket(transferId, i, chunk));

    const receivedChunks: Uint8Array[] = [];
    for (const packet of packets) {
      const decoded = decodeChunkPacket(packet)!;
      receivedChunks[decoded.chunkIndex] = decoded.data;
    }

    const reconstructed = reassembleChunks(receivedChunks);
    expect(compareBuffers(original, reconstructed)).toBe(true);
  });

  it('transfers all-255 bytes correctly (0xFF pattern)', () => {
    const transferId = 'tr_ff_001';
    const original = new Uint8Array(32 * 1024).fill(0xFF).buffer;
    const chunks = chunkBuffer(original, DEFAULT_CHUNK_SIZE);
    const packets = chunks.map((chunk, i) => encodeChunkPacket(transferId, i, chunk));

    const receivedChunks: Uint8Array[] = [];
    for (const packet of packets) {
      const decoded = decodeChunkPacket(packet)!;
      receivedChunks[decoded.chunkIndex] = decoded.data;
    }

    const reconstructed = reassembleChunks(receivedChunks);
    expect(compareBuffers(original, reconstructed)).toBe(true);
  });
});

// ─── Out-of-order chunk reassembly ────────────────────────────────────

describe('Out-of-order chunk reassembly', () => {
  it('correctly reassembles chunks received out of order', () => {
    const transferId = 'tr_ooo_001';
    const original = new TextEncoder().encode('ABCDEFGHIJKLMNOPQRSTUVWXYZ').buffer;
    // With chunk size 8, we get 4 chunks
    const chunks = chunkBuffer(original, 8);

    // Encode in order
    const packets = chunks.map((chunk, i) => encodeChunkPacket(transferId, i, chunk));

    // Decode in reverse order (simulating out-of-order arrival)
    const receivedChunks: Uint8Array[] = [];
    for (const packet of [...packets].reverse()) {
      const decoded = decodeChunkPacket(packet)!;
      receivedChunks[decoded.chunkIndex] = decoded.data;
    }

    const reconstructed = reassembleChunks(receivedChunks);
    expect(compareBuffers(original, reconstructed)).toBe(true);
  });
});

// ─── Simultaneous transfer demultiplexing ──────────────────────────────

describe('Simultaneous transfer isolation (no cross-contamination)', () => {
  it('correctly separates two simultaneous transfers', () => {
    const id1 = 'tr_transfer_A';
    const id2 = 'tr_transfer_B';

    const dataA = new TextEncoder().encode('Transfer A data: Hello from device A!').buffer;
    const dataB = new TextEncoder().encode('Transfer B data: Greetings from device B!').buffer;

    const chunksA = chunkBuffer(dataA, DEFAULT_CHUNK_SIZE);
    const chunksB = chunkBuffer(dataB, DEFAULT_CHUNK_SIZE);

    // Interleave packets from both transfers
    const allPackets: ArrayBuffer[] = [];
    const maxLen = Math.max(chunksA.length, chunksB.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < chunksA.length) allPackets.push(encodeChunkPacket(id1, i, chunksA[i]));
      if (i < chunksB.length) allPackets.push(encodeChunkPacket(id2, i, chunksB[i]));
    }

    // Demultiplex
    const receivedA: Uint8Array[] = [];
    const receivedB: Uint8Array[] = [];

    for (const packet of allPackets) {
      const decoded = decodeChunkPacket(packet)!;
      if (decoded.transferId === id1) {
        receivedA[decoded.chunkIndex] = decoded.data;
      } else if (decoded.transferId === id2) {
        receivedB[decoded.chunkIndex] = decoded.data;
      }
    }

    const reconstructedA = reassembleChunks(receivedA);
    const reconstructedB = reassembleChunks(receivedB);

    expect(compareBuffers(dataA, reconstructedA)).toBe(true);
    expect(compareBuffers(dataB, reconstructedB)).toBe(true);

    // Also verify there's no cross-contamination
    expect(compareBuffers(dataA, reconstructedB)).toBe(false);
    expect(compareBuffers(dataB, reconstructedA)).toBe(false);
  });
});

// ─── Chunk size edge cases ────────────────────────────────────────────

describe('Chunk size constants validation', () => {
  it('DEFAULT_CHUNK_SIZE is 16384 bytes (16 KB)', () => {
    expect(DEFAULT_CHUNK_SIZE).toBe(16 * 1024);
  });

  it('a file exactly equal to chunk size produces exactly 1 chunk', () => {
    const data = new Uint8Array(DEFAULT_CHUNK_SIZE).fill(1).buffer;
    expect(chunkBuffer(data, DEFAULT_CHUNK_SIZE).length).toBe(1);
  });

  it('a file of chunk size + 1 byte produces exactly 2 chunks', () => {
    const data = new Uint8Array(DEFAULT_CHUNK_SIZE + 1).fill(1).buffer;
    const chunks = chunkBuffer(data, DEFAULT_CHUNK_SIZE);
    expect(chunks.length).toBe(2);
    expect(chunks[0].byteLength).toBe(DEFAULT_CHUNK_SIZE);
    expect(chunks[1].byteLength).toBe(1); // final partial chunk
  });
});
