import { defineConfig, type Plugin } from 'vitest/config';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { WebSocketServer, WebSocket } from 'ws';
import os from 'os';

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function quickdropSignalingPlugin(): Plugin {
  return {
    name: 'quickdrop-signaling',
    configureServer(server) {
      // 1. API endpoint to return local network IP and port
      server.middlewares.use('/api/network-ip', (_req, res) => {
        const ip = getLocalIp();
        const port = server.config.server.port || 5173;
        const isHttps = !!server.config.server.https;
        const protocol = isHttps ? 'https' : 'http';
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({ ip, port, protocol, url: `${protocol}://${ip}:${port}` }));
      });

      // 2. Embedded WebSocket Signaling Server
      if (!server.httpServer) return;
      const wss = new WebSocketServer({ noServer: true });
      const rooms = new Map<string, Set<WebSocket>>();

      server.httpServer.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
        if (url.pathname === '/quickdrop-ws') {
          wss.handleUpgrade(req, socket, head, (ws) => {
            wss.emit('connection', ws, req);
          });
        }
      });

      wss.on('connection', (ws, req: any) => {
        let currentRoom: string | null = null;

        const hostIp = getLocalIp();
        let clientIp = req?.socket?.remoteAddress || '';
        if (clientIp.startsWith('::ffff:')) clientIp = clientIp.substring(7);
        if (clientIp === '::1' || clientIp === '127.0.0.1' || !clientIp) clientIp = hostIp;

        ws.on('message', (raw) => {
          try {
            let rawStr = raw.toString();
            // Automatically unmask mDNS .local addresses to real sender LAN IP for direct WiFi connectivity
            if (rawStr.includes('.local')) {
              rawStr = rawStr.replace(/[0-9a-fA-F-]+\.local/g, clientIp);
            }

            const data = JSON.parse(rawStr);
            const { roomId } = data;

            if (roomId) {
              if (currentRoom && currentRoom !== roomId && rooms.has(currentRoom)) {
                rooms.get(currentRoom)!.delete(ws);
              }
              currentRoom = roomId;

              if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
              }
              const room = rooms.get(roomId)!;
              room.add(ws);

              // Broadcast message to all other peers in the room
              for (const peer of room) {
                if (peer !== ws && peer.readyState === WebSocket.OPEN) {
                  peer.send(JSON.stringify(data));
                }
              }
            }
          } catch (err) {
            console.error('[QuickDrop Signaling Error]', err);
          }
        });

        ws.on('close', () => {
          if (currentRoom && rooms.has(currentRoom)) {
            const room = rooms.get(currentRoom)!;
            room.delete(ws);
            if (room.size === 0) {
              rooms.delete(currentRoom);
            }
          }
        });

        ws.on('error', (err) => {
          console.warn('[QuickDrop Signaling Socket Error]', err);
        });
      });
    },
  };
}

const useHttps = process.env.HTTPS === 'true';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
  },
  plugins: [
    react(),
    tailwindcss(),
    quickdropSignalingPlugin(),
    ...(useHttps ? [basicSsl()] : []),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
});
