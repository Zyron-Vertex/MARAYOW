/* ============================================================
 * game.js — 第 1 课：把素材和关卡变成一个能玩的小游戏
 * 核心循环：读取输入 -> 更新世界 -> 绘制画面
 * ============================================================ */
'use strict';

// Canvas 的内部尺寸是 256x240，浏览器会把它放大显示。
const canvas = document.getElementById('screen');
canvas.width = 256;
canvas.height = 240;
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const VIEW_W = 256, VIEW_H = 240, TILE = 16;

const keys = Object.create(null);
let jumpQueued = false;
let mode = 'title'; // title / playing / paused / dead / clear
let level, player, cameraX = 0, score = 0, coins = 0, lives = 3;
let lastTime = 0;
let particles = [];

function startGame() {
  level = buildLevel();
  player = { x: 32, y: 160, w: 12, h: 16, vx: 0, vy: 0, grounded: false, facing: 1, frame: 0 };
  cameraX = 0; score = 0; coins = 0; lives = 3; particles = []; mode = 'playing';
  SFX.unlock();
  SFX.playBgm('overworld');
}

// 键盘事件只记录按键状态；每帧的游戏更新再读取它们。
window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft','arrowright','arrowup',' ','arrowdown'].includes(key)) event.preventDefault();
  if (!keys[key] && ['z',' ','arrowup','w'].includes(key)) jumpQueued = true;
  keys[key] = true;
  if (key === 'enter' && !event.target.closest('#onlinePanel') && mode !== 'playing' && mode !== 'paused') startGame();
  if (key === 'p' && (mode === 'playing' || mode === 'paused')) {
    mode = mode === 'playing' ? 'paused' : 'playing';
    if (mode === 'paused') SFX.stopBgm(); else SFX.playBgm('overworld');
  }
});
window.addEventListener('keyup', (event) => { keys[event.key.toLowerCase()] = false; });

// 触屏按钮复用同一套输入状态，所以移动规则不需要写两份。
function bindTouch(id, key) {
  const button = document.getElementById(id);
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    if (!keys[key] && key === ' ') jumpQueued = true;
    keys[key] = true;
  });
  const release = () => { keys[key] = false; };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}
bindTouch('tLeft', 'arrowleft'); bindTouch('tRight', 'arrowright');
bindTouch('tJump', ' '); bindTouch('tRun', 'shift');

document.getElementById('onlinePanel').addEventListener('submit', async (event) => {
  event.preventDefault();
  const room = document.getElementById('roomCode').value;
  try {
    await Netplay.connect(room);
    startGame();
  } catch (error) {
    console.info(error.message);
  }
});

function isSolidTile(tx, ty) {
  if (tx < 0 || tx >= level.w || ty < 0) return true;
  if (ty >= level.h) return false; // 地图底部之外是坑，会导致角色掉落
  return level.tiles[ty * level.w + tx] !== 0;
}
function tileTypeAt(tx, ty) {
  if (tx < 0 || tx >= level.w || ty < 0 || ty >= level.h) return 0;
  return level.tileType[ty * level.w + tx];
}
function boxHitsSolid(x, y, w, h) {
  const left = Math.floor(x / TILE), right = Math.floor((x + w - 1) / TILE);
  const top = Math.floor(y / TILE), bottom = Math.floor((y + h - 1) / TILE);
  for (let ty = top; ty <= bottom; ty++) for (let tx = left; tx <= right; tx++) {
    if (isSolidTile(tx, ty)) return { tx, ty };
  }
  return null;
}

