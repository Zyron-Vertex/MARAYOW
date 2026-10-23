/* ============================================================
 * audio.js — WebAudio 8-bit 音效 & 背景音乐
 * ============================================================ */
'use strict';
const SFX = (function () {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let bgmTimer = null, bgmNext = 0, bgmStep = 0, currentBgm = null, running = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain(); musicGain.gain.value = 0.34; musicGain.connect(master);
      sfxGain = ctx.createGain(); sfxGain.gain.value = 1; sfxGain.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /* 播放单个音符 */
  function tone(freq, dur, type, vol, opts) {
    if (!ensure()) return;
    opts = opts || {};
    const t0 = ctx.currentTime + (opts.delay || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slide), t0 + dur);
    const v = vol == null ? 0.16 : vol;
    g.gain.setValueAtTime(v, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol, opts) {
    if (!ensure()) return;
    opts = opts || {};
    const t0 = ctx.currentTime + (opts.delay || 0);
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol == null ? 0.2 : vol;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = opts.freq || 2200;
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0);
  }
  function note(freq, dur, when, dest) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.12, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g); g.connect(dest);
    o.start(when); o.stop(when + dur + 0.02);
  }
  function bnote(freq, dur, when, dest) { // 低音三角波
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.22, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur * 0.9);
    o.connect(g); g.connect(dest);
    o.start(when); o.stop(when + dur + 0.02);
  }
  function hnote(when, dest) { // 打击噪声帽
    const len = Math.floor(ctx.sampleRate * 0.04);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 4000;
    const g = ctx.createGain(); g.gain.value = 0.06;
    src.connect(f); f.connect(g); g.connect(dest);
    src.start(when);
  }

  const F = { C3:130.8,D3:146.8,E3:164.8,F3:174.6,G3:196,A3:220,B3:246.9,
    C4:261.6,D4:293.7,E4:329.6,F4:349.2,G4:392,A4:440,B4:493.9,
    C5:523.3,D5:587.3,E5:659.3,F5:698.5,G5:784,A5:880,B5:987.8,C6:1046.5,E6:1318.5,G6:1568 };

  /* ---- 地面主题 BGM (近似还原) ---- */
  // 每行一组 {n:音符,t:时长(八分音符倍数)} n 为 null 休止
  function overworldSeq() {
    const seq = [];
    const A = [['E4',1],null,['E4',1],null,['C4',1],['E4',1],['G4',2],['G3',2]];
    const B = [['C4',1],null,['G3',1],null,['E3',1],null,['A3',1],null,['B3',1],null,['Bb3',1],['A3',1],['G3',2],['E4',1],['G4',1],['A4',1],['F4',1],['G4',1],['E4',1],['C4',1],['D4',1],['B3',2]];
    const C = [['C4',1],null,['G3',1],null,['E3',1],null,['A3',1],null,['B3',1],null,['Bb3',1],['A3',1],['G3',2],['E4',1],['G4',1],['A4',1],['F4',1],['G4',1],['E4',1],['C4',1],['D4',1],['B3',2]];
    const D = [['G4',1],['F#4',1],['F4',1],['D#4',1],['E4',2],['G#3',1],['A3',1],['C4',1],['A3',1],['C4',1],['D4',2],['G4',1],['F#4',1],['F4',1],['D#4',1],['E4',2],['G#3',1],['A3',1],['C4',1],['A3',1],['C4',1],['D4',2]];
    const E = [['G4',1],['F#4',1],['F4',1],['D#4',1],['E4',2],['G#3',1],['A3',1],['C4',1],['A3',1],['C4',1],['D4',2],['G4',1],['F#4',1],['F4',1],['D#4',1],['E4',2],['C5',1],['C5',1],['C5',2],null,['G4',2],['E4',2],['C4',2]];
    // 低音根音行走
    const bassA = ['G2','G2','G2','G2','C3','C3','C3','C3'];
    return { melody: [].concat(A, B, C, D, E), bass: bassA };
  }
  function playBgm(name) {
    if (!ensure()) return;
    stopBgm();
    currentBgm = name;
    running = true;
    bgmNext = ctx.currentTime + 0.15;
    bgmStep = 0;
    if (name === 'overworld') {
      const seq = overworldSeq();
      const spb = 0.235; // 每个八分音符秒
      const sch = function () {
        if (!running || currentBgm !== name) return;
        while (bgmNext < ctx.currentTime + 0.18) {
          const when = bgmNext;
          const M = seq.melody;
          const step = bgmStep;
          const item = M[step % M.length];
          if (item) note(F[item[0]] || item[0], spb * item[1] * 0.9, when, musicGain);
          // 低音: 每4个八分(=每拍半?) 简化每2拍
          if (step % 8 === 0) {
            const bi = Math.floor(step / 8) % seq.bass.length;
            bnote(F[seq.bass[bi]], spb * 8 * 0.95, when, musicGain);
          }
          if (step % 2 === 1) hnote(when, musicGain);
          bgmStep++;
          bgmNext += spb * (item ? item[1] : 1);
        }
      };
      bgmTimer = setInterval(sch, 40);
      sch();
    } else if (name === 'clear') {
      // 过关小号
      const notes = [['E5',0.16],['C5',0.16],['D5',0.16],['E5',0.16],['F5',0.16],['E5',0.16],['D5',0.16],['G4',0.16],['C5',0.7]];
      let t = ctx.currentTime + 0.1;
      notes.forEach(n => { note(F[n[0]], n[1] * 0.9, t, musicGain); t += n[1]; });
      running = false;
    }
  }
  function stopBgm() {
    running = false;
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    currentBgm = null;
  }

  const api = {
    unlock() { ensure(); },
    muted: false,
    toggleMute() {
      this.muted = !this.muted;
      if (master) master.gain.value = this.muted ? 0 : 0.5;
      return this.muted;
    },
    playBgm,
    stopBgm,
    jump() { tone(280, 0.16, 'square', 0.13, { slide: 760 }); },
    coin() { tone(F.B5, 0.07, 'square', 0.14); tone(F.E6, 0.25, 'square', 0.14, { delay: 0.07 }); },
    stomp() { tone(420, 0.1, 'square', 0.15, { slide: 90 }); noise(0.08, 0.14, { freq: 1600 }); },
    kick() { tone(260, 0.14, 'square', 0.15, { slide: 900 }); noise(0.06, 0.1); },
    bump() { tone(150, 0.07, 'square', 0.16, { slide: 70 }); },
    breakBrick() { noise(0.2, 0.24, { freq: 1200 }); tone(180, 0.1, 'square', 0.1, { slide: 50 }); },
    powerAppear() { [F.C4, F.E4, F.G4, F.C5].forEach((f, i) => tone(f, 0.09, 'square', 0.13, { delay: i * 0.07 })); },
    powerup() { [F.C4, F.E4, F.G4, F.C5, F.E5, F.G5, F.C6, F.E6].forEach((f, i) => tone(f, 0.11, 'square', 0.12, { delay: i * 0.055 })); },
    oneup() { [F.E5, F.G5, F.E6, F.C6, F.D6, F.G6].forEach((f, i) => tone(f, 0.13, 'square', 0.13, { delay: i * 0.09 })); },
    die() {
      const seq = [F.B4, F.A4, F.G4, F.E4, F.C4];
      seq.forEach((f, i) => tone(f, 0.14, 'square', 0.13, { delay: i * 0.12 }));
      tone(180, 0.6, 'triangle', 0.16, { delay: seq.length * 0.12, slide: 60 });
    },
    flag() { // 下滑音
      let t = 0;
      for (let f = F.G4; f > F.C3; f *= 0.93) { tone(f, 0.03, 'square', 0.09, { delay: t }); t += 0.03; }
    },
    fireball() { tone(900, 0.16, 'sawtooth', 0.08, { slide: 200 }); },
    pause() { tone(600, 0.08, 'square', 0.12); tone(900, 0.12, 'square', 0.12, { delay: 0.12 }); },
    gameover() { stopBgm(); const seq = [F.G4, F.E4, F.C4, F.A3, F.F3]; seq.forEach((f, i) => tone(f, 0.22, 'square', 0.13, { delay: i * 0.24 })); },
    timeTick() { tone(700, 0.05, 'square', 0.08); }
  };
  return api;
})();
