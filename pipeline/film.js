// 《节俭 vs 消费》复利侠 vs 月光姐 · rap battle MV (9:16, ~118 s).
// Scenes: cold open on stage → street (year-end bonus, the two bump outside the bank) → stage rounds with an LED wall that
// explains each line → hook ×2 with a "which side are you on" vote → trap switch → bedroom (the bill at night, moonlight
// turns gold) → beat drops back → duet finale and end card. Mouths follow each sung syllable's pinyin viseme × the vocal
// stem's loudness; heads bob on the instrumental's measured kicks; punchlines freeze, flash and slam their last words.
import { TM, clamp, lerp, seg, envAt, kickAt, snareAt, beatOf } from '/films/rap-common/lyric.js';
import { makeCards } from './cards.js';
let CARD = null;

const W = 1080, H = 1920, INK = '#14101c', A_COL = '#3d7bff', B_COL = '#ff3d8b', GOLD = '#ffc928', CREAM = '#fff6e6';
const FZ = (px, w = 900) => `${w} ${px}px "Noto Sans SC"`;
const E = { io: t => (t = clamp(t), t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2), o3: t => 1 - (1 - clamp(t)) ** 3,
  back: (t, s = 1.8) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; }, i2: t => clamp(t) ** 2 };
let g, G0, off, N, S;
const rnd = s => { let x = (s * 9301 + 49297) % 233280; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };

export function setup(ctx, script) {
  S = script; g = G0 = ctx; window.DUR = TM.dur; N = TM.lines.length;
  off = document.createElement('canvas'); off.width = W; off.height = H;
  PUNCH = {}; S.lines.forEach((L, i) => { if (L.punch) PUNCH[i] = L.punch; });
  ROUNDS = { ...ROUNDS0, 0: S.title, 14: 'HOOK · ' + S.hookTag, 28: undefined, ...RD() };
  for (const k in ROUNDS) if (!ROUNDS[k]) delete ROUNDS[k];
}

// ───────── lines, sections, punches ─────────
const sung = i => TM.lines[i].chars.filter(c => !c.p);
const lastT = i => sung(i).slice(-1)[0].t;
const lineStart = i => TM.lines[i].s0 - 0.12;
function activeLine(t) { for (let i = N - 1; i >= 0; i--) if (t >= lineStart(i)) return i; return 0; }
const whoOf = i => TM.lines[i].who;
const SCENE = i => (i >= 4 && i <= 5 ? 'street' : i >= 38 && i <= 40 ? 'bed' : 'stage');
const CHORUS = i => (i >= 14 && i <= 19) || (i >= 28 && i <= 33);
const TRAP = i => i >= 34 && i <= 37;
const RD = () => S.rounds || {};
let ROUNDS = null;
const ROUNDS0 = { 6: 'ROUND 1 · 各说各理', 14: 'HOOK',  20: 'ROUND 2 · 正面互怼', 34: 'ROUND 3 · 加速', 38: 'ROUND 4 · 真心话', 42: 'FINAL · 合唱' };
let PUNCH = {};
const punchT = i => lastT(i);
const punchesOf = side => Object.keys(PUNCH).map(Number).filter(i => whoOf(i) === side);
// character time: freezes for a beat-fraction right after each punchline lands
function charTime(t) { for (const k in PUNCH) { const tp = punchT(+k); if (t >= tp && t < tp + 0.2) return tp; } return t; }
function punchAmt(side, t) { let p = 0; for (const i of punchesOf(side)) { const tp = punchT(i); if (t >= tp - 0.35) p = Math.max(p, t < tp ? seg(t, tp - 0.35, tp) : Math.exp(-(t - tp) / 0.5)); } return p; }
function oppPunched(side, t) { const o = side === 'A' ? 'B' : 'A'; for (const i of punchesOf(o)) { const tp = punchT(i); if (t >= tp && t < tp + 0.9) return true; } return false; }

// ───────── mouth from the sung char ─────────
function mouthFor(side, t) {
  const li = activeLine(t), L = TM.lines[li], w = L.who;
  if (!(w === side || w === 'X')) return null;
  for (const c of L.chars) {
    if (c.p) continue;
    if (t >= c.t - 0.03 && t < c.e + 0.02) {
      const u = (t - c.t) / Math.max(0.06, c.e - c.t), env = clamp(envAt(t) * 1.25);
      if (c.v === 'M' && u < 0.35) return { v: 'M', open: 0 };
      if (c.v === 'F' && u < 0.3) return { v: 'F', open: 0.2 };
      return { v: c.v === 'M' || c.v === 'F' ? 'A' : c.v, open: clamp(0.25 + env * 0.85) * (u > 0.85 ? 0.6 : 1) };
    }
  }
  return { v: 'M', open: 0 };
}