function update(dt) {
  if (mode !== 'playing') return;
  updateParticles(dt);
  const p = player;
  const left = keys.arrowleft || keys.a;
  const right = keys.arrowright || keys.d;
  const run = keys.x || keys.shift;
  const maxSpeed = run ? 150 : 105;
  const acceleration = 900;

  if (left !== right) {
    p.vx += (right ? 1 : -1) * acceleration * dt;
    p.vx = Math.max(-maxSpeed, Math.min(maxSpeed, p.vx));
    p.facing = right ? 1 : -1;
  } else {
    p.vx *= Math.max(0, 1 - 10 * dt); // 松开方向键后逐渐减速
    if (Math.abs(p.vx) < 4) p.vx = 0;
  }

  if (jumpQueued && p.grounded) {
    p.vy = -290; p.grounded = false; SFX.jump();
  }
  jumpQueued = false;

  // 水平碰撞：先移动，再把角色贴回墙/砖块边缘。
  p.x += p.vx * dt;
  let hit = boxHitsSolid(p.x, p.y, p.w, p.h);
  if (hit) {
    if (p.vx > 0) p.x = hit.tx * TILE - p.w;
    else if (p.vx < 0) p.x = (hit.tx + 1) * TILE;
    p.vx = 0;
  }

  // 垂直碰撞：向下落到地面，向上撞到方块底部。
  p.vy += 780 * dt;
  p.y += p.vy * dt;
  p.grounded = false;
  // 垂直检测额外向脚下探 1 像素，能确认落地；水平检测不包含脚下格子，
  // 否则地面会被误判成侧面的墙，把角色横向推开。
  hit = boxHitsSolid(p.x, p.y, p.w, p.h + 1);
  if (hit) {
    if (p.vy > 0) { p.y = hit.ty * TILE - p.h; p.grounded = true; }
    else {
      p.y = (hit.ty + 1) * TILE;
      const kind = tileTypeAt(hit.tx, hit.ty);
      if (kind === T_QUESTION || kind === T_BRICK) bumpBlock(hit.tx, hit.ty);
    }
    p.vy = 0;
  }

  // 收集地图上的金币。金币位置以瓦片坐标保存，角色用像素坐标移动。
  level.coins = level.coins.filter((coin) => {
    const cx = coin.x * TILE + 8, cy = coin.y * TILE + 8;
    if (Math.abs((p.x + p.w / 2) - cx) < 12 && Math.abs((p.y + p.h / 2) - cy) < 15) {
      coins++; score += 200; SFX.coin(); burst(cx, cy, '#fff080'); return false;
    }
    return true;
  });

  // 镜头跟随角色，但不会滚出关卡两端。
  cameraX = Math.max(0, Math.min(level.w * TILE - VIEW_W, p.x - 92));
  Netplay.sendPosition(p);
  if (p.y > VIEW_H + 30) {
    lives--; SFX.stopBgm();
    mode = lives > 0 ? 'dead' : 'gameover';
  }
  if (p.x > level.poleCol * TILE) { mode = 'clear'; SFX.stopBgm(); SFX.playBgm('clear'); }
  p.frame += dt * Math.abs(p.vx) * 0.08;
}

function bumpBlock(tx, ty) {
  const key = tx + ',' + ty;
  const index = ty * level.w + tx;
  if (level.tileType[index] === T_QUESTION) {
    const kind = level.qKind.get(key) || 'coin';
    level.tileType[index] = T_USED;
    if (kind === 'coin') { coins++; score += 200; SFX.coin(); burst(tx * TILE + 8, ty * TILE, '#fff080'); }
    else { score += kind === 'oneup' ? 1000 : 500; SFX.powerAppear(); }
  } else if (level.brickCoin.has(key)) {
    level.brickCoin.delete(key); coins++; score += 200; SFX.coin(); burst(tx * TILE + 8, ty * TILE, '#fff080');
  } else SFX.bump();
}

function draw() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#5c94fc'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (!level) { drawTitleScene(); return; }

  // 裝饰层先画，地形后画，形成简单的前后遮挡关系。
  for (const deco of level.decos) {
    // 远处的云移动得慢，近处的山移动得快，形成视差层次。
    const parallax = deco.type === 'cloud' ? 0.28 : deco.type === 'hill' ? 0.68 : 1;
    const x = Math.round(deco.x - cameraX * parallax);
    if (x < -64 || x > VIEW_W + 64) continue;
    const sprite = deco.type === 'cloud' ? SPR.cloud : deco.type === 'bush' ? SPR.bush : SPR.hillBig;
    const y = deco.type === 'hill' ? deco.y : deco.y;
    ctx.drawImage(sprite, x, y);
  }

  const firstCol = Math.max(0, Math.floor(cameraX / TILE));
  const lastCol = Math.min(level.w - 1, firstCol + 18);
  for (let ty = 0; ty < level.h; ty++) for (let tx = firstCol; tx <= lastCol; tx++) {
    const type = level.tileType[ty * level.w + tx];
    if (!type) continue;
    const image = [null, SPR.tiles.groundTop, SPR.tiles.groundBody, SPR.tiles.brick,
      SPR.tiles.question, SPR.tiles.used, SPR.tiles.solid, SPR.tiles.pipeTL,
      SPR.tiles.pipeTR, SPR.tiles.pipeBL, SPR.tiles.pipeBR][type];
    if (image) ctx.drawImage(image, tx * TILE - cameraX, ty * TILE);
  }
  const coinBob = Math.sin(performance.now() / 180) * 1.5;
  for (const coin of level.coins) ctx.drawImage(SPR.coin, coin.x * TILE - cameraX, coin.y * TILE + coinBob);
  drawFlagAndCastle();
  drawRemotePlayers();
  drawPlayer();
  drawParticles();
  drawHud();

  if (mode === 'paused') drawOverlay('暂停', '按 P 继续');
  if (mode === 'dead') drawOverlay('掉进坑里了', '按 Enter 重新开始');
  if (mode === 'gameover') drawOverlay('GAME OVER', '按 Enter 再试一次');
  if (mode === 'clear') drawOverlay('关卡完成！', '按 Enter 再玩一次');
}

function drawPlayer() {
  const p = player;
  const frames = SPR.mSmall;
  const image = !p.grounded ? frames.jump : Math.abs(p.vx) > 20 ?
    (Math.floor(p.frame) % 2 ? frames.runA : frames.runB) : frames.idle;
  ctx.save();
  if (p.facing < 0) { ctx.translate(Math.round(p.x - cameraX) + p.w, 0); ctx.scale(-1, 1); ctx.drawImage(image, 0, Math.round(p.y)); }
  else ctx.drawImage(image, Math.round(p.x - cameraX), Math.round(p.y));
  ctx.restore();
}

