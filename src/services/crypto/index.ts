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
      // For large files, read in chunks and yield to the event loop periodically
      // to keep the UI responsive — but ALWAYS hash the FULL file.
      const CHUNK = 8 * 1024 * 1024; // 8 MB read-at-a-time

      if (data.size > CHUNK) {
        // Use an array accumulation approach: read blob in slices to avoid
        // a single massive arrayBuffer() call that can freeze the tab.
        const parts: Uint8Array[] = [];
        let offset = 0;

        while (offset < data.size) {
          const slice = data.slice(offset, offset + CHUNK);
          const sliceBuf = await slice.arrayBuffer();
          parts.push(new Uint8Array(sliceBuf));
          offset += CHUNK;

          // Yield to event loop every 32 MB to prevent UI freeze
          if (offset % (32 * 1024 * 1024) === 0) {
            await new Promise((r) => setTimeout(r, 0));
          }
        }

        // Assemble the full buffer
        const totalLength = parts.reduce((sum, p) => sum + p.byteLength, 0);
        const combined = new Uint8Array(totalLength);
        let pos = 0;
        for (const part of parts) {
          combined.set(part, pos);
          pos += part.byteLength;
        }
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
