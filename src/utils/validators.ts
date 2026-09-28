import { ROOM_CODE_REGEX } from '../constants';

export function normalizeRoomCode(input: string): string {
  let cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!cleaned.startsWith('QK') && cleaned.length > 0) {
    cleaned = `QK-${cleaned}`;
  } else if (cleaned.startsWith('QK') && cleaned.length > 2 && !cleaned.includes('-')) {
    cleaned = `QK-${cleaned.slice(2)}`;
  }
  return cleaned;
}

export function isValidRoomCode(code: string): boolean {
  return ROOM_CODE_REGEX.test(code.trim());
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal and illegal control/filesystem characters
  return filename
    .replace(/[/\\]/g, '_')
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"|?*\x00-\x1F]/g, '')
    .trim() || 'unnamed_file';
}