// ───────── drawing kit ─────────
function fs(path, fill, lw = 8) { path(); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke(); }
function mouth(x, y, m, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineCap = 'round';
  const line = (q) => { g.beginPath(); q(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); };
  if (m.v === 'S') { line(() => { g.moveTo(-34, 0); g.quadraticCurveTo(0, 14, 40, -8); }); g.restore(); return; }
  if (m.v === 'smirk') { line(() => { g.moveTo(-30, 6); g.quadraticCurveTo(10, 10, 44, -14); }); g.restore(); return; }
  if (m.v === 'frown') { line(() => { g.moveTo(-32, 10); g.quadraticCurveTo(0, -10, 32, 10); }); g.restore(); return; }
  if (m.v === 'smile') { g.beginPath(); g.moveTo(-44, -6); g.quadraticCurveTo(0, 56, 44, -6); g.closePath(); g.fillStyle = '#5a1020'; g.fill(); g.lineWidth = 7; g.strokeStyle = INK; g.stroke(); g.fillStyle = '#fff'; g.fillRect(-36, -6, 72, 12); g.restore(); return; }
  const o = m.open;
  if (m.v === 'M' || o < 0.05) { line(() => { g.moveTo(-36, 0); g.quadraticCurveTo(0, 6, 36, 0); }); g.restore(); return; }
  let w = 46, h = 14 + 58 * o;
  if (m.v === 'O') { w = 24 + 12 * o; h = 26 + 44 * o; }
  if (m.v === 'I' || m.v === 'E') { w = 52; h = 10 + 32 * o; }
  if (m.v === 'F') { w = 40; h = 16; }
  g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, 7); g.fillStyle = '#5a1020'; g.fill();
  g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(-w, -h, 2 * w, Math.min(h * 0.5, 16));
  g.fillStyle = '#ff6b81'; g.beginPath(); g.ellipse(0, h * 0.85, w * 0.6, h * 0.45, 0, 0, 7); g.fill(); g.restore();
  g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.ellipse(0, 0, w, h, 0, 0, 7); g.stroke();
  g.restore();
}
function micAt(x, y, f) {
  fs(() => { g.save(); g.translate(x + 20 * f, y - 40); g.rotate(-0.5 * f); g.beginPath(); g.roundRect(-16, 0, 32, 120, 10); g.restore(); }, '#2b2b2b', 6);
  fs(() => { g.beginPath(); g.arc(x + 4 * f, y - 40, 34, 0, 7); }, '#9aa0a6', 6);
}
// a rapper. y = waist. o: { active, expr, gesture, prop: 'mic'|'phone', listen: 'cross'|'chin'|'cheer', legs, walk, s, pu, m }
function rapper(side, x, y, t, o) {
  const A = side === 'A', f = A ? 1 : -1;
  const skin = A ? '#e8b48a' : '#f3c9a8', top = A ? '#22305e' : '#ff7fb0', trim = A ? GOLD : '#ffe066';
  const k = kickAt(t, 0.12), sn = snareAt(t, 0.1), pu = o.pu || 0;
  const bob = (o.active ? 18 : 7) * k, lean = (o.active ? 0.05 : 0) * f + 0.05 * pu * f;
  g.save(); g.translate(x, y); g.scale(o.s || 1, o.s || 1);
  if (o.legs) {
    const ph = o.walk || 0;
    for (const [d, sh] of [[-1, Math.sin(ph)], [1, -Math.sin(ph)]]) {
      g.save(); g.translate(d * 80, -10); g.rotate(sh * 0.35);
      fs(() => { g.beginPath(); g.roundRect(-42, 0, 84, 360, 30); }, A ? '#151a33' : '#3a2140', 8);
      fs(() => { g.beginPath(); g.ellipse(18 * f, 370, 70, 34, 0, 0, 7); }, '#f4f4f4', 7);
      g.restore();
    }
  }
  g.rotate(lean);
  fs(() => { g.beginPath(); g.moveTo(-200, 0); g.bezierCurveTo(-215, -260, -190, -400 + sn * 10, -120, -420 + sn * 12); g.lineTo(120, -420 + sn * 12); g.bezierCurveTo(190, -400 + sn * 10, 215, -260, 200, 0); g.closePath(); }, top, 9);
  g.fillStyle = trim; g.fillRect(-200, -46, 400, 22);
  if (A) {
    g.lineWidth = 12; g.strokeStyle = GOLD; g.beginPath(); g.moveTo(-90, -410); g.quadraticCurveTo(0, -230 + k * 14, 90, -410); g.stroke();
    fs(() => { g.beginPath(); g.arc(0, -235 + k * 16, 46, 0, 7); }, GOLD, 7);
    { const bt = S.A.badge || '¥'; g.font = FZ(bt.length > 1 ? 34 : 56); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#9a6a00'; g.fillText(bt, 0, -232 + k * 16); }
  } else {
    fs(() => { g.beginPath(); g.roundRect(-70, -300, 140, 120, 14); }, '#fff2f7', 7);
    g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.arc(0, -300, 34, Math.PI, 0); g.stroke();
    { const bt = S.B.badge || '买'; g.font = FZ(bt.length > 1 ? 40 : 54); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = B_COL; g.fillText(bt, 0, -238); }
  }
  // ── head
  const ex = o.expr || 'rap';
  let m = o.m;
  if (!m) m = ex === 'shock' ? { v: 'O', open: 0.55 } : ex === 'sad' ? { v: 'frown' } : ex === 'happy' ? { v: 'smile' } : ex === 'roll' ? { v: 'smirk' } : { v: 'S' };
  g.save(); g.translate(0, -560 + bob); g.rotate(0.06 * f * pu - 0.03 * f * k + (ex === 'roll' ? -0.06 * f : 0));
  fs(() => { g.beginPath(); g.ellipse(-150 * f, 10, 30, 42, 0, 0, 7); }, skin, 7);
  fs(() => { g.beginPath(); g.ellipse(0, 0, 150, 168, 0, 0, 7); }, skin, 9);
  if (A) {
    fs(() => { g.beginPath(); g.moveTo(-152, -40); g.bezierCurveTo(-150, -190, 150, -190, 152, -40); g.closePath(); }, GOLD, 9);
    fs(() => { g.beginPath(); g.roundRect(-150 * f - (f > 0 ? 70 : 0), -70, 70, 34, 14); }, '#e0a800', 7);
  } else {
    for (const bx of [-110, 110]) fs(() => { g.beginPath(); g.arc(bx, -150, 62, 0, 7); }, '#3a2140', 8);
    fs(() => { g.beginPath(); g.moveTo(-150, -10); g.bezierCurveTo(-170, -200, 170, -200, 150, -10); g.quadraticCurveTo(60, -110, -150, -10); g.closePath(); }, '#3a2140', 8);
    fs(() => { g.beginPath(); g.arc(70, -150, 26, 0.6, 5.2); g.arc(82, -156, 20, 5.0, 0.8, true); g.closePath(); }, '#ffe066', 5);
    g.lineWidth = 8; g.strokeStyle = GOLD; g.beginPath(); g.arc(-150 * f, 70, 24, 0, 7); g.stroke();
  }
  for (const sx of [-55, 55]) {
    const cx = sx + 12 * f, outer = sx * f > 0;
    if (ex === 'happy') { g.lineWidth = 9; g.strokeStyle = INK; g.lineCap = 'round'; g.beginPath(); g.arc(cx, 2, 22, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
    else {
      const rx = ex === 'shock' ? 36 : 30, ry = ex === 'shock' ? 42 : ex === 'roll' ? 22 : ex === 'sad' ? 24 : 30;
      fs(() => { g.beginPath(); g.ellipse(cx, -10, rx, ry, 0, 0, 7); }, '#fff', 6);
      g.save(); g.beginPath(); g.ellipse(cx, -10, rx, ry, 0, 0, 7); g.clip();
      const py = ex === 'roll' ? -10 - ry + 8 : ex === 'sad' ? 2 : -6;
      g.fillStyle = INK; g.beginPath(); g.arc(cx + (ex === 'roll' ? 4 : 10) * f, py, ex === 'shock' ? 8 : 12, 0, 7); g.fill(); g.restore();
    }
    const by = -62 - 26 * pu - (ex === 'shock' ? 22 : 0) + (ex === 'roll' ? 8 : 0);
    const tilt = ex === 'sad' ? (outer ? 0.32 : -0.32) * f : ex === 'roll' ? (outer ? -0.18 : 0.12) * f : 0;
    g.save(); g.translate(cx, by); g.rotate(tilt); g.fillStyle = INK; g.fillRect(-34, -7, 68, 14); g.restore();
  }
  g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(16 * f, 22); g.lineTo(30 * f, 46); g.lineTo(10 * f, 50); g.stroke();
  if (o.blush) { g.fillStyle = 'rgba(255,90,120,0.35)'; for (const sx of [-80, 80]) { g.beginPath(); g.ellipse(sx + 12 * f, 50, 30, 16, 0, 0, 7); g.fill(); } }
  mouth(12 * f, 95, m, 1.05);
  g.restore();
  // ── arms (x × f)
  const P = ([a, b]) => [a * f, b];
  const arm = (a, b, c, col) => { g.lineCap = 'round'; for (const [w, cl] of [[64, INK], [48, col]]) { g.lineWidth = w; g.strokeStyle = cl; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.stroke(); } fs(() => { g.beginPath(); g.arc(c[0], c[1], 30, 0, 7); }, skin, 6); };
  const shF = P([-160, -380]), shM = P([160, -380]);
  if (o.active || o.listen === 'cheer') {
    const gs = o.gesture || 'pump';
    let el, hd;
    if (gs === 'point') { el = [60, -430]; hd = [300, -480]; }
    else if (gs === 'up' || o.listen === 'cheer') { el = [-230, -560]; hd = [-200, -770 + 30 * k]; }
    else if (gs === 'chest') { el = [-120, -260]; hd = [20, -330]; }
    else if (gs === 'shrug') { el = [-270, -270]; hd = [-340, -390]; }
    else if (gs === 'count') { el = [-240, -480]; hd = [-230, -660]; }
    else if (gs === 'throw') { const u = (beatOf(t) % 1 + 1) % 1, s2 = E.o3(u * 2); el = [lerp(-230, -120, s2), lerp(-250, -520, s2)]; hd = [lerp(-150, 150, s2), lerp(-150, -700, s2)]; }
    else { el = [lerp(-240, -200, k), lerp(-230, -330, k)]; hd = [lerp(-200, -230, k), lerp(-120, -330, k)]; }
    arm(shF, P(el), P(hd), top);
    if (gs === 'count') { g.lineWidth = 14; g.strokeStyle = INK; for (const d of [-14, 0, 14]) { g.beginPath(); g.moveTo(-230 * f + d, -690); g.lineTo(-230 * f + d * 1.3, -740); g.stroke(); } }
    if (o.prop === 'phone') {
      const hp = P([70, -330]); arm(shM, P([210, -220]), hp, top);
      g.save(); g.translate(hp[0] + 10 * f, hp[1] - 60); g.rotate(-0.15 * f); fs(() => { g.beginPath(); g.roundRect(-34, -60, 68, 120, 12); }, '#222', 6); g.fillStyle = '#9fd3ff'; g.fillRect(-26, -50, 52, 96); g.restore();
    } else if (o.listen === 'cheer' && !o.active) {
      const hd2 = P([200, -770 + 30 * k]); arm(shM, P([230, -560]), hd2, top);
    } else {
      const mic = P([118, -372 + bob]); arm(shM, P([230, -230]), mic, top); micAt(mic[0], mic[1], f);
    }
  } else if (o.listen === 'chin') {
    arm(shF, P([-120, -170]), P([110, -230]), top); arm(shM, P([200, -260]), P([60, -470]), top);
  } else { arm(shF, P([-120, -170]), P([110, -230]), top); arm(shM, P([140, -190]), P([-90, -250]), top); }
  g.restore();
}

// ───────── LED wall art: one small explainer per line ─────────
function neon(path, col, w = 10) { path(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.globalAlpha = 0.25; g.lineWidth = w * 3; g.stroke(); g.globalAlpha = 1; g.lineWidth = w; g.stroke(); }
function wtxt(s, x, y, px, col, w = 900, align = 'center') { g.font = FZ(px, w); g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = col; g.globalAlpha = 0.3; g.fillText(s, x + 4, y + 4); g.globalAlpha = 1; g.fillText(s, x, y); }
function pop(u, d = 0.25) { return E.back(clamp(u / d), 2); }
function coin(x, y, r, col = GOLD) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.font = FZ(r * 1.1); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#7a5200'; g.fillText('¥', x, y + r * 0.05); }
function box(x, y, w, h, col) { neon(() => { g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, 16); }, col, 8); }
function arrow(x1, y1, x2, y2, col, p = 1) { const x = lerp(x1, x2, p), y = lerp(y1, y2, p), a = Math.atan2(y2 - y1, x2 - x1); neon(() => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.moveTo(x - 30 * Math.cos(a - 0.5), y - 30 * Math.sin(a - 0.5)); g.lineTo(x, y); g.lineTo(x - 30 * Math.cos(a + 0.5), y - 30 * Math.sin(a + 0.5)); }, col, 8); }
function wallArt(i, t) {
  if (!CARD) CARD = makeCards({ get g() { return g; }, neon, wtxt, box, arrow, coin, pop, clamp, lerp, E, GOLD });
  const L = S.lines[i], w = whoOf(i), col = w === 'A' ? '#7fb0ff' : w === 'B' ? '#ff86b6' : GOLD;
  let c = L.card;
  if (!c && CHORUS(i)) c = w === 'A' ? { t: 'big', text: S.A.side, color: '#7fb0ff' } : w === 'B' ? { t: 'big', text: S.B.side, color: '#ff86b6' } : { t: 'vs', a: S.A.side, b: S.B.side };
  if (!c) c = { t: 'big', text: L.punch || S.title };
  const u = t - lineStart(i), b = Math.max(0, beatOf(t) - beatOf(lineStart(i))), dur = (i + 1 < N ? lineStart(i + 1) : TM.dur) - lineStart(i);
  CARD(c, col, u, b, dur);
}

// ───────── stage ─────────
function stage(t, i) {
  const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#120a2a'); sky.addColorStop(1, '#2a0f45');
  g.fillStyle = sky; g.fillRect(-400, -200, W + 800, H + 400);
  const w = whoOf(i), sn = snareAt(t, 0.12), col = w === 'A' ? A_COL : w === 'B' ? B_COL : '#8b5cf6';
  g.fillStyle = '#07040f'; g.fillRect(40, 160, 1000, 1000);
  for (let j = 0; j < 14; j++) for (let k = 0; k < 9; k++) { g.fillStyle = col; g.globalAlpha = 0.06 + 0.2 * sn * ((k + j) % 2); g.fillRect(48 + k * 110, 168 + j * 70, 104, 64); }
  g.globalAlpha = 1;
  if (TRAP(i) || i >= 42) { // lasers sweep on the beat
    const b = beatOf(t);
    for (let k = 0; k < 6; k++) { const a = Math.sin(b * Math.PI / 2 + k) * 0.6; g.save(); g.translate(k % 2 ? 1080 : 0, 120); g.rotate((k % 2 ? Math.PI - 1.1 : 1.1) + a);
      g.fillStyle = ['#ff3d8b', '#3d7bff', '#ffc928'][k % 3]; g.globalAlpha = 0.35; g.fillRect(0, -3, 2400, 6); g.globalAlpha = 1; g.restore(); }
  }
  const beam = (x, c, a) => { const gr = g.createLinearGradient(x, 0, x, 1500); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.moveTo(x - 40, 0); g.lineTo(x + 40, 0); g.lineTo(x + 260, 1500); g.lineTo(x - 260, 1500); g.fill(); g.globalAlpha = 1; };
  beam(300, '#9bb8ff', w === 'A' || w === 'X' ? 0.4 : 0.06);
  beam(780, '#ffb3d1', w === 'B' || w === 'X' ? 0.4 : 0.06);
  g.fillStyle = '#0b0614'; g.fillRect(-400, 1480, W + 800, 800);
  // haze
  for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(180,160,255,0.06)'; g.beginPath(); g.ellipse(((k * 260 + t * 30) % 1500) - 200, 1450, 320, 90, 0, 0, 7); g.fill(); }
}
function stageRappers(t, i, tc) {
  const w = whoOf(i);
  for (const side of ['A', 'B']) {
    const act = w === side || w === 'X', x = side === 'A' ? 300 : 780;
    const pu = punchAmt(side, t);
    let gesture = 'pump';
    const myP = punchesOf(side).find(p => t >= punchT(p) - 0.5 && t < punchT(p) + 0.4);
    if (myP !== undefined) gesture = 'point';
    if (act && S.lines[i].gesture) gesture = S.lines[i].gesture;
    else if (act && i === 34) gesture = 'count';
    if (w === 'X' || i === 41 && side === 'A') gesture = 'up';
    let expr = 'rap', listen = 'cross';
    if (!act) { expr = oppPunched(side, t) ? 'shock' : CHORUS(i) ? 'happy' : 'roll'; if (i >= 41) { expr = 'happy'; listen = 'cheer'; } else if (CHORUS(i)) listen = 'chin'; }
    const m = act ? mouthFor(side, tc) : null;
    rapper(side, x, 1500, tc, { active: act, expr, gesture, listen, pu, m: m || undefined, blush: side === 'B' && i >= 41 });
  }
}
function crowd(t, i) {
  const hype = Object.keys(PUNCH).some(k => t >= punchT(+k) && t < punchT(+k) + 0.9) || i >= 42 || (CHORUS(i) && whoOf(i) === 'X');
  for (let row = 0; row < 2; row++) for (let k = 0; k < 14; k++) {
    const x = k * 82 + (k % 2) * 30 + row * 40, b = beatOf(t) + (k % 3) * 0.33, hop = Math.abs(Math.sin(Math.PI * b)) * (hype ? 34 : 14), y = 1700 + row * 110 - hop;
    g.fillStyle = row ? '#03010a' : '#0a0618'; g.beginPath(); g.arc(x, y, 48, 0, 7); g.fill(); g.fillRect(x - 52, y, 104, 160);
    if ((k + row) % 3 === 0 || hype) { g.save(); g.translate(x + 30, y - 30); g.rotate(-0.4 + 0.5 * kickAt(t)); g.fillRect(-10, -150, 20, 150);
      if ((k + row) % 4 === 0) { g.fillStyle = '#fffbe0'; g.globalAlpha = 0.85; g.fillRect(-12, -190, 24, 40); g.globalAlpha = 1; } g.restore(); }
  }
  for (const kk in PUNCH) { const tp = punchT(+kk), u = t - tp; if (u < 0 || u > 1.1) continue;
    const r = rnd(+kk); for (let q = 0; q < 3; q++) { const p = E.back(clamp((u - q * 0.08) / 0.2), 2.2); if (p <= 0) continue;
      g.save(); g.translate(150 + q * 330 + r() * 80, 1640 - u * 40); g.rotate((r() - 0.5) * 0.3); g.scale(p, p);
      g.font = FZ(64); g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = INK; const s = ['哦～～', 'OHHH', '绝了'][q];
      g.strokeText(s, 0, 0); g.fillStyle = '#fff'; g.fillText(s, 0, 0); g.restore(); } }
}

// ───────── street scene (lines 4-5) ─────────
function street(t) {
  const t0 = lineStart(4), L5 = TM.lines[5], hit = (L5.chars.find(c => c.c === '撞') || sung(5)[0]).t, fight = (L5.chars.find(c => c.c === '开') || sung(5).slice(-2)[0]).t;
  const sky = g.createLinearGradient(0, 0, 0, 1400); sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#fde3c0'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // bank (left) and mall (right)
  fs(() => { g.beginPath(); g.rect(-40, 520, 520, 980); }, '#e9e2d0', 8); fs(() => { g.beginPath(); g.moveTo(-60, 520); g.lineTo(220, 360); g.lineTo(500, 520); g.closePath(); }, '#d8cfb8', 8);
  for (let k = 0; k < 4; k++) fs(() => { g.beginPath(); g.rect(20 + k * 120, 620, 50, 700); }, '#f6f1e4', 6);
  fs(() => { g.beginPath(); g.roundRect(80, 420, 280, 80, 14); }, '#2f6fff', 7); wtxt(S.street.left, 220, 462, Math.min(56, 230 / S.street.left.length * 1.0), '#fff');
  fs(() => { g.beginPath(); g.rect(600, 460, 520, 1040); }, '#ffd6e6', 8); for (let k = 0; k < 6; k++) fs(() => { g.beginPath(); g.rect(640 + (k % 2) * 220, 560 + Math.floor(k / 2) * 240, 180, 180); }, '#bfe7ff', 6);
  fs(() => { g.beginPath(); g.roundRect(680, 380, 320, 90, 14); }, B_COL, 7); wtxt(S.street.right, 840, 427, Math.min(60, 270 / S.street.right.length), '#fff');
  g.fillStyle = '#9b9488'; g.fillRect(0, 1500, W, 420); g.fillStyle = '#b6ae9f'; for (let k = 0; k < 12; k++) g.fillRect(k * 100, 1500, 6, 420);
  // the two walk in and meet at the bump
  const u = clamp((t - t0) / (hit - t0)), after = t - hit;
  const rec = after > 0 ? Math.exp(-after / 0.25) * Math.sin(after * 30) * 20 + Math.min(after, 0.3) * 120 : 0;
  const ax = lerp(-150, 430, E.io(u)) - rec, bx = lerp(1230, 650, E.io(u)) + rec;
  const walk = u < 1 ? t * 9 : 0;
  rapper('A', ax, 1180, t, { s: 0.6, legs: true, walk, active: false, expr: after > 0 ? 'shock' : 'rap', listen: 'cross' });
  rapper('B', bx, 1180, t, { s: 0.6, legs: true, walk: walk + 1.5, active: true, prop: 'phone', gesture: 'pump', expr: after > 0 ? 'shock' : 'happy', m: { v: after > 0 ? 'O' : 'smile', open: 0.5 } });
  // phone notification
  const np = E.back(seg(t, t0 + 0.2, t0 + 0.5));
  if (np > 0 && after < 0.4) { g.save(); g.translate(540, 300); g.scale(np, np); fs(() => { g.beginPath(); g.roundRect(-400, -80, 800, 160, 30); }, '#ffffff', 6);
    g.font = FZ(40, 700); g.fillStyle = '#666'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(S.street.from, -360, -36); g.font = FZ(Math.min(54, 720 / S.street.note.length * 1.0)); g.fillStyle = INK; g.fillText(S.street.note, -360, 26); g.restore(); }
  if (after > 0) { const p = E.back(clamp(after / 0.15), 2.6); g.save(); g.translate(540, 760); g.scale(p, p); g.fillStyle = GOLD; g.beginPath(); for (let k = 0; k < 20; k++) { const a = k / 20 * 7, r = k % 2 ? 90 : 170; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.lineWidth = 8; g.strokeStyle = INK; g.stroke(); wtxt('撞！', 0, 0, 90, INK); g.restore(); }
  return fight;
}

// ───────── bedroom (lines 38-40) ─────────
function bedroom(t, i, tc) {
  const gold = clamp((t - lineStart(40)) / 1.2), moon = i === 40;
  g.fillStyle = '#141a3a'; g.fillRect(0, 0, W, H);
  // window with the moon; turns gold when he arrives
  const wx = 560, wy = 300, ww = 420, wh = 560;
  g.fillStyle = moon ? `rgb(${lerp(20, 255, gold)},${lerp(30, 214, gold)},${lerp(70, 120, gold)})` : '#1d2a66'; g.fillRect(wx, wy, ww, wh);
  if (!moon || gold < 0.5) { g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(wx + 300, wy + 140, 70, 0, 7); g.fill(); g.fillStyle = '#1d2a66'; g.beginPath(); g.arc(wx + 330, wy + 120, 60, 0, 7); g.fill(); }
  if (moon) { g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip(); rapper('A', wx + ww / 2, wy + wh + 150, tc, { s: 0.75, active: true, gesture: 'chest', expr: 'happy', m: mouthFor('A', tc) || undefined }); g.restore(); }
  g.lineWidth = 16; g.strokeStyle = '#0a0e24'; g.strokeRect(wx, wy, ww, wh); g.fillStyle = '#0a0e24'; g.fillRect(wx + ww / 2 - 8, wy, 16, wh); g.fillRect(wx, wy + wh / 2 - 8, ww, 16);
  // moonbeam onto her
  if (moon) { g.save(); g.globalAlpha = 0.35 * gold; const gr = g.createLinearGradient(wx, wy, 300, 1400); gr.addColorStop(0, '#ffe08a'); gr.addColorStop(1, 'rgba(255,224,138,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx, wy + wh); g.lineTo(560, 1600); g.lineTo(0, 1600); g.lineTo(0, 1000); g.closePath(); g.fill(); g.restore(); }
  // bed
  fs(() => { g.beginPath(); g.roundRect(-60, 1380, 900, 260, 30); }, '#3b4a8f', 8); fs(() => { g.beginPath(); g.roundRect(-60, 1300, 300, 120, 40); }, '#e8ecff', 7);
  const act = i !== 40;
  rapper('B', 380, 1480, tc, { s: 0.95, active: act, prop: 'phone', gesture: i === 39 ? 'chest' : 'pump', expr: i === 40 ? (gold > 0.7 ? 'happy' : 'sad') : 'sad', listen: 'chin', m: act ? mouthFor('B', tc) || undefined : undefined, blush: i === 40 && gold > 0.7 });
  // the bill on her phone, as a floating card
  if (i <= 39) { const p = E.back(seg(t, lineStart(38) + 0.6, lineStart(38) + 0.9)); if (p > 0) { g.save(); g.translate(720, 1100); g.rotate(0.06); g.scale(p, p); fs(() => { g.beginPath(); g.roundRect(-220, -150, 440, 300, 24); }, '#ffffff', 6);
    g.font = FZ(40, 700); g.fillStyle = '#888'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(S.bed.title, 0, -80); g.font = FZ(Math.min(80, 400 / S.bed.big.length * 1.4)); g.fillStyle = '#e02424'; g.fillText(S.bed.big, 0, 10); g.font = FZ(34, 700); g.fillStyle = '#888'; g.fillText(S.bed.sub, 0, 90); g.restore(); } }
  if (i === 39) { const hb = Math.max(0, Math.sin(t * 9)) ** 4; g.fillStyle = `rgba(255,40,80,${0.12 * hb})`; g.fillRect(0, 0, W, H); }
  g.fillStyle = `rgba(10,14,40,${moon ? 0.25 * (1 - gold) : 0.25})`; g.fillRect(0, 0, W, H);
}

// ───────── camera ─────────
const HX = { A: 300, B: 780 };
function shotOf(i, t) {
  const w = whoOf(i);
  if (w === 'X' || w === 'H') return { k: 'wide' };
  if (CHORUS(i)) return { k: 'med', s: w };
  if (TRAP(i)) { const b = Math.floor((beatOf(t) - beatOf(lineStart(i))) / 2); return { k: ['close', 'dutch', 'xcu', 'low'][(b + i) % 4], s: w }; }
  if (PUNCH[i] && t >= punchT(i) - 0.35 && t < punchT(i) + 0.7) return { k: 'xcu', s: w };
  if (i === 41) return { k: t < punchT(41) - 1.0 ? 'low' : 'wide' };
  const chunk = Math.floor(i / 2);
  if (i % 2 === 0) return { k: ['med', 'close', 'low', 'med'][chunk % 4], s: w };
  return { k: chunk % 2 ? 'close' : 'dutch', s: w };
}
function camOf(sh) {
  const f = sh.s === 'B' ? -1 : 1, hx = HX[sh.s] || 540;
  switch (sh.k) {
    case 'wide': return { x: 540, y: 960, z: 1, r: 0 };
    case 'med': return { x: hx, y: 873, z: 1.35, r: 0 };
    case 'close': return { x: hx, y: 890, z: 1.8, r: 0 };
    case 'xcu': return { x: hx + 12 * f, y: 970, z: 2.9, r: 0 };
    case 'low': return { x: hx + 40 * f, y: 900, z: 1.5, r: 0.045 * f };
    case 'dutch': return { x: hx, y: 900, z: 1.8, r: -0.09 * f };
    case 'ots': return { x: hx + 110 * f, y: 880, z: 1.45, r: 0 };
  }
}

// ───────── overlays ─────────
function hud(t, i) {
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = FZ(48); g.fillStyle = A_COL; g.fillText(S.A.name, 230, 262); g.fillStyle = B_COL; g.fillText(S.B.name, 850, 262);
  g.font = FZ(60); g.fillStyle = GOLD; g.fillText('VS', 540, 264);
  let v = 0;
  for (const k in PUNCH) { const p = seg(t, punchT(+k), punchT(+k) + 0.3); v += (whoOf(+k) === 'A' ? 1 : -1) * p * 0.16; }
  if (i >= 41) v *= 1 - clamp((t - lineStart(41)) / 2);
  v = clamp(v, -0.9, 0.9);
  g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(140, 316, 800, 18);
  g.fillStyle = A_COL; g.fillRect(140, 316, 400 + 400 * v, 18); g.fillStyle = B_COL; g.fillRect(540 + 400 * v, 316, 400 - 400 * v, 18);
  g.fillStyle = '#fff'; g.fillRect(536 + 400 * v, 306, 8, 38);
}
function roundCard(t, i) {
  for (const k in ROUNDS) { const t0 = +k === 0 ? 2.6 : lineStart(+k), u = t - t0; if (u < 0 || u > 1.3) continue;
    const p = E.o3(clamp(u / 0.18)), q = E.i2(clamp((u - 1.05) / 0.25));
    g.save(); g.translate(lerp(-W, 0, p) + lerp(0, W, q), 0);
    g.fillStyle = GOLD; g.fillRect(0, 1200, W, 130); g.fillStyle = INK; g.fillRect(0, 1200, W, 10); g.fillRect(0, 1320, W, 10);
    g.font = FZ(76); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.fillText(ROUNDS[k], 540, 1267); g.restore(); }
}
function slam(t) {
  for (const k in PUNCH) { const tp = punchT(+k), u = t - tp; if (u < -0.02 || u > 0.85) continue;
    const p = E.back(clamp((u + 0.02) / 0.14), 2.8), out = clamp((u - 0.7) / 0.15);
    const col = whoOf(+k) === 'A' ? A_COL : B_COL, s = PUNCH[k];
    g.save(); g.translate(540, 1230); g.rotate(whoOf(+k) === 'A' ? -0.06 : 0.06); g.scale(p * (1 - out), p * (1 - out));
    const px = Math.min(200, 900 / s.length);
    g.font = FZ(px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.lineWidth = px * 0.24; g.strokeStyle = INK; g.strokeText(s, 8, 10); g.strokeText(s, 0, 0); g.fillStyle = col; g.fillText(s, 6, 6); g.fillStyle = '#fff'; g.fillText(s, 0, 0);
    g.restore(); }
}
function flash(t) { let a = 0; for (const k in PUNCH) { const u = t - punchT(+k); if (u >= 0 && u < 0.12) a = Math.max(a, 0.55 * (1 - u / 0.12)); } const d = t - lineStart(41); if (d >= 0 && d < 0.2) a = Math.max(a, 0.8 * (1 - d / 0.2)); if (a > 0) { g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(0, 0, W, H); } }
function lyrics(t, i) {
  const L = TM.lines[i], col = L.who === 'A' ? A_COL : L.who === 'B' ? B_COL : GOLD;
  g.fillStyle = 'rgba(8,4,16,0.82)'; g.beginPath(); g.roundRect(40, 1360, W - 80, 220, 28); g.fill();
  const name = { A: S.A.name, B: S.B.name, H: '旁白', X: '合唱' }[L.who];
  g.font = FZ(32); g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(name, 76, 1408);
  const longest = Math.max(...L.halves.map(h => h.length)), px = Math.min(62, Math.floor(920 / longest));
  L.halves.forEach((half, hi) => {
    let x = 76; const y = 1478 + hi * 72;
    for (const c of half) { const on = t >= c.t - 0.02, cur = on && t < c.e;
      g.font = FZ(px); g.fillStyle = on ? (cur ? '#fff' : col) : 'rgba(255,255,255,0.28)';
      g.save(); g.translate(x + px / 2, y); const s = cur ? 1.14 : 1; g.scale(s, s); g.textAlign = 'center'; g.fillText(c.c, 0, 0); g.restore(); x += px * 1.02; }
  });
}
function explainer(t, i, shot) {
  if (shot === 'xcu') return;
  g.save(); g.fillStyle = 'rgba(6,3,14,0.72)'; g.beginPath(); g.roundRect(70, 380, 940, 400, 28); g.fill();
  g.strokeStyle = whoOf(i) === 'A' ? 'rgba(61,123,255,0.6)' : whoOf(i) === 'B' ? 'rgba(255,61,139,0.6)' : 'rgba(255,201,40,0.6)'; g.lineWidth = 4; g.stroke();
  g.beginPath(); g.roundRect(70, 380, 940, 400, 28); g.clip();
  g.translate(540, 580); g.scale(0.52, 0.52); g.translate(-540, -640); wallArt(i, t); g.restore();
}
function vote(t, i) {
  if (!(CHORUS(i) && whoOf(i) === 'X') && i < 42) return;
  const v = 0.5 + 0.12 * Math.sin(t * 2.3);
  g.save(); g.translate(0, 0);
  g.fillStyle = 'rgba(8,4,16,0.75)'; g.beginPath(); g.roundRect(60, 1180, 960, 150, 24); g.fill();
  g.font = FZ(40); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('你站哪边？', 540, 1218);
  g.fillStyle = A_COL; g.fillRect(100, 1256, 880 * v, 46); g.fillStyle = B_COL; g.fillRect(100 + 880 * v, 1256, 880 * (1 - v), 46);
  g.font = FZ(32); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(S.A.side + ' · ' + S.A.name, 120, 1280); g.textAlign = 'right'; g.fillText(S.B.side + ' · ' + S.B.name, 960, 1280);
  g.restore();
}
function confetti(t, t0, n = 120) {
  const u = t - t0; if (u < 0) return; const r = rnd(42);
  for (let k = 0; k < n; k++) { const x = r() * W, sp = 300 + r() * 500, y = -80 + u * sp - r() * 600, a = u * (3 + r() * 6);
    if (y < -60 || y > H) continue; g.save(); g.translate(x + Math.sin(u * 2 + k) * 40, y); g.rotate(a); g.fillStyle = [GOLD, A_COL, B_COL, '#fff'][k % 4]; g.fillRect(-14, -7, 28, 14); g.restore(); }
}
function money(t, t0, t1) {
  if (t < t0 || t > t1 + 2) return; const r = rnd(9);
  for (let k = 0; k < 40; k++) { const st = t0 + r() * (t1 - t0), u = t - st; if (u < 0 || u > 2.2) continue;
    const x = r() * W, y = -100 + u * 700; g.save(); g.translate(x + Math.sin(u * 3 + k) * 60, y); g.rotate(u * 2 + k); fs(() => { g.beginPath(); g.rect(-60, -30, 120, 60); }, '#8fd18a', 4); g.font = FZ(36); g.fillStyle = '#2c6a2a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('¥', 0, 2); g.restore(); }
}
function endCard(t) {
  const t0 = lastT(N - 1) + 0.8; if (t < t0) return; const p = E.o3(clamp((t - t0) / 0.4));
  g.fillStyle = `rgba(8,4,16,${0.93 * p})`; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = p; g.textAlign = 'center'; g.textBaseline = 'middle';
  { const fa = Math.min(130, 380 / S.A.title.length), fb = Math.min(130, 380 / S.B.title.length); g.font = FZ(fa); g.fillStyle = A_COL; g.fillText(S.A.title, 300, 760); g.fillStyle = GOLD; g.font = FZ(80); g.fillText('vs', 540, 770); g.font = FZ(fb); g.fillStyle = B_COL; g.fillText(S.B.title, 780, 760); }
  g.font = FZ(62); g.fillStyle = '#fff'; g.fillText('你站哪边？评论区见', 540, 960);
  g.font = FZ(44, 700); g.fillStyle = GOLD; g.fillText(S.endSub || '下一集 · 新的对决', 540, 1080);
  g.restore();
}
function glitch(t) {
  const k = kickAt(t, 0.05); if (k < 0.3) return; const r = rnd(Math.floor(t * 48)), cv = g.canvas;
  for (let q = 0; q < 6; q++) { const y = r() * H, h = 20 + r() * 80, dx = (r() - 0.5) * 80 * k; g.drawImage(cv, 0, y, W, h, dx, y, W, h); }
  g.fillStyle = `rgba(255,61,139,${0.12 * k})`; g.fillRect(0, 0, W, H);
}

// ───────── frame ─────────
export function renderFilm(t) {
  const i = activeLine(t), tc = charTime(t), scene = SCENE(i);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (scene === 'street') {
    const fight = street(t);
    const u = t - fight; if (u > 0) { g.fillStyle = `rgba(255,255,255,${clamp(u / 0.15)})`; g.fillRect(0, 0, W, H); }
    lyrics(t, i);
    return;
  }
  if (scene === 'bed') { bedroom(t, i, tc); lyrics(t, i); roundCard(t, i); return; }
  // stage: hard cuts between shots; a whip pan when the mic changes hands
  const sh = shotOf(i, t), c0 = camOf(sh);
  let c = c0;
  if (i > 0 && SCENE(i - 1) === 'stage' && whoOf(i - 1) !== whoOf(i) && whoOf(i) !== 'X') {
    const u = (t - lineStart(i)) / 0.16;
    if (u < 1) { const p = camOf(shotOf(i - 1, lineStart(i) - 0.01)), e = E.io(u); c = { x: lerp(p.x, c0.x, e), y: lerp(p.y, c0.y, e), z: lerp(p.z, c0.z, e), r: lerp(p.r, c0.r, e) }; }
  }
  const pz = Object.keys(PUNCH).reduce((m, k) => { const u = t - punchT(+k); return u >= 0 && u < 0.25 ? Math.max(m, 0.12 * (1 - u / 0.25)) : m; }, 0);
  const z = c.z * (1 + 0.012 * snareAt(t) + pz), sx = 4 * kickAt(t, 0.06);
  g.save(); g.translate(W / 2, H / 2); g.rotate(c.r); g.scale(z, z); g.translate(-c.x - sx, -c.y + sx);
  stage(t, i); stageRappers(t, i, tc);
  g.restore();
  explainer(t, i, sh.k);
  if (sh.k === 'ots') { // the listener in the foreground, dark and soft
    const other = sh.s === 'A' ? 'B' : 'A', oc = off.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, W, H);
    g = oc; rapper(other, other === 'B' ? 1150 : -70, 2400, tc, { s: 1.7, active: false, expr: 'roll', listen: 'cross' }); g = G0;
    g.save(); g.filter = 'brightness(0.22) blur(6px)'; g.drawImage(off, 0, 0); g.restore();
  }
  if (S.lines[i].gesture === 'throw' || S.money) money(t, lineStart(i), lastT(i));
  if (i >= 41) confetti(t, lineStart(41));
  if (TRAP(i)) glitch(t);
  crowd(t, i);
  hud(t, i);
  vote(t, i);
  slam(t);
  lyrics(t, i);
  roundCard(t, i);
  flash(t);
  // the street → stage cut lands on a white frame that fades
  const d = t - lineStart(6); if (d >= 0 && d < 0.25) { g.fillStyle = `rgba(255,255,255,${1 - d / 0.25})`; g.fillRect(0, 0, W, H); }
  endCard(t);
}
