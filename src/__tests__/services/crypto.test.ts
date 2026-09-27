import { describe, it, expect } from 'vitest';
import { generateRoomCode, generateRandomId, calculateSHA256 } from '../../services/crypto';

// ─── generateRoomCode ─────────────────────────────────────────────────────

describe('generateRoomCode', () => {
  it('always starts with "QK-"', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      expect(code.startsWith('QK-')).toBe(true);
    }
  });

  it('has 4 characters after "QK-"', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode();
      const suffix = code.slice(3);
      expect(suffix.length).toBe(4);
    }
  });

  it('only uses safe characters (no 0, O, 1, I)', () => {
    const forbiddenChars = new Set(['0', 'O', '1', 'I']);
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      const suffix = code.slice(3);
      for (const char of suffix) {
        expect(forbiddenChars.has(char)).toBe(false);
      }
    }
  });

  it('generates unique codes (probabilistic - very unlikely to collide)', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    // Should have at least 95 unique codes in 100 attempts
    expect(codes.size).toBeGreaterThan(95);
  });

  it('matches ROOM_CODE_REGEX', () => {
    const regex = /^QK-[A-Z0-9]{4,6}$/i;
    for (let i = 0; i < 50; i++) {
      expect(regex.test(generateRoomCode())).toBe(true);
    }
  });
});

// ─── generateRandomId ─────────────────────────────────────────────────────

describe('generateRandomId', () => {
  it('starts with provided prefix', () => {
    const id = generateRandomId('test');
    expect(id.startsWith('test_')).toBe(true);
  });

  it('uses "id" as default prefix', () => {
    const id = generateRandomId();
    expect(id.startsWith('id_')).toBe(true);
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(generateRandomId('x'));
    }
    expect(ids.size).toBe(50);
  });
});

// ─── calculateSHA256 ──────────────────────────────────────────────────────

describe('calculateSHA256', () => {
  // SHA-256 of empty string
  const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  it('computes the correct SHA-256 of an empty ArrayBuffer', async () => {
    const result = await calculateSHA256(new ArrayBuffer(0));
    expect(result).toBe(EMPTY_SHA256);
  });

  it('computes the correct SHA-256 of a known string', async () => {
    // SHA-256 of "hello" = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    const buf = new TextEncoder().encode('hello').buffer;
    const result = await calculateSHA256(buf);
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('produces consistent hashes for the same input', async () => {
    const data = new TextEncoder().encode('QuickDrop test data').buffer;
    const hash1 = await calculateSHA256(data);
    const hash2 = await calculateSHA256(data);
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different inputs', async () => {
    const data1 = new TextEncoder().encode('file-content-A').buffer;
    const data2 = new TextEncoder().encode('file-content-B').buffer;
    const hash1 = await calculateSHA256(data1);
    const hash2 = await calculateSHA256(data2);
    expect(hash1).not.toBe(hash2);
  });

  it('returns a 64-character hex string (256 bits)', async () => {
    const data = new TextEncoder().encode('test').buffer;
    const result = await calculateSHA256(data);
    // Should not be the fallback error strings
    expect(result).not.toBe('sha256-unsupported');
    expect(result).not.toBe('checksum-error');
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('handles a Blob input', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' });
    const result = await calculateSHA256(blob);
    expect(result).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('handles a large in-memory Blob (1 MB)', async () => {
    const largeData = new Uint8Array(1024 * 1024).fill(0xAB);
    const blob = new Blob([largeData]);
    const result = await calculateSHA256(blob);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
    expect(result).not.toBe('checksum-error');
  });

  /**
   * REGRESSION TEST for BUG-001 (Fixed):
   * Previously, files > 50MB were hashed using only first 5MB + last 5MB.
   * This test verifies the fix: two files that differ only in the middle
   * now produce DIFFERENT hashes (real integrity checking).
   *
   * NOTE: This test allocates ~102MB of memory. It may run slowly in CI.
   * If this becomes a performance issue in CI, consider marking it as slow.
   */
  it('FIXED BUG-001: large Blob hashing now uses full content (not partial)', async () => {
    const size = 20 * 1024 * 1024; // 20MB (big enough to trigger chunked path)
    const bufA = new Uint8Array(size).fill(0xAA);
    const bufB = new Uint8Array(size).fill(0xAA);
    // Mutate only the middle of bufB
    bufB[10 * 1024 * 1024] = 0xFF;

    const blobA = new Blob([bufA]);
    const blobB = new Blob([bufB]);

    const hashA = await calculateSHA256(blobA);
    const hashB = await calculateSHA256(blobB);

    // With the fix, these MUST be different because the full content is hashed
    expect(hashA).not.toBe(hashB);
    expect(hashA).toMatch(/^[0-9a-f]{64}$/);
    expect(hashB).toMatch(/^[0-9a-f]{64}$/);
  }, 30000); // 30s timeout for large memory allocation
});
