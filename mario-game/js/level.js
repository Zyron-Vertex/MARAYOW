/* ============================================================
 * level.js — 1-1 风格关卡数据构建
 * tile 坐标: x:0..WW-1, y:0..14 (240px 高)
 * 地面顶行 = row 12 (y=192px)
 * 瓦片类型: 0空 1地面顶 2地面体 3砖 4问号 5已用 6硬块
 *          7管TL 8管TR 9管BL 10管BR
 * ============================================================ */
'use strict';
const T_EMPTY=0, T_GROUND_TOP=1, T_GROUND_BODY=2, T_BRICK=3, T_QUESTION=4, T_USED=5, T_SOLID=6,
      T_PTL=7, T_PTR=8, T_PBL=9, T_PBR=10;

function buildLevel() {
  const WW = 214, HH = 15, GROUND = 12;   // 地面表面行
  const tiles  = new Uint8Array(WW * HH); // 1=实心
  const tileType = new Uint8Array(WW * HH);
  const coins = [];      // 静态金币 {x,y} tile
  const spawns = [];     // 敌人/管道怪出生点
  const decos = [];
  const brickCoin = new Map();   // "x,y" -> true 砖内含金币
  const qKind = new Map();       // "x,y" -> 'coin'|'power'|'oneup'

  function set(x, y, t) {
    if (x < 0 || x >= WW || y < 0 || y >= HH) return;
    tiles[y * WW + x] = 1;
    tileType[y * WW + x] = t;
  }
  function flat(x0, x1) {
    for (let x = x0; x <= x1; x++) {
      set(x, GROUND, T_GROUND_TOP);
      for (let y = GROUND + 1; y < HH; y++) set(x, y, T_GROUND_BODY);
    }
  }
  function pit(x0, x1) {
    for (let x = x0; x <= x1; x++)
      for (let y = 0; y < HH; y++) { tiles[y * WW + x] = 0; tileType[y * WW + x] = 0; }
  }
  function brick(x, y, hasCoin) {
    set(x, y, T_BRICK);
    if (hasCoin) brickCoin.set(x + ',' + y, true);
  }
  function qblock(x, y, kind) {
    set(x, y, T_QUESTION);
    qKind.set(x + ',' + y, kind || 'coin');
  }
  function blockRow(x0, x1, y) { for (let x = x0; x <= x1; x++) brick(x, y, false); }
  /* 阶梯式硬块, 每列升高可跳上 */
  function stairs(x0, h0, n) {   // 从 x0 起 n 列, 高度从 h0 递增到 h0+n-1
    for (let i = 0; i < n; i++) {
      const h = h0 + i, x = x0 + i;
      for (let y = GROUND - h; y < HH; y++) set(x, y, T_SOLID);
    }
  }
  function pedestal(x, h) { // 单独立柱 2 列宽
    for (let i = 0; i < 2; i++) {
      for (let y = GROUND - h; y < HH; y++) set(x + i, y, T_SOLID);
    }
  }
  function pipe(x, topY, piranha) {
    set(x, topY, T_PTL); set(x + 1, topY, T_PTR);
    for (let y = topY + 1; y <= GROUND; y++) { set(x, y, T_PBL); set(x + 1, y, T_PBR); }
    if (piranha) spawns.push({ type: 'piranha', tx: x, tyRow: topY });
  }
  function coinRow(x0, x1, y) { for (let x = x0; x <= x1; x++) coins.push({ x, y }); }
  function coinArc(x0, x1, yBase) {
    const n = x1 - x0 + 1;
    for (let i = 0; i < n; i++) {
      const off = Math.abs(i - (n - 1) / 2);
      coins.push({ x: x0 + i, y: yBase - Math.max(0, Math.ceil(n / 2) - 1 - off) });
    }
  }
  function enemy(type, tx, ty) { spawns.push({ type, tx, ty: ty == null ? GROUND : ty }); }

  /* ================= 关卡布局 ================= */
  flat(0, 213);

  /* —— 开场 0..43 —— */
  qblock(15, 9, 'coin');
  brick(19, 9, true);
  qblock(22, 9, 'coin');
  coinArc(24, 28, 8);
  enemy('goomba', 27);
  pipe(33, 10, false);
  enemy('goomba', 36);
  qblock(39, 9, 'power');
  brick(41, 9, true); brick(42, 9, false);
  pit(44, 46);

  /* —— 教学阶梯 47..60 —— */
  stairs(50, 1, 5);          // 50..54 高 1..5
  coinRow(51, 53, 7);
  qblock(53, 4, 'coin');
  pit(55, 57);
  coinArc(55, 57, 5);
  enemy('koopa', 60);
  brick(59, 9, false);

  /* —— 砖阵 + 敌群 61..75 —— */
  blockRow(61, 65, 9);
  brick(62, 9, true); brick(64, 9, true);
  enemy('goomba', 64);
  qblock(67, 9, 'coin');
  enemy('goomba', 68);
  coinArc(70, 72, 8);
  pit(71, 73);

  /* —— 双管夹坑经典区 74..87 —— */
  pipe(75, 10, false);
  pipe(80, 8, true);          // 高4食人花管
  pit(77, 79);
  qblock(78, 8, 'coin');
  coinRow(77, 79, 6);
  enemy('goomba', 82);
  stairs(84, 1, 4);           // 84..87 高1..4 登顶
  qblock(85, 5, 'coin');
  pit(88, 88);
  enemy('koopa', 90);
  coinArc(88, 90, 6);

  /* —— 高台砖塔 91..114 —— */
  pedestal(93, 1);  pedestal(96, 2);
  blockRow(98, 102, 9);
  brick(99, 9, true); qblock(100, 9, 'coin'); brick(101, 9, true);
  enemy('goomba', 104);
  pedestal(106, 3);
  qblock(106, 8, 'power');
  enemy('goomba', 109);
  brick(111, 9, true); qblock(112, 9, 'coin');
  pit(113, 115);
  coinArc(113, 115, 6);
  enemy('koopa', 117);

  /* —— 开阔+长砖顶 118..140 —— */
  blockRow(120, 126, 9);
  brick(121, 9, true); qblock(122, 9, 'coin'); brick(123, 9, true); brick(125, 9, true);
  enemy('goomba', 121);
  enemy('goomba', 125);
  coinRow(124, 125, 7);
  enemy('koopa', 129);
  qblock(132, 9, 'power');
  enemy('goomba', 133);
  brick(135, 9, false); qblock(136, 9, 'coin');
  pit(138, 140);
  coinArc(138, 140, 6);

  /* —— 高台跨越 141..162 —— */
  enemy('goomba', 142);
  stairs(144, 1, 5);         // 144..148
  brick(145, 7, true); qblock(146, 6, 'coin');
  pit(149, 150);
  enemy('koopa', 152);
  coinArc(149, 151, 6);
  blockRow(154, 157, 9);
  brick(155, 9, true);
  enemy('goomba', 155);
  enemy('goomba', 158);
  qblock(160, 9, 'power');
  qblock(161, 7, 'oneup');    // 砖行上方隐藏1UP

  /* —— 终点前: 长砖走廊 + 大楼梯 163..189 —— */
  brick(163, 9, false); qblock(164, 9, 'coin'); brick(165, 9, true);
  enemy('goomba', 166);
  stairs(170, 1, 8);         // 170..177 高1..8 大楼梯
  coinArc(172, 176, 5);
  brick(173, 7, true);
  enemy('koopa', 179);
  qblock(178, 4, 'coin');
  brick(179, 9, false); brick(180, 9, true);

  /* —— 旗杆 & 城堡区 190..213 —— */
  enemy('goomba', 184);
  enemy('goomba', 186);
  pit(200, 213);

  /* 装饰 */
  const cloudX = [12, 40, 66, 95, 122, 150, 168, 196];
  cloudX.forEach((cx, i) => decos.push({ type: 'cloud', x: cx * 16, y: (i % 2) * 16 + 24 }));
  const hillX = [18, 58, 104, 158, 194];
  hillX.forEach(hx => decos.push({ type: 'hill', x: hx * 16, y: GROUND * 16 - 36 }));
  const bushX = [6, 30, 49, 70, 92, 130, 147, 175, 190];
  bushX.forEach(bx => decos.push({ type: 'bush', x: bx * 16, y: GROUND * 16 - 16 }));

  return {
    w: WW, h: HH, ground: GROUND, tiles, tileType,
    brickCoin, qKind, coins, spawns, decos,
    poleCol: 188,          // 旗杆所在列
    castleX: 196 * 16,     // 城堡贴图左缘像素 x
    groundY: GROUND * 16
  };
}
