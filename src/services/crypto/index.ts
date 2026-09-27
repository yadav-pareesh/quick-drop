export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters like O, 0, 1, I
  let randomPart = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(4);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 4; i++) {
      randomPart += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 4; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return `QK-${randomPart}`;
}

export function generateRandomId(prefix = 'id'): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
}

export async function calculateSHA256(data: ArrayBuffer | Blob): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return 'sha256-unsupported';
  }

  try {
    let buffer: ArrayBuffer;
    if (data instanceof Blob) {
      // For large files over 50MB, hash first 5MB + last 5MB + size to prevent freezing the UI thread
      if (data.size > 50 * 1024 * 1024) {
        const slice1 = await data.slice(0, 5 * 1024 * 1024).arrayBuffer();
        const slice2 = await data.slice(data.size - 5 * 1024 * 1024).arrayBuffer();
        const combined = new Uint8Array(slice1.byteLength + slice2.byteLength);
        combined.set(new Uint8Array(slice1), 0);
        combined.set(new Uint8Array(slice2), slice1.byteLength);
        buffer = combined.buffer;
      } else {
        buffer = await data.arrayBuffer();
      }
    } else {
      buffer = data;
    }

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Failed to calculate SHA-256 checksum:', error);
    return 'checksum-error';
  }
}
