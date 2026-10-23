/* ============================================================
 * network.js — 联机入门：连接房间并同步玩家位置
 * WebSocket 让浏览器和 Node.js 服务器保持长连接。
 * ============================================================ */
'use strict';

const Netplay = (function () {
  let socket = null;
  let myId = null;
  const players = new Map();
  let lastSentAt = 0;

  function setStatus(message, connected) {
    const status = document.getElementById('onlineStatus');
    status.textContent = message;
    status.style.color = connected ? '#a8ff9e' : '#ffe36a';
  }

  function connect(room) {
    if (location.protocol === 'file:') {
      setStatus('请先启动本地服务器', false);
      return Promise.reject(new Error('WebSocket 需要通过 HTTP 服务器运行游戏。'));
    }
    disconnect(false);
    const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const roomName = room.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16) || 'WORLD1';
    setStatus('正在连接…', false);

    return new Promise((resolve, reject) => {
      let connected = false;
      const currentSocket = new WebSocket(scheme + '//' + location.host + '/ws?room=' + encodeURIComponent(roomName));
      socket = currentSocket;
      currentSocket.addEventListener('open', () => {
        if (socket === currentSocket) setStatus('已连接 ' + roomName, true);
      }, { once: true });
      currentSocket.addEventListener('message', (event) => {
        if (socket !== currentSocket) return;
        let message;
        try { message = JSON.parse(event.data); } catch (_) { return; }
        if (message.type === 'welcome') {
          connected = true;
          myId = message.id; players.clear();
          for (const player of message.players) players.set(player.id, player);
          resolve(roomName);
        } else if (message.type === 'join') players.set(message.player.id, message.player);
        else if (message.type === 'move' && message.player.id !== myId) players.set(message.player.id, message.player);
        else if (message.type === 'leave') players.delete(message.id);
      });
      currentSocket.addEventListener('error', () => {
        setStatus('连接失败', false);
        if (!connected) reject(new Error('无法连接联机服务器。'));
      }, { once: true });
      currentSocket.addEventListener('close', () => {
        if (socket !== currentSocket) return;
        socket = null;
        players.clear(); myId = null;
        setStatus('已断开', false);
        if (!connected) reject(new Error('房间不可用，或人数已满。'));
      });
    });
  }

  function sendPosition(player) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const now = performance.now();
    if (now - lastSentAt < 50) return; // 每秒最多发送约 20 次位置更新
    lastSentAt = now;
    socket.send(JSON.stringify({ type: 'move', x: player.x, y: player.y, facing: player.facing }));
  }

  function disconnect(updateStatus) {
    if (socket) { socket.close(); socket = null; }
    players.clear(); myId = null;
    if (updateStatus !== false) setStatus('单机模式', false);
  }

  return { connect, sendPosition, disconnect, getPlayers: () => players, get myId() { return myId; } };
})();
