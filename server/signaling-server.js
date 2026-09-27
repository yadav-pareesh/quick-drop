/**
 * QuickDrop Standalone WebSocket Signaling Server
 * Usage:
 *   node server/signaling-server.js
 * 
 * Zero-dependency room broadcaster using ws for cross-device WebRTC signaling.
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 4000;

// Setup basic HTTP server for health checks
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify({ status: 'ok', service: 'QuickDrop Signaling Server' }));
});

// Rooms state: roomId -> Set of WebSocket clients
const rooms = new Map();

const wss = new WebSocketServer({ server });

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
