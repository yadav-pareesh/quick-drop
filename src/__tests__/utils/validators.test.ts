import { describe, it, expect } from 'vitest';
import { sanitizeFilename, isValidRoomCode, normalizeRoomCode } from '../../utils/validators';

describe('sanitizeFilename', () => {
  it('passes through a normal filename unchanged', () => {
    expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
  });

  it('removes path traversal sequences', () => {
    // '/' is replaced with '_', '.' is allowed
    expect(sanitizeFilename('../secret.txt')).toBe('.._secret.txt');
    // Multiple traversal components
    expect(sanitizeFilename('../../etc/passwd')).toContain('_');
    expect(sanitizeFilename('../../etc/passwd')).not.toContain('/');
  });

  it('replaces backslashes with underscores', () => {
    expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
  });

  it('removes forbidden characters', () => {
    expect(sanitizeFilename('<script>alert(1)</script>.txt')).not.toContain('<');
    expect(sanitizeFilename('<script>alert(1)</script>.txt')).not.toContain('>');
  });

  it('removes null bytes and control characters', () => {
    const withNull = 'file\x00name.txt';
    expect(sanitizeFilename(withNull)).not.toContain('\x00');
  });

  it('falls back to "unnamed_file" for empty or whitespace-only strings', () => {
    expect(sanitizeFilename('')).toBe('unnamed_file');
    expect(sanitizeFilename('   ')).toBe('unnamed_file');
  });

  it('preserves unicode filenames without stripping them', () => {
    const result = sanitizeFilename('हिंदी.pdf');
    expect(result).toBe('हिंदी.pdf');
  });

  it('handles filenames with multiple dots', () => {
    expect(sanitizeFilename('file.with.multiple.dots.pdf')).toBe('file.with.multiple.dots.pdf');
  });

  it('handles XSS payload in filename', () => {
    const xss = '<img src=x onerror=alert(1)>.jpg';
    const result = sanitizeFilename(xss);
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });
});

describe('isValidRoomCode', () => {
  it('accepts a valid code', () => {
    expect(isValidRoomCode('QK-AB12')).toBe(true);
  });

  it('accepts lowercase (regex is case-insensitive)', () => {
    expect(isValidRoomCode('qk-ab12')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidRoomCode('')).toBe(false);
  });

  it('rejects code without QK prefix', () => {
    expect(isValidRoomCode('AB12')).toBe(false);
  });

  it('rejects code that is too short', () => {
    expect(isValidRoomCode('QK-AB')).toBe(false);
  });

  it('rejects code that is too long', () => {
    expect(isValidRoomCode('QK-ABCDEFG')).toBe(false);
  });

  it('rejects code with special characters', () => {
    expect(isValidRoomCode('QK-<script>')).toBe(false);
  });
});

describe('normalizeRoomCode', () => {
  it('trims whitespace', () => {
    expect(normalizeRoomCode('  QK-AB12  ')).toBe('QK-AB12');
  });

  it('converts to uppercase', () => {
    expect(normalizeRoomCode('qk-ab12')).toBe('QK-AB12');
  });

  it('prepends QK- if missing', () => {
    const result = normalizeRoomCode('AB12');
    expect(result).toContain('QK-');
  });

  it('inserts dash when QK is missing hyphen', () => {
    const result = normalizeRoomCode('QKAB12');
    expect(result).toBe('QK-AB12');
  });

  it('handles empty string without crashing', () => {
    const result = normalizeRoomCode('');
    expect(typeof result).toBe('string');
  });
});
