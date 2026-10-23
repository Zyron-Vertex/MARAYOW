/* ============================================================
 * sprites.js — 像素精灵系统 (逻辑分辨率 256x240, 显示2x => 512x480)
 * ============================================================ */
'use strict';

function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
/* 字符画 -> 像素 canvas. rows 等长字符串; pal: 字符->颜色; cell px/格 */
function paint(rows, pal, cell) {
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const s = cell || 1;
  const cv = mkCanvas(w * s, h * s);
  const g = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const col = pal[row[x]];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x * s, y * s, s, s);
    }
  }
  return cv;
}

/* ---------- 调色板 ---------- */
const M_PAL = { // 马里奥
  R: '#e52521', S: '#f8b878', H: '#7a3a00', B: '#2848c8',
  W: '#ffffff', K: '#3a1e00', Y: '#ffd800'
};
const T_PAL = { // 敌人/道具通用
  G: '#c87828', g: '#a05010', C: '#f0d8a8', W: '#ffffff', K: '#2a1600',
  R: '#e83818', r: '#b01800', E: '#38c038', L: '#7ce07c',
  Y: '#ffd800', O: '#e88028'
};

/* ---------- 5x7 像素字体 ---------- */
const FONT5x7 = {
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'B':['####.','#...#','#...#','####.','#...#','#...#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
'D':['####.','#...#','#...#','#...#','#...#','#...#','####.'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'F':['#####','#....','#....','####.','#....','#....','#....'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'H':['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
'I':['#####','..#..','..#..','..#..','..#..','..#..','#####'],
'J':['..###','...#.','...#.','...#.','...#.','#..#.','.##..'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'L':['#....','#....','#....','#....','#....','#....','#####'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'N':['#...#','##..#','#.#.#','#..##','#...#','#...#','#...#'],
'O':['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
'P':['####.','#...#','#...#','####.','#....','#....','#....'],
'Q':['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],
'R':['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'T':['#####','..#..','..#..','..#..','..#..','..#..','..#..'],
'U':['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],
'V':['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
'W':['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
'X':['#...#','#...#','.#.#.','..#..','.#.#.','#...#','#...#'],
'Y':['#...#','#...#','.#.#.','..#..','..#..','..#..','..#..'],
'Z':['#####','....#','...#.','..#..','.#...','#....','#####'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'1':['..#..','.##..','..#..','..#..','..#..','..#..','.###.'],
'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],
'3':['#####','...#.','..#..','...#.','....#','#...#','.###.'],
'4':['...#.','..##.','.#.#.','#..#.','#####','...#.','...#.'],
'5':['#####','#....','####.','....#','....#','#...#','.###.'],
'6':['..##.','.#...','#....','####.','#...#','#...#','.###.'],
'7':['#####','....#','...#.','..#..','.#...','.#...','.#...'],
'8':['.###.','#...#','#...#','.###.','#...#','#...#','.###.'],
'9':['.###.','#...#','#...#','.####','....#','...#.','.##..'],
'!':['..#..','..#..','..#..','..#..','..#..','.....','..#..'],
'.':['.....','.....','.....','.....','.....','.....','##...'],
'-':['.....','.....','.....','.###.','.....','.....','.....'],
'?':['.###.','#...#','...#.','..#..','..#..','.....','..#..'],
'(':['...#.','..#..','.#...','.#...','.#...','..#..','...#.'],
')':['.#...','..#..','...#.','...#.','...#.','..#..','.#...'],
'+':['.....','..#..','..#..','#####','..#..','..#..','.....'],
'*':['.....','#.#.#','.#.#.','#####','.#.#.','#.#.#','.....'],
'/':['....#','....#','...#.','..#..','.#...','#....','#....'],
',':['.....','.....','.....','.....','.....','..#..','.#...'],
'\'':['..#..','..#..','.....','.....','.....','.....','.....'],
' ':['.....','.....','.....','.....','.....','.....','.....'],
'×':['.....','#...#','.#.#.','..#..','.#.#.','#...#','.....']
};
function makeText(text, color, scale) {
  const s = scale || 1, cw = 5 * s, ch = 7 * s;
  const cv = mkCanvas(cw * text.length, ch);
  const g = cv.getContext('2d');
  for (let i = 0; i < text.length; i++) {
    const chg = FONT5x7[text[i].toUpperCase()] || FONT5x7[' '];
    const tmp = paint(chg, { '#': color || '#fff' }, 1);
    g.drawImage(tmp, i * cw, 0);
  }
  return cv;
}

/* ================= 瓦片 (16x16) ================= */
function tileGroundTop() {
  return paint([
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'DDDDDDDDDDDDDDDD',
    'BBBBBBBBBBBBBBBB',
    'BBDBBDBBDBBDBBDB',
    'DBBDBBDBBDBBDBBD',
    'BBBBBBBBBBBBBBBB',
    'DBBDBBDBBDBBDBBD',
    'BDBBDBBDBBDBBDBB',
    'BBBBBBBBBBBBBBBB',
    'BDBBDBBDBBDBBDBB',
    'DBBDDBBDDBBDDBBD',
    'BBBBBBBBBBBBBBBB',
    'DDBBDDBBDDBBDDBB',
    'BBBBBBBBBBBBBBBB'
  ], { G: '#42c242', D: '#e0a860', B: '#b87838' });
}
function tileGroundBody() {
  return paint([
    'DDDDDDDDDDDDDDDD',
    'BBBBBBBBBBBBBBBB',
    'BDBBDBBDBBDBBDBD',
    'BBDBBDBBDBBDBBDB',
    'DBBDBBDBBDBBDBBD',
    'BBBBBBBBBBBBBBBB',
    'BDBBDBBDBBDBBDBD',
    'DBBDBBDBBDBBDBBD',
    'BBBBBBBBBBBBBBBB',
    'BDBBDBBDBBDBBDBD',
    'DBBDBBDBBDBBDBBD',
    'BBBBBBBBBBBBBBBB',
    'DBBDBBDBBDBBDBBD',
    'BDBBDBBDBBDBBDBD',
    'BBBBBBBBBBBBBBBB',
    'DDBBDDBBDDBBDDBB'
  ], { D: '#e0a860', B: '#b87838' });
}
function tileBrick() {
  return paint([
    'BBBBBBBBBBBBBBBB',
    'BLLLLLLLLLLLLLLB',
    'BLLLLLLLLLLLLLLB',
    'BBBBBBBBBBBBBBBB',
    'KKKKKKKKKKKKKKKK',
    'LBBBBBBBBBBBBBLL'.split('').map((c,i)=>c).join(''),
    'BBBBBBBBBBBBBBBB',
    'LLLLLLLLLLLLLLLL',
    'KKKKKKKKKKKKKKKK',
    'BBBBBBBBBBBBBBBB',
    'LBBBBBBBBBBBBBLL',
    'BBBBBBBBBBBBBBBB',
    'KKKKKKKKKKKKKKKK',
    'LLLLLLLLLLLLLLLL',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB'
  ], { B: '#c88040', L: '#e8b878', K: '#7c3c14' });
}
function tileQuestion() {
  const cv = paint([
    'KKKKKKKKKKKKKKKK',
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYOYYYYYYYYYYK',
    'KYYOOOOOOOYYYYK',
    'KYYOYYYYYYOYYYK'.replace(/O/g,'O'),
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KYYYYYYYYYYYYYYK',
    'KKKKKKKKKKKKKKKK'
  ], { K: '#b05018', Y: '#f8a020', O: '#fff8f0' });
  const g = cv.getContext('2d');
  g.fillStyle = '#ffe8a0';
  g.fillRect(1, 1, 14, 2);
  g.fillRect(1, 1, 2, 14);
  g.fillStyle = '#803800';
  g.fillRect(1, 14, 14, 1);
  g.fillRect(14, 1, 1, 14);
  g.fillStyle = '#ffffff';
  g.fillRect(5, 6, 6, 4);
  return cv;
}
function tileUsed() {
  const cv = paint([
    'KKKKKKKKKKKKKKKK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KPPPPPPPPPPPPPPK',
    'KKKKKKKKKKKKKKKK'
  ], { K: '#703c18', P: '#c89060' });
  const g = cv.getContext('2d');
  g.fillStyle = '#503010';
  g.fillRect(2, 2, 3, 3); g.fillRect(11, 2, 3, 3);
  g.fillRect(2, 11, 3, 3); g.fillRect(11, 11, 3, 3);
  return cv;
}
function tileSolid() {
  const cv = paint([
    'NNNNNNNNNNNNNNNN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NLLLLLLLLLLLLLLN',
    'NNNNNNNNNNNNNNNN'
  ], { N: '#909090', L: '#d8d8d8' });
  const g = cv.getContext('2d');
  g.fillStyle = '#787878';
  g.fillRect(2, 2, 4, 4); g.fillRect(10, 2, 4, 4);
  g.fillRect(2, 10, 4, 4); g.fillRect(10, 10, 4, 4);
  return cv;
}
function pipeTiles() {
  const mkTL = () => paint([
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'hhhhhhhhhhhhhhhh',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa'
  ], { G: '#10a030', H: '#18d048', h: '#18c044', a: '#28a838' });
  const cv = mkTL();
  const g = cv.getContext('2d');
  // 顶部管口轮廓: 左高光右暗
  g.fillStyle = '#60e870';
  g.fillRect(1, 4, 6, 2);
  g.fillStyle = '#086018';
  g.fillRect(9, 4, 6, 2);
  // 管身明暗
  g.fillStyle = '#34c048';
  g.fillRect(1, 6, 5, 10);
  g.fillStyle = '#28a838';
  g.fillRect(6, 6, 7, 10);
  g.fillStyle = '#187c28';
  g.fillRect(13, 6, 2, 10);
  return cv;
}
function pipeTR() {
  const cv = paint([
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'GGGGGGGGGGGGGGGG',
    'HHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHH',
    'hhhhhhhhhhhhhhhh',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa'
  ], { G: '#10a030', H: '#18d048', h: '#18c044', a: '#28a838' });
  const g = cv.getContext('2d');
  g.fillStyle = '#70f080';
  g.fillRect(1, 4, 2, 2);
  g.fillStyle = '#0a7020';
  g.fillRect(8, 4, 7, 2);
  g.fillStyle = '#34c048';
  g.fillRect(1, 6, 2, 10);
  g.fillStyle = '#28a838';
  g.fillRect(3, 6, 7, 10);
  g.fillStyle = '#187c28';
  g.fillRect(10, 6, 5, 10);
  return cv;
}
function pipeBL() {
  const cv = paint([
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa'
  ], { a: '#28a838' });
  const g = cv.getContext('2d');
  g.fillStyle = '#34c048';
  g.fillRect(1, 0, 5, 16);
  g.fillStyle = '#187c28';
  g.fillRect(13, 0, 2, 16);
  return cv;
}
function pipeBR() {
  const cv = paint([
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa',
    'aaaaaaaaaaaaaaaa'
  ], { a: '#28a838' });
  const g = cv.getContext('2d');
  g.fillStyle = '#34c048';
  g.fillRect(1, 0, 2, 16);
  g.fillStyle = '#28a838';
  g.fillRect(3, 0, 7, 16);
  g.fillStyle = '#187c28';
  g.fillRect(10, 0, 5, 16);
  return cv;
}

/* ============ 马里奥 (面向右) ============ */
const M16_HEAD = [ // 12x11 头+身(红衫)
  '....RRRR....',
  '...RRRRRR...',
  '..RRRRRRRR..',
  '..RRRRRRRRR.',
  '..HHSSSSSSS.',
  '..HSWKSSSSS.',
  '..HSSSSSSSS.',
  '..SSSSSSSSS.',
  '..RRRRRRRRR.',
  '...RRRRRR...'
];
const mSmall = {
  idle: paint([
    ...M16_HEAD,
    '...BBBBBB...',
    '...BBBBBB...',
    '..YBBBBBB..',
    '...KKKKKK...',
    '..KKK..KKK..',
    '.KKK....KKK.',
    '.KK......KK.'
  ], M_PAL),
  runA: paint([
    ...M16_HEAD,
    '...BBBBBB...',
    '..BBBBBBB...',
    '..YBBBBB....',
    '...KKKKKK...',
    '..KKKKK.....',
    '.KKKK.......',
    '.KK.........'
  ], M_PAL),
  runB: paint([
    ...M16_HEAD,
    '...BBBBBB...',
    '..BBBBBBB...',
    '..YBBBBB....',
    '....KKKK....',
    '....KKKKK...',
    '......KKKK..',
    '........KKK.'
  ], M_PAL),
  jump: paint([
    ...M16_HEAD,
    '...RRRRRR...',
    '..BBBBBBBB..',
    '.BBBBBBBBB..',
    '.YBBBBBBB...',
    '..KKKKKKKK..',
    '.KKK..KKKK..',
    'KKK.....KKK.',
    'KK.......KK.'
  ], M_PAL)
};
function mirror(rows) { return rows.map(r => r.split('').reverse().join('')); }

const mBig = (function () {
  // 大马里奥: 在16x32画布上组合 头/身 + 加长蓝裤
  function build(head, legs) {
    const cv = mkCanvas(16, 32);
    const g = cv.getContext('2d');
    g.drawImage(head, 2, 0); // 头放中间 x=2
    // 上半身(红衣+肩) 
    const upper = paint([
      '..RRRRRRRRRR..',
      '..RRRRRRRRRR..',
      '.RRRRRRRRRRR..',
      '.RRRRRRRRRRR..',
      '.RRRRRRRRRRR..'
    ], M_PAL);
    g.drawImage(upper, 0, 11);
    // 裤腰&背带
    const strap = paint([
      '.BBBBBBBBBBB..',
      '.BBBBBBBBBBB..',
      '.YBBBBBBBBBBY.',
      '.YBBBBBBBBBBY.',
      '..BBBBBBBBBB..'
    ], M_PAL);
    g.drawImage(strap, 0, 16);
    const lc = paint(legs, M_PAL);
    g.drawImage(lc, 0, 21);
    return cv;
  }
  const headIdle = paint([
    '....RRRR......',
    '...RRRRRR.....',
    '..RRRRRRRR....',
    '..RRRRRRRRR...',
    '..HHSSSSSS....',
    '..HSWKSSSS....',
    '..HSSSSSSSS...',
    '..SSSSSSSSS...',
    '..SSSSSSSSS...',
    '..RRRRRRRRRR..',
    '.RRRRRRRRRRR..'
  ], M_PAL);
  // headX 轻微不同的跑步帧头
  const headRun = headIdle;
  const idleLegs = [
    '.KKKK...KKKK..',
    '.KKKK...KKKK..',
    '.KKK.....KKK..',
    '.KKK.....KKK..',
    'KKKK.....KKKK.',
    'KKK.......KKK.',
    'KK.........KK.',
    '............K.'
  ];
  const runLegsA = [
    '.KKKKKKKKKKK..',
    '.KKKKKKKKKK...',
    'KKKKKKKKKK....',
    'KKKKKKKK......',
    '.KKKKK........',
    '.KKKK.........',
    '.KK...........',
    '.............K'
  ];
  const runLegsB = [
    '......KKKKKKK.',
    '......KKKKKKK.',
    '......KKKKKK..',
    '.....KKKKK....',
    '....KKKKK.....',
    '..KKKKK.......',
    '..KKKK........',
    '..KK..........'
  ];
  const jumpLegs = [
    '.KKKKKKKKKK...',
    '.KKKKKKKKKK...',
    'KKKKK..KKKKK..',
    'KKKK....KKKK..',
    'KKK......KKK..',
    'KK........KKK.',
    '..........KKK.',
    '...........KK.'
  ];
  return {
    idle: build(headIdle, idleLegs),
    runA: build(headRun, runLegsA),
    runB: build(headRun, runLegsB),
    jump: build(headRun, jumpLegs)
  };
})();

/* ============ 敌人 & 道具 ============ */
const goombaIdle = [
  '................',
  '....GGGGGGGG....',
  '..GGGGGGGGGGGG..',
  '.GGGGGGGGGGGGGG.',
  '.GGgGGGGGGGGgGG.',
  'GGGGGGGGGGGGGGGG',
  'GGGGCCCCCCCCGGGG',
  'GGGCCCCCCCCCCGGG',
  '.GCCCCCCCCCCCCG.',
  '.GCCCWKWWKWKCCC.',
  '.GCCWKWWWWWWKCC.',
  '..CCCWWWWWWCCC..',
  '..CCKKKKKKKKCC..',
  '..KKKKKKKKKKKK..',
  '.KKKKKKKKKKKKKK.',
  '................'
];
const goombaWalk1 = goombaIdle.slice(0, 13).concat([
  '..KKKKKKKKKKKK..',
  '..KKKKK..KKKKK..',
  '................'
]);
const goombaWalk2 = goombaIdle.slice(0, 13).concat([
  '..KKKKKKKKKKKK..',
  '...KKKKKKKKKK...',
  '................'
]);
const goombaSquash = [
  '................',
  '................',
  '....GGGGGGGG....',
  '..GGGGGGGGGGGG..',
  '.GGGGGGGGGGGGGG.',
  '.GGGGCCCCCCGGGG.',
  '.GCCCCCCCCCCCCG.',
  '..CCCWKWWWWKCC..',
  '..CCKKKKKKKKCC..',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................'
];
const koopaGreen = {
  walk: [
    '................',
    '................',
    '....KKKKKKKK....',
    '..KKKKKKKKKKKK..',
    '.KKKKKKKKKKKKKK.',
    'KKEEEEEEEEEEEEKK',
    'KKEEEEEEEEEEEEKK',
    'KEEEEEEEEEEEEEEK',
    'KEEEKKKKKKKEEEKK',
    '.EEEKWKKKKWKEEE.',
    '.EEKWWKKKKWWKEE.',
    '..KKWWWWWWWWKK..',
    '.KKWWWWWWWWWWKK.',
    '..KKKKKKKKKKKK..',
    '................',
    '................'
  ],
  shell: [
    '................',
    '................',
    '................',
    '................',
    '.....KKKKKK.....',
    '...KKKKKKKKKK...',
    '..KKKKKKKKKKKK..',
    '..KEEEEEEEEEKK..',
    '..KEEKKKKKKEEK..',
    '..KEEWKKKKWEEK..',
    '..KEWWKKKKWWEE..',
    '...KWWKKKKWWK...',
    '...KKKKKKKKKK...',
    '.....KKKKKK.....',
    '................',
    '................'
  ]
};
const redKoopaPal = Object.assign({}, T_PAL, { E: '#e83838', L: '' });
const mushroomP = [
  '................',
  '................',
  '....RRRRRRRR....',
  '..RRRRRRRRRRRR..',
  '.RRWRRRRRRRWRRR.',
  '.RWWRRRRRRRWWRR.',
  'RRWWRRRRRRRWWWRR',
  'RRRRRRRRRRRRRRRR',
  'RRRRRRRRRRRRRRRR',
  '.CCCCCCCCCCCCCC.',
  '.CCCCCCCCCCCCCC.',
  '.CCCKKKKKKKCCC..',
  '.CCKKWWWWWKKCC..',
  '..CKKWWWWWKKC...',
  '................',
  '................'
];
const flowerP = [
  '................',
  '................',
  '................',
  '..YYYYYYYYYYYY..',
  '.YYYYYYYYYYYYYY.',
  '.YRRYYYYYYYYRRY.',
  'YRRRRYYYYYYRRRRY',
  'YRRRRRYYYYRRRRRY',
  'YRRRRRYYYRRRRRRY',
  '.YYYYYYYYYYYYYY.',
  '..RR....RR......',
  '..GG....GG......',
  '..GG....GG......',
  '..GGGGGGGG......',
  '...GGGGGG.......',
  '................'
];
const fireballP = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....OOOOOO.....',
  '..OOOYYYYYYOOO..',
  '.OOYYYYYYYYYYOO.',
  '.OYYYYYWWYYYYYO.',
  '.OOYYYYYYYYYYOO.',
  '..OOOYYYYYYOOO..',
  '.....OOOOOO.....',
  '................',
  '................',
  '................'
];
const piranhaPal = { R: '#e83838', W: '#fff8f0', K: '#201810', G: '#28a838', D: '#187c28' };
const piranhaFrames = [
  [
    '................',
    '................',
    '................',
    '......RRRR......',
    '.....RRRRRR.....',
    '....RRWRRRR.....',
    '....RWRRRRR.....',
    '....RRKRRRR.....',
    '.....RRRRR......',
    '......RRR.......',
    '.....RRRR.......',
    '.....GRRR.......',
    '.....GGGG.......',
    '....GGGGG.......',
    '................',
    '................'
  ],
  [
    '................',
    '................',
    '................',
    '................',
    '......RRRR......',
    '.....RRRRRR.....',
    '....RRWRRRR.....',
    '....RWRRRRR.....',
    '....RRKRRRR.....',
    '.....RRRRR......',
    '......RRR.......',
    '.....GRRR.......',
    '.....GGGG.......',
    '....GGGGG.......',
    '................',
    '................'
  ]
];
function makePiranha(fr) {
  const cv = mkCanvas(16, 16), g = cv.getContext('2d');
  // 茎
  g.fillStyle = piranhaPal.G;
  g.fillRect(7, 10, 2, 6);
  // 头
  const hd = paint(fr, piranhaPal);
  g.drawImage(hd, 0, 0);
  return cv;
}

const SPR = {
  tiles: {
    groundTop: tileGroundTop(), groundBody: tileGroundBody(),
    brick: tileBrick(), question: tileQuestion(), used: tileUsed(),
    solid: tileSolid(), pipeTL: pipeTiles(), pipeTR: pipeTR(),
    pipeBL: pipeBL(), pipeBR: pipeBR()
  },
  mSmall: mSmall,
  mBig: mBig,
  goomba: [paint(goombaWalk1, T_PAL), paint(goombaWalk2, T_PAL)],
  goombaSquash: paint(goombaSquash, T_PAL),
  koopaGreenWalk: [paint(koopaGreen.walk, T_PAL), paint(mirror(koopaGreen.walk), T_PAL)],
  koopaRedWalk: [paint(koopaGreen.walk, redKoopaPal), paint(mirror(koopaGreen.walk), redKoopaPal)],
  koopaShell: paint(koopaGreen.shell, T_PAL),
  mushroom: paint(mushroomP, T_PAL),
  oneup: (function () {
    const rows = mushroomP.map(r => r.replace(/R/g, 'G').replace(/W/g, 'W'));
    return paint(rows, Object.assign({}, T_PAL, { G: '#20c040' }));
  })(),
  flower: paint(flowerP, T_PAL),
  fireball: paint(fireballP, { O: '#f87818', Y: '#ffd000', W: '#fff8e0' }),
  piranha: [makePiranha(piranhaFrames[0]), makePiranha(piranhaFrames[1])],
  flagPole: (function () { // 16x112
    const cv = mkCanvas(16, 112), g = cv.getContext('2d');
    g.fillStyle = '#18c048'; g.fillRect(7, 0, 2, 112);
    g.fillStyle = '#0a6c18'; g.fillRect(7, 0, 1, 112);
    g.fillStyle = '#70f080'; g.fillRect(8, 0, 1, 112);
    return cv;
  })(),
  flagBanner: (function () {
    const cv = mkCanvas(32, 16), g = cv.getContext('2d');
    g.fillStyle = '#e8d000'; g.fillRect(0, 0, 32, 16);
    g.fillStyle = '#f8f8f8'; g.fillRect(0, 0, 2, 16);
    g.fillStyle = '#b0a000'; g.fillRect(30, 0, 2, 16);
    return cv;
  })(),
  castle: makeCastle2(),
  cloud: makeCloud(),
  bush: makeBush(),
  hillBig: makeHill(),
  coin: (function () {
    const cv = mkCanvas(16, 16), g = cv.getContext('2d');
    g.fillStyle = '#e8b000';
    g.beginPath(); g.arc(8, 8, 6.4, 0, 7); g.fill();
    g.fillStyle = '#ffd800';
    g.beginPath(); g.arc(8, 8, 5.4, 0, 7); g.fill();
    g.fillStyle = '#fff0a0';
    g.beginPath(); g.arc(8, 8, 4.4, 0, 7); g.fill();
    return cv;
  })(),
  font: makeText
};

function makeCastle2() {
  const cv = mkCanvas(112, 96), g = cv.getContext('2d');
  // 纯色城堡
  const B = '#c8c8c8', D = '#7a7a7a', W = '#ffffff', K = '#181818', R = '#e83838', G = '#28a838';
  // 主楼
  g.fillStyle = B; g.fillRect(24, 44, 64, 52);
  g.fillStyle = D; g.fillRect(24, 92, 64, 4);
  g.fillStyle = W; g.fillRect(24, 44, 64, 2);
  // 主楼门(暗)
  g.fillStyle = K; g.fillRect(50, 76, 12, 20);
  g.fillStyle = D; g.fillRect(46, 72, 20, 6);
  g.fillStyle = W; g.fillRect(46, 72, 20, 2);
  // 左塔
  g.fillStyle = B; g.fillRect(6, 16, 22, 80);
  g.fillStyle = D; g.fillRect(6, 92, 22, 4);
  g.fillStyle = W; g.fillRect(6, 16, 22, 2);
  g.fillStyle = D; g.beginPath(); g.moveTo(2, 16); g.lineTo(17, 2); g.lineTo(32, 16); g.closePath(); g.fill();
  g.fillStyle = K; g.fillRect(13, 40, 8, 14); g.fillStyle = W; g.fillRect(13, 38, 8, 2);
  // 右塔
  g.fillStyle = B; g.fillRect(84, 24, 22, 72);
  g.fillStyle = D; g.fillRect(84, 92, 22, 4);
  g.fillStyle = W; g.fillRect(84, 24, 22, 2);
  g.fillStyle = D; g.beginPath(); g.moveTo(80, 24); g.lineTo(95, 10); g.lineTo(110, 24); g.closePath(); g.fill();
  // 城垛
  g.fillStyle = B;
  for (let x = 22; x < 88; x += 8) g.fillRect(x, 36, 5, 8);
  g.fillStyle = W;
  for (let x = 22; x < 88; x += 8) g.fillRect(x, 36, 5, 2);
  // 窗户
  g.fillStyle = K; g.fillRect(56, 52, 8, 12); g.fillStyle = W; g.fillRect(56, 50, 8, 2);
  g.fillStyle = K; g.fillRect(30, 56, 6, 8); g.fillStyle = W; g.fillRect(30, 54, 6, 2);
  g.fillStyle = K; g.fillRect(90, 52, 6, 10); g.fillStyle = W; g.fillRect(90, 50, 6, 2);
  return cv;
}
function makeCloud() {
  const cv = mkCanvas(48, 24), g = cv.getContext('2d');
  g.fillStyle = '#f8f8f8';
  g.fillRect(0, 12, 48, 12);
  g.fillRect(6, 8, 36, 6);
  g.fillRect(12, 2, 14, 6);
  g.fillStyle = '#e8e8e8';
  g.fillRect(0, 12, 6, 3);
  g.fillRect(40, 16, 8, 8);
  g.fillRect(14, 4, 4, 4);
  return cv;
}
function makeBush() {
  const cv = mkCanvas(32, 16), g = cv.getContext('2d');
  const GR = '#39b838';
  g.fillStyle = GR;
  g.fillRect(2, 10, 28, 6);
  g.beginPath(); g.arc(5, 10, 7, Math.PI, 0); g.fill();
  g.beginPath(); g.arc(16, 8, 8, Math.PI, 0); g.fill();
  g.beginPath(); g.arc(27, 10, 7, Math.PI, 0); g.fill();
  g.fillStyle = '#6ce068';
  g.beginPath(); g.arc(4, 10, 3, Math.PI, 0); g.fill();
  g.beginPath(); g.arc(16, 8, 4, Math.PI, 0); g.fill();
  g.beginPath(); g.arc(28, 10, 3, Math.PI, 0); g.fill();
  return cv;
}
function makeHill() {
  const cv = mkCanvas(48, 36), g = cv.getContext('2d');
  g.fillStyle = '#2c9c2c';
  g.beginPath(); g.moveTo(0, 36); g.lineTo(24, 2); g.lineTo(48, 36); g.closePath(); g.fill();
  g.fillStyle = '#e8f8d0';
  g.beginPath(); g.moveTo(10, 36); g.lineTo(19, 18); g.lineTo(26, 36); g.closePath(); g.fill();
  g.fillStyle = '#1e701e';
  g.fillRect(0, 34, 48, 2);
  return cv;
}
