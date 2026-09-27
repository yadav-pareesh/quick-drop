/**
 * Binary Packet Framing for Multiplexed WebRTC RTCDataChannel Chunk Streaming
 *
 * Allows multiple simultaneous file transfers in both directions over a single RTCDataChannel.
 * Format:
 * [Magic: 1 byte (0x43 'C')]
 * [TransferId Length: 1 byte (uint8)]
 * [TransferId: UTF-8 bytes]
 * [Chunk Index: 4 bytes (uint32 BE)]
 * [Binary Chunk Data: remaining bytes]
 */

const CHUNK_MAGIC = 0x43; // 'C'

export function encodeChunkPacket(transferId: string, chunkIndex: number, chunkData: ArrayBuffer): ArrayBuffer {
  const encoder = new TextEncoder();
  const idBytes = encoder.encode(transferId);
  const totalLength = 1 + 1 + idBytes.byteLength + 4 + chunkData.byteLength;
  const packet = new Uint8Array(totalLength);
  const view = new DataView(packet.buffer);

  let offset = 0;
  packet[offset++] = CHUNK_MAGIC;
  packet[offset++] = idBytes.byteLength;
  packet.set(idBytes, offset);
  offset += idBytes.byteLength;

  view.setUint32(offset, chunkIndex, false);
  offset += 4;

  packet.set(new Uint8Array(chunkData), offset);

  return packet.buffer;
}

export function decodeChunkPacket(buffer: ArrayBuffer): {
  transferId: string;
  chunkIndex: number;
  data: Uint8Array;
} | null {
  if (buffer.byteLength < 6) return null;

  const view = new DataView(buffer);
  const magic = view.getUint8(0);
  if (magic !== CHUNK_MAGIC) return null;

  const idLen = view.getUint8(1);
  if (buffer.byteLength < 2 + idLen + 4) return null;

  const idBytes = new Uint8Array(buffer, 2, idLen);
  const transferId = new TextDecoder().decode(idBytes);
  const chunkIndex = view.getUint32(2 + idLen, false);
  const data = new Uint8Array(buffer, 2 + idLen + 4);

  return { transferId, chunkIndex, data };
}
