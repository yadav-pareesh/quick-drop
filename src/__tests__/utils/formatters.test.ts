import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatSpeed,
  formatDuration,
  formatEta,
  truncateFilename,
} from '../../utils/formatters';

describe('formatBytes', () => {
  it('returns "0 B" for 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes correctly', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('formats kilobytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('formats megabytes correctly', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('formats gigabytes correctly', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('caps at TB and does not go higher (no "PB" overflow)', () => {
    const huge = 1024 * 1024 * 1024 * 1024 * 1024; // 1 PB
    // Should clamp to TB range and not crash
    const result = formatBytes(huge);
    expect(result).toContain('TB');
  });

  it('handles very small decimal values without NaN', () => {
    expect(formatBytes(1500)).not.toContain('NaN');
  });

  it('handles negative numbers without crashing', () => {
    // Edge case: negative bytes should not crash or produce NaN
    const result = formatBytes(-1);
    expect(typeof result).toBe('string');
  });
});

describe('formatSpeed', () => {
  it('returns "0 B/s" for zero speed', () => {
    expect(formatSpeed(0)).toBe('0 B/s');
  });

  it('returns "0 B/s" for negative speed', () => {
    expect(formatSpeed(-100)).toBe('0 B/s');
  });

  it('returns "0 B/s" for Infinity', () => {
    expect(formatSpeed(Infinity)).toBe('0 B/s');
  });

  it('returns "0 B/s" for NaN', () => {
    expect(formatSpeed(NaN)).toBe('0 B/s');
  });

  it('formats MB/s correctly', () => {
    expect(formatSpeed(1024 * 1024)).toBe('1 MB/s');
  });
});

describe('formatDuration', () => {
  it('returns "0s" for 0 seconds', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('returns "0s" for negative seconds', () => {
    expect(formatDuration(-5)).toBe('0s');
  });

  it('formats seconds under 60', () => {
    expect(formatDuration(30)).toBe('30s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(90)).toBe('1m 30s');
  });

  it('handles Infinity gracefully', () => {
    expect(formatDuration(Infinity)).toBe('0s');
  });

  it('handles NaN gracefully', () => {
    expect(formatDuration(NaN)).toBe('0s');
  });
});

describe('formatEta is alias for formatDuration', () => {
  it('equals formatDuration output', () => {
    expect(formatEta(90)).toBe(formatDuration(90));
  });
});

describe('truncateFilename', () => {
  it('returns unchanged filename if within limit', () => {
    expect(truncateFilename('short.txt')).toBe('short.txt');
  });

  it('truncates long filenames preserving extension', () => {
    const name = 'a-very-long-document-filename-that-exceeds-limit.pdf';
    const result = truncateFilename(name, 24);
    expect(result.length).toBeLessThanOrEqual(24);
    expect(result.endsWith('.pdf')).toBe(true);
    expect(result).toContain('...');
  });

  it('handles filename with no extension', () => {
    const name = 'a-long-filename-with-no-extension-at-all-here';
    const result = truncateFilename(name, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toContain('...');
  });

  it('handles empty string', () => {
    const result = truncateFilename('', 24);
    expect(typeof result).toBe('string');
  });

  it('handles unicode filenames', () => {
    const name = 'हिंदी-document-very-long-name.pdf';
    const result = truncateFilename(name, 20);
    expect(typeof result).toBe('string');
  });
});
