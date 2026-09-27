import { describe, it, expect } from 'vitest';
import { getFileCategory } from '../../services/file';
import { sanitizeFilename } from '../../utils/validators';

// ─── getFileCategory ──────────────────────────────────────────────────────

describe('getFileCategory', () => {
  // Images
  it('classifies JPG images', () => expect(getFileCategory('image/jpeg', 'photo.jpg')).toBe('image'));
  it('classifies PNG images', () => expect(getFileCategory('image/png', 'screenshot.png')).toBe('image'));
  it('classifies WEBP images', () => expect(getFileCategory('image/webp', 'pic.webp')).toBe('image'));
  it('classifies SVG images', () => expect(getFileCategory('image/svg+xml', 'icon.svg')).toBe('image'));

  // Videos
  it('classifies MP4 videos', () => expect(getFileCategory('video/mp4', 'movie.mp4')).toBe('video'));
  it('classifies WEBM videos', () => expect(getFileCategory('video/webm', 'clip.webm')).toBe('video'));
  it('classifies MKV by extension', () => expect(getFileCategory('', 'film.mkv')).toBe('video'));

  // Audio
  it('classifies MP3 audio', () => expect(getFileCategory('audio/mpeg', 'song.mp3')).toBe('audio'));
  it('classifies FLAC by extension', () => expect(getFileCategory('', 'track.flac')).toBe('audio'));

  // PDF
  it('classifies PDFs', () => expect(getFileCategory('application/pdf', 'report.pdf')).toBe('pdf'));
  it('classifies PDF by extension only', () => expect(getFileCategory('', 'document.pdf')).toBe('pdf'));

  // Documents
  it('classifies DOCX', () => expect(getFileCategory('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'resume.docx')).toBe('document'));
  it('classifies XLSX', () => expect(getFileCategory('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'data.xlsx')).toBe('document'));

  // Archives
  it('classifies ZIP archives', () => expect(getFileCategory('application/zip', 'archive.zip')).toBe('archive'));
  it('classifies 7z by extension', () => expect(getFileCategory('', 'backup.7z')).toBe('archive'));

  // Text / code
  it('classifies plain text', () => expect(getFileCategory('text/plain', 'notes.txt')).toBe('text'));
  it('classifies JSON', () => expect(getFileCategory('', 'config.json')).toBe('text'));
  it('classifies CSV', () => expect(getFileCategory('', 'data.csv')).toBe('text'));

  // Code
  it('classifies TypeScript files', () => expect(getFileCategory('', 'app.ts')).toBe('code'));
  it('classifies Python files', () => expect(getFileCategory('', 'script.py')).toBe('code'));

  // Generic fallback
  it('returns "generic" for unknown type', () => expect(getFileCategory('application/octet-stream', 'data.bin')).toBe('generic'));
  it('returns "generic" for empty type and unknown extension', () => expect(getFileCategory('', 'file.xyz')).toBe('generic'));
  it('handles empty filename without crashing', () => {
    expect(() => getFileCategory('', '')).not.toThrow();
  });
});

// ─── sanitizeFilename (imported from validators) ─────────────────────────

describe('sanitizeFilename strips path separators', () => {
  it('removes forward slashes from path traversal attempts', () => {
    expect(sanitizeFilename('../secret/passwd')).not.toContain('/');
  });
});
