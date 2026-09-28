/**
 * QuickDrop Standalone WebSocket Signaling Server
 * Usage:
 *   node signaling-server.js
 *
 * Zero-dependency room broadcaster using ws for cross-device WebRTC signaling.
 *
 * Origin Restriction:
 *   Set ALLOWED_ORIGINS env var to a comma-separated list of allowed frontend origins.
 *   Example: ALLOWED_ORIGINS=https://quickdrop.netlify.app,https://quickdrop.vercel.app
 *   Leave unset (or set to *) to allow all origins (useful for local dev).
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 4000;

// ─── Origin validation ────────────────────────────────────────────────────────
// Parse the ALLOWED_ORIGINS env var into a Set for O(1) lookup.
// If unset or set to "*", all origins are allowed (open mode).
const rawAllowed = process.env.ALLOWED_ORIGINS || '*';
const ALLOWED_ORIGINS =
  rawAllowed.trim() === '*'
    ? null // null = allow all
    : new Set(
        rawAllowed
          .split(',')
          .map((o) => o.trim().toLowerCase())
          .filter(Boolean)
      );

function isOriginAllowed(origin) {
  if (!ALLOWED_ORIGINS) return true;        // open mode
  if (!origin) return false;                // no Origin header → reject in restricted mode
  return ALLOWED_ORIGINS.has(origin.toLowerCase());
}

if (ALLOWED_ORIGINS) {
  console.log(`[QuickDrop] Origin restriction ENABLED. Allowed: ${[...ALLOWED_ORIGINS].join(', ')}`);
} else {
  console.log('[QuickDrop] Origin restriction DISABLED (ALLOWED_ORIGINS=*)');
}

// ─── HTTP server (health check) ───────────────────────────────────────────────
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({ status: 'ok', service: 'QuickDrop Signaling Server' }));
});

// ─── Rooms state: roomId → Set of WebSocket clients ──────────────────────────
const rooms = new Map();

// ─── WebSocket Server with origin validation ──────────────────────────────────
const wss = new WebSocketServer({
  server,
  // verifyClient fires during the HTTP→WS upgrade handshake,
  // BEFORE the connection is established. Return false to reject.
  verifyClient({ origin, req }, callback) {
    if (!isOriginAllowed(origin)) {
      console.warn(`[QuickDrop] Rejected connection from disallowed origin: "${origin}" (${req.socket.remoteAddress})`);
      // 403 status code, with a reason string shown in browser devtools
      callback(false, 403, 'Forbidden: Origin not allowed');
    } else {
      callback(true);
    }
  },
});

wss.on('connection', (ws, req) => {
  let clientRoomId = null;

  let clientIp = req?.socket?.remoteAddress || '';
  if (clientIp.startsWith('::ffff:')) clientIp = clientIp.substring(7);

  ws.on('message', (raw) => {
    try {
      let rawStr = raw.toString();
      if (rawStr.includes('.local') && clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
        rawStr = rawStr.replace(/[0-9a-fA-F-]+\.local/g, clientIp);
      }
      const msg = JSON.parse(rawStr);
      const { roomId } = msg;

      if (roomId) {
        if (clientRoomId && clientRoomId !== roomId && rooms.has(clientRoomId)) {
          rooms.get(clientRoomId)?.delete(ws);
        }
        clientRoomId = roomId;

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        const room = rooms.get(roomId);
        room.add(ws);

        // Broadcast to other peers in room
        for (const peer of room) {
          if (peer !== ws && peer.readyState === WebSocket.OPEN) {
            peer.send(JSON.stringify(msg));
          }
        }
      }
    } catch (err) {
      console.error('[Signaling Error]', err);
    }
  });

  ws.on('close', () => {
    if (clientRoomId && rooms.has(clientRoomId)) {
      const room = rooms.get(clientRoomId);
      room.delete(ws);
      if (room.size === 0) {
        rooms.delete(clientRoomId);
      }
    }
  });

  ws.on('error', (err) => {
    console.warn('[Socket Error]', err);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`QuickDrop Signaling Server listening on ws://0.0.0.0:${PORT}`);
});
