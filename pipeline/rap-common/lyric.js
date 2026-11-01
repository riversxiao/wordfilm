// Shared timing helpers for the rap / battle films. loadTiming(url) fills TM from a build_timing.py timing.json:
// { bpm, beat, phase, dur, lines[{ text, who, chars[{c, t, e, py, fin, v} | {c, p:1}] }], kicks[], snares[], env{rate, v[]} }
// Each line gets s0 (first sung char time) and halves (sung chars split at the first inner comma, for a two-row lyric box).
export const TM = { bpm: 92, beat: 60 / 92, phase: 0, dur: 0, lines: [], kicks: [], snares: [], env: { rate: 48, v: [] } };
export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));

function splitHalves(chars) {
  const halves = [[]];
  chars.forEach((c, k) => {
    if (c.p) { if (halves[halves.length - 1].length && halves.length < 2 && chars.slice(k + 1).some(x => !x.p)) halves.push([]); return; }
    halves[halves.length - 1].push(c);
  });
  return halves.filter(h => h.length);
}

export async function loadTiming(url) {
  const d = await (await fetch(url)).json();
  Object.assign(TM, d);
  for (const L of TM.lines) {
    const sung = L.chars.filter(c => !c.p);
    L.s0 = sung.length ? sung[0].t : L.t0;
    L.halves = splitHalves(L.chars);
  }
  TM.kicks.sort((a, b) => a - b); TM.snares.sort((a, b) => a - b);
  return TM;
}

// last onset at or before t (binary search)
function lastBefore(arr, t) {
  let lo = 0, hi = arr.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r < 0 ? null : arr[r];
}
// 1 at the hit, decaying exponentially over `d` seconds
const hitAt = (arr, t, d) => { const k = lastBefore(arr, t); return k === null ? 0 : Math.exp(-(t - k) / d); };
export const kickAt = (t, d = 0.1) => hitAt(TM.kicks, t, d);
export const snareAt = (t, d = 0.1) => hitAt(TM.snares, t, d);
export const beatOf = t => (t - TM.phase) / TM.beat;
export const envAt = t => { const v = TM.env.v, i = Math.floor(t * TM.env.rate); return i >= 0 && i < v.length ? v[i] : 0; };