function drawRemotePlayers() {
  const peers = Array.from(Netplay.getPlayers().values());
  peers.forEach((peer, index) => {
    if (peer.x < cameraX - 24 || peer.x > cameraX + VIEW_W + 24) return;
    const x = Math.round(peer.x - cameraX), y = Math.round(peer.y);
    ctx.save(); ctx.globalAlpha = 0.8;
    if (peer.facing < 0) { ctx.translate(x + 12, 0); ctx.scale(-1, 1); ctx.drawImage(SPR.mSmall.idle, 0, y); }
    else ctx.drawImage(SPR.mSmall.idle, x, y);
    ctx.restore();
    ctx.fillStyle = '#192452'; ctx.fillRect(x - 2, y - 10, 30, 9);
    ctx.fillStyle = '#fff'; ctx.font = '6px monospace';
    ctx.fillText('P' + (index + 2), x, y - 9);
  });
}

function drawFlagAndCastle() {
  const poleX = level.poleCol * TILE - cameraX;
  if (poleX > -16 && poleX < VIEW_W + 16) {
    ctx.drawImage(SPR.flagPole, poleX, level.groundY - 112);
    ctx.drawImage(SPR.flagBanner, poleX - 28, level.groundY - 104);
  }
  const castleX = level.castleX - cameraX;
  if (castleX > -120 && castleX < VIEW_W + 20) ctx.drawImage(SPR.castle, castleX, level.groundY - 96);
}

function drawHud() {
  ctx.fillStyle = 'rgba(24, 32, 72, .84)'; ctx.fillRect(8, 6, 240, 28);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(8.5, 6.5, 239, 27);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 7px monospace'; ctx.textBaseline = 'top';
  ctx.fillText('MARIO', 16, 10); ctx.fillText('SCORE', 16, 21);
  ctx.font = '8px monospace'; ctx.fillText(String(score).padStart(6, '0'), 48, 20);
  ctx.fillStyle = '#ffe36a'; ctx.fillText('COIN', 112, 10); ctx.fillText('× ' + String(coins).padStart(2, '0'), 112, 20);
  ctx.fillStyle = '#fff'; ctx.fillText('WORLD', 168, 10); ctx.fillText('1 - 1', 168, 20);
  ctx.fillText('♥ ' + lives, 218, 16);
}

function drawTitleScene() {
  const t = performance.now() / 1000;
  // 标题画面用分层色块构成天空、远山、草地和城堡。
  ctx.fillStyle = '#5c94fc'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, 42, VIEW_W, 2);
  for (let i = 0; i < 3; i++) {
    const x = ((i * 112 - t * (5 + i * 2)) % 300 + 300) % 300 - 24;
    ctx.drawImage(SPR.cloud, x, 48 + (i % 2) * 20);
  }
  ctx.drawImage(SPR.hillBig, 12, 147); ctx.drawImage(SPR.hillBig, 174, 151);
  ctx.fillStyle = '#42c242'; ctx.fillRect(0, 184, VIEW_W, 8);
  ctx.fillStyle = '#b87838'; ctx.fillRect(0, 192, VIEW_W, 48);
  for (let x = 0; x < VIEW_W; x += TILE) ctx.drawImage(SPR.tiles.groundBody, x, 192);
  ctx.drawImage(SPR.castle, 179, 99);
  const logo = SPR.font('MARIO', '#e52521', 3);
  ctx.drawImage(logo, (VIEW_W - logo.width) / 2, 20);
  ctx.drawImage(SPR.mSmall.idle, 119, 145);
  ctx.fillStyle = 'rgba(24,32,72,.9)'; ctx.fillRect(34, 78, 188, 46);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(35, 79, 186, 44);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 9px monospace'; ctx.fillText('PIXEL PLATFORM ADVENTURE', 128, 94);
  ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ffe36a' : '#fff';
  ctx.font = '9px monospace'; ctx.fillText('按 ENTER 开始', 128, 111);
  ctx.textAlign = 'left';
}

function burst(x, y, color) {
  for (let i = 0; i < 7; i++) {
    const angle = (Math.PI * 2 * i) / 7;
    const speed = 24 + (i % 3) * 12;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 18, life: .34, color });
  }
}
function updateParticles(dt) {
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 100 * dt; p.life -= dt; }
}
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / .34);
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x - cameraX), Math.round(p.y), 2, 2);
  }
  ctx.globalAlpha = 1;
}

function drawOverlay(title, subtitle) {
  ctx.fillStyle = 'rgba(0,0,0,.58)'; ctx.fillRect(24, 76, 208, 88);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 16px monospace'; ctx.fillText(title, VIEW_W / 2, 104);
  ctx.font = '9px monospace'; ctx.fillText(subtitle, VIEW_W / 2, 132);
  ctx.textAlign = 'left';
}

function frame(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0, 1 / 30); // 限制单帧时间，避免切回页面后穿地
  lastTime = timestamp;
  update(dt); draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
