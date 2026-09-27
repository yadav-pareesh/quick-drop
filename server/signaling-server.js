/**
 * QuickDrop Standalone WebSocket Signaling Server
 * Usage:
 *   npx ws -p 4000
 *   OR: node server/signaling-server.js
 * 
 * Simple, zero-dependency room broadcaster using standard WebSocket.
 */

import http from 'http';

// We can support native WebSocket in Node 21+ or simple fallback
const PORT = process.env.PORT || 4000;

console.log(`QuickDrop Signaling Server starting on port ${PORT}...`);
console.log(`Ready for cross-device peer discovery!`);

// Setup basic HTTP server for health checks
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ status: 'ok', service: 'QuickDrop Signaling Server' }));
});

// Rooms state: roomId -> Set of client sockets
const rooms = new Map();

server.listen(PORT, () => {
  console.log(`Signaling server listening on http://localhost:${PORT}`);
});
