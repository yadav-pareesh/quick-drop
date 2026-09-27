import type { FileMetadata } from '../../types';
import { sanitizeFilename } from '../../utils/validators';

export type FileCategory = 
  | 'image' 
  | 'video' 
  | 'audio' 
  | 'pdf' 
  | 'document' 
  | 'archive' 
  | 'code' 
  | 'text' 
  | 'generic';

export function getFileCategory(mimeType: string, filename: string): FileCategory {
  const lowerName = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(lowerName)) {
    return 'image';
  }
  if (lowerMime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|wmv)$/i.test(lowerName)) {
    return 'video';
  }
  if (lowerMime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(lowerName)) {
    return 'audio';
  }
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    lowerMime.includes('word') || 
    lowerMime.includes('document') || 
    lowerMime.includes('presentation') || 
    lowerMime.includes('sheet') || 
    /\.(doc|docx|ppt|pptx|xls|xlsx|pages|key|numbers|odt|ods|odp)$/i.test(lowerName)
  ) {
    return 'document';
  }
  if (
    lowerMime.includes('zip') || 
    lowerMime.includes('tar') || 
    lowerMime.includes('compressed') || 
    /\.(zip|tar|gz|rar|7z|bz2)$/i.test(lowerName)
  ) {
    return 'archive';
  }
  if (
    lowerMime.startsWith('text/') || 
    /\.(txt|md|csv|log|json|xml|yaml|yml)$/i.test(lowerName)
  ) {
    return 'text';
  }
  if (/\.(js|jsx|ts|tsx|html|css|py|rs|go|java|c|cpp|h|sh|sql)$/i.test(lowerName)) {
    return 'code';
  }
  return 'generic';
}

export async function processFileForTransfer(file: File): Promise<FileMetadata> {
  const sanitizedName = sanitizeFilename(file.name);
  const id = `file_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  
  let previewUrl: string | undefined;
  if (file.type.startsWith('image/') && file.size < 5 * 1024 * 1024) {
    try {
      previewUrl = URL.createObjectURL(file);
    } catch {}
  }

  return {
    id,
    name: sanitizedName,
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
    previewUrl,
  };
}

export function createTextFile(content: string, customName = 'shared-note.txt'): File {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  return new File([blob], customName, { type: 'text/plain;charset=utf-8' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizeFilename(filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  
  // Cleanup object URL
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10000);
}
