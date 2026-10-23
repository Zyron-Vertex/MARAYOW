/* ============================================================
 * server.js — 静态网页服务器 + WebSocket 房间位置转发
 * 这是联机学习原型：物理仍由每位玩家自己的浏览器计算。
 * ============================================================ */
'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { WebSocketServer, WebSocket } = require('ws');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const rooms = new Map();
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.ico': 'image/x-icon'
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname === '/health') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405); response.end('Method not allowed'); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch (_) { response.writeHead(400); response.end('Bad request'); return; }
  if (pathname === '/') pathname = '/index.html';
  const filename = path.resolve(ROOT, '.' + pathname);
  if (!filename.startsWith(ROOT + path.sep) && filename !== ROOT) {
    response.writeHead(403); response.end('Forbidden'); return;
  }
  fs.stat(filename, (statError, stat) => {
    if (statError || !stat.isFile()) { response.writeHead(404); response.end('Not found'); return; }
    response.writeHead(200, {
      'content-type': mimeTypes[path.extname(filename)] || 'application/octet-stream',
      'cache-control': 'no-cache'
    });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(filename).pipe(response);
  });
});

const webSockets = new WebSocketServer({ noServer: true, maxPayload: 1024 });
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, 'http://localhost');
  if (url.pathname !== '/ws') { socket.destroy(); return; }
  webSockets.handleUpgrade(request, socket, head, (ws) => webSockets.emit('connection', ws, request));
});

webSockets.on('connection', (socket, request) => {
  const url = new URL(request.url, 'http://localhost');
  const roomId = (url.searchParams.get('room') || 'WORLD1').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16) || 'WORLD1';
  let room = rooms.get(roomId);
  if (!room) { room = new Map(); rooms.set(roomId, room); }
  if (room.size >= 8) { socket.close(1013, 'Room is full'); return; }

  const player = { id: randomUUID().slice(0, 8), x: 32, y: 160, facing: 1 };
  room.set(socket, player);
  socket.send(JSON.stringify({ type: 'welcome', id: player.id, players: [...room.values()].filter((item) => item !== player) }));
  broadcast(room, { type: 'join', player }, socket);

  socket.on('message', (raw) => {
    let message;
    try { message = JSON.parse(raw.toString()); } catch (_) { return; }
    if (message.type !== 'move') return;
    if (!Number.isFinite(message.x) || !Number.isFinite(message.y) || ![-1, 1].includes(message.facing)) return;
    // 限制坐标范围，防止异常数据让其他玩家画布出现极端位置。
    player.x = Math.max(0, Math.min(4000, message.x));
    player.y = Math.max(-100, Math.min(400, message.y));
    player.facing = message.facing;
    broadcast(room, { type: 'move', player }, socket);
  });

  socket.on('close', () => {
    room.delete(socket);
    broadcast(room, { type: 'leave', id: player.id });
    if (room.size === 0) rooms.delete(roomId);
  });
});

function broadcast(room, message, except) {
  const payload = JSON.stringify(message);
  for (const [socket] of room) {
    if (socket !== except && socket.readyState === WebSocket.OPEN) socket.send(payload);
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MARAYOW is ready on port ${PORT}`);
});
