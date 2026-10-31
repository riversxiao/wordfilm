// Explainer card renderer for the battle template. Drawn in "wall space" (centre 540, 640; usable ±800 × ±340),
// scaled into the card box by film.js. Each lyric line has one card: { t: type, ...fields }.
// Types: big · two · chain · bars · counter · formula · stamp · card · curve · balance · coins · clock · vs
export function makeCards(h) {
  const { neon, wtxt, box, arrow, coin, pop, clamp, lerp, E, GOLD } = h;
  const g = new Proxy({}, { get: (_, k) => { const v = h.g[k]; return typeof v === 'function' ? v.bind(h.g) : v; }, set: (_, k, v) => { h.g[k] = v; return true; } });
  const cx = 540, cy = 640;
  const fit = (s, max, w) => Math.min(max * 1.35, w * 1.15 / Math.max(1, [...String(s)].length));
  const draw = {
    big: (c, col) => wtxt(c.text, cx, cy, fit(c.text, 330, 1500), c.color || col),
    two: (c) => { wtxt(c.a, cx - 400, cy - 40, fit(c.a, 260, 700), '#7fb0ff'); wtxt(c.b, cx + 400, cy - 40, fit(c.b, 260, 700), '#ff86b6'); wtxt(c.mid || 'vs', cx, cy - 40, 100, GOLD); if (c.sub) wtxt(c.sub, cx, cy + 250, fit(c.sub, 72, 1500), GOLD, 700); },
    chain: (c, col, b) => { const n = c.items.length, gap = Math.min(380, 1500 / n), x0 = cx - (n - 1) * gap / 2;
      c.items.forEach((s, k) => { if (b < k * 0.6 && !c.all) return; const x = x0 + k * gap, last = k === n - 1; box(x, cy, gap * 0.82, 170, last ? GOLD : col); wtxt(s, x, cy, fit(s, 72, gap * 0.75), last ? GOLD : col);
        if (k) arrow(x - gap + gap * 0.42, cy, x - gap * 0.42, cy, col); });
      if (c.sub) wtxt(c.sub, cx, cy + 250, fit(c.sub, 70, 1500), GOLD, 700); },
    bars: (c, col, b) => { const n = c.items.length, gap = Math.min(420, 1400 / n), x0 = cx - (n - 1) * gap / 2, mx = Math.max(...c.items.map(x => Math.abs(x.v))), grow = E.o3(clamp(b / 2));
      c.items.forEach((it, k) => { const x = x0 + k * gap, hgt = 360 * Math.max(0.04, Math.abs(it.v) / mx) * grow, cc = it.c || [col, GOLD, '#ff86b6', '#7fb0ff'][k % 4];
        neon(() => { g.beginPath(); g.rect(x - gap * 0.3, cy + 230 - hgt, gap * 0.6, hgt); }, cc, 12); g.fillStyle = cc; g.globalAlpha = 0.25; g.fillRect(x - gap * 0.3, cy + 230 - hgt, gap * 0.6, hgt); g.globalAlpha = 1;
        wtxt(it.label, x, cy + 290, fit(it.label, 58, gap * 0.95), cc, 700); if (grow > 0.6) wtxt(it.text || String(it.v), x, cy + 200 - hgt, fit(it.text || String(it.v), 64, gap), cc); });
      if (c.title) wtxt(c.title, cx, cy - 300, fit(c.title, 72, 1500), GOLD); },
    counter: (c, col, b, u, dur) => { const p = E.o3(clamp(u / Math.max(0.5, dur * 0.85))), v = lerp(c.from || 0, c.to, p);
      const s = (c.prefix || '') + (c.dec ? v.toFixed(c.dec) : Math.round(v).toLocaleString('en-US')) + (c.suffix || '');
      wtxt(s, cx, cy - 60, fit(s, 230, 1600), c.color || GOLD); if (c.sub) wtxt(c.sub, cx, cy + 170, fit(c.sub, 72, 1500), col, 700); if (c.sub2) wtxt(c.sub2, cx, cy + 270, fit(c.sub2, 60, 1500), col, 700); },
    formula: (c, col) => { wtxt(c.text, cx, cy - 40, fit(c.text, 170, 1600), GOLD); if (c.sub) wtxt(c.sub, cx, cy + 190, fit(c.sub, 72, 1500), col, 700); },
    stamp: (c) => { g.save(); g.translate(cx, cy - 60); g.rotate(-0.12); neon(() => { g.beginPath(); g.moveTo(-230, -200); g.lineTo(230, 200); g.moveTo(230, -200); g.lineTo(-230, 200); }, '#ff4444', 24); g.restore(); wtxt(c.text, cx, cy + 260, fit(c.text, 110, 1500), GOLD); },
    card: (c, col) => { box(cx, cy - 20, 1500, 600, col); wtxt(c.title, cx, cy - 190, fit(c.title, 100, 1300), col); wtxt(c.big, cx, cy - 20, fit(c.big, 130, 1350), GOLD); if (c.sub) wtxt(c.sub, cx, cy + 160, fit(c.sub, 64, 1350), col, 700); },
    curve: (c, col, b) => { const p = E.o3(clamp(b / 2.5)), X0 = cx - 650, X1 = cx + 650, Y0 = cy + 230;
      neon(() => { g.beginPath(); g.moveTo(X0, Y0); g.lineTo(X1, Y0); g.moveTo(X0, Y0); g.lineTo(X0, cy - 320); }, '#6b6f9d', 5);
      const f = { normal: x => Math.exp(-x * x * 8), fat: x => 1 / (1 + 10 * x * x), up: x => 0.05 + 0.9 * ((x + 0.5) ** 2), down: x => 0.95 - 0.9 * ((x + 0.5) ** 1.5), crash: x => x < 0.25 ? 0.15 + (x + 0.5) * 1.0 : 0.9 - (x - 0.25) * 3.2, wave: x => 0.5 + 0.35 * Math.sin(x * 14), linear: x => 0.15 + (x + 0.5) * 0.7 }[c.kind || 'up'];
      const pts = []; for (let k = 0; k <= 80 * p; k++) { const x = -0.5 + k / 80; pts.push([lerp(X0, X1, x + 0.5), Y0 - 520 * clamp(f(x), 0, 1)]); }
      neon(() => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); }, c.color || col, 10);
      if (c.kind === 'normal' || c.kind === 'fat') { const tail = c.tail ?? 0.32; g.save(); g.globalAlpha = 0.45 * p; g.fillStyle = '#ff4444'; g.beginPath(); g.moveTo(X0, Y0); for (let k = 0; k <= 40; k++) { const x = -0.5 + (0.5 - tail) * k / 40; g.lineTo(lerp(X0, X1, x + 0.5), Y0 - 520 * f(x)); } g.lineTo(lerp(X0, X1, 0.5 - tail + 0.5 - 0.5), Y0); g.closePath(); g.fill(); g.restore(); }
      if (c.label) wtxt(c.label, cx, cy - 300, fit(c.label, 76, 1400), GOLD); if (c.sub) wtxt(c.sub, cx, cy + 300, fit(c.sub, 60, 1400), col, 700); },
    balance: (c, col, b) => { const a = lerp(0, (c.tilt ?? 0) * 0.32, E.o3(clamp(b / 1.5))); g.save(); g.translate(cx, cy - 40); g.rotate(a);
      neon(() => { g.beginPath(); g.moveTo(-600, 0); g.lineTo(600, 0); }, GOLD, 12); wtxt(c.a, -450, -90, fit(c.a, 90, 520), '#7fb0ff'); wtxt(c.b, 450, -90, fit(c.b, 90, 520), '#ff86b6'); g.restore();
      neon(() => { g.beginPath(); g.moveTo(cx, cy - 40); g.lineTo(cx - 90, cy + 200); g.lineTo(cx + 90, cy + 200); g.closePath(); }, GOLD, 8); if (c.sub) wtxt(c.sub, cx, cy + 290, fit(c.sub, 70, 1400), GOLD); },
    coins: (c, col, b) => { const n = Math.min(c.max || 8, 2 ** Math.floor(b)); for (let k = 0; k < n; k++) coin(cx - 630 + (k % 4) * 420, cy - 170 + Math.floor(k / 4) * 260, 115); if (c.sub) wtxt(c.sub, cx, cy + 260, fit(c.sub, 80, 1400), GOLD); },
    clock: (c, col, u) => { neon(() => { g.beginPath(); g.arc(cx, cy - 60, 220, 0, 7); g.moveTo(cx, cy - 60); g.lineTo(cx, cy - 220); g.moveTo(cx, cy - 60); g.lineTo(cx + 140 * Math.cos(u * 3), cy - 60 + 140 * Math.sin(u * 3)); }, col, 10); if (c.sub) wtxt(c.sub, cx, cy + 260, fit(c.sub, 80, 1400), GOLD); },
    vs: (c) => { wtxt(c.a, cx - 330, cy - 40, fit(c.a, 300, 600), '#7fb0ff'); wtxt(c.b, cx + 330, cy - 40, fit(c.b, 300, 600), '#ff86b6'); wtxt(c.mid || '还是', cx, cy + 230, 90, GOLD); },
  };
  return function card(c, col, u, b, dur) {
    if (!c) return;
    g.save(); const s = pop(u); g.translate(cx, cy); g.scale(s, s); g.translate(-cx, -cy);
    (draw[c.t] || draw.big)(c, col, b, u, dur);
    g.restore();
  };
}
