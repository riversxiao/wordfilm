#!/usr/bin/env python3
"""Per-character timing for a rap track: build_timing.py <dir> <bpm> <who per line, e.g. HAAAABBBBAABBXX>

<dir> holds meta.json (ElevenLabs words_timestamps = one entry per lyric line), vocals.wav, instrumental.wav, battle.wav.
Writes <dir>/timing.json: beat grid, lines with chars {c, t, e, py, fin, v}, speaker per line, real kicks / backbeat
snares from the instrumental, vocal loudness envelope (48 Hz).
Char times: Whisper word times on the clean vocal, matched to the lyric by toneless pinyin (homophones and
traditional output still match); unmatched chars are interpolated inside the line's ElevenLabs span."""
import difflib
import json
import sys

import librosa
import numpy as np
from faster_whisper import WhisperModel
from opencc import OpenCC
from pypinyin import Style, lazy_pinyin, pinyin

d, bpm, who = sys.argv[1], float(sys.argv[2]), sys.argv[3]
P = "，。、！？ ,.!?\ufffd"
cc = OpenCC('t2s')
meta = json.load(open(f"{d}/meta.json"))
lines = meta["words_timestamps"]
assert len(who) == len(lines), (len(who), len(lines))

model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
segs, _ = model.transcribe(f"{d}/vocals.wav", language="zh", word_timestamps=True,
                           initial_prompt=lines[1]["word"] if len(lines) > 1 else None)
asr = []
for s in segs:
    for w in s.words:
        cs = [c for c in cc.convert(w.word) if c not in P]
        for j, c in enumerate(cs):
            asr.append((c, w.start + (w.end - w.start) * j / len(cs)))
lyr = [(i, c) for i, x in enumerate(lines) for c in x["word"] if c not in P]
py0 = lambda c: lazy_pinyin(c)[0].replace('ng', 'n')
sm = difflib.SequenceMatcher(None, [py0(c) for _, c in lyr], [py0(c) for c, _ in asr], autojunk=False)
T = [None] * len(lyr)
for a, b, n in sm.get_matching_blocks():
    for j in range(n):
        T[a + j] = asr[b + j][1]
print("matched", sum(t is not None for t in T), "of", len(T))
for i, x in enumerate(lines):
    idx = [k for k, (li, _) in enumerate(lyr) if li == i]
    s, e = x["start_ms"] / 1000, x["end_ms"] / 1000
    ok = lambda k: T[k] is not None and s - 0.4 <= T[k] <= e + 0.2
    known = [(k, T[k]) for k in idx if ok(k)]
    for k in idx:
        if ok(k):
            continue
        prev = [q for q in known if q[0] < k]; nxt = [q for q in known if q[0] > k]
        a = prev[-1] if prev else (idx[0] - 1, s)
        b = nxt[0] if nxt else (idx[-1] + 1, e - 0.12)
        T[k] = a[1] + (b[1] - a[1]) * (k - a[0]) / (b[0] - a[0])


def vis(ini, fin):
    if ini in ('b', 'p', 'm'):
        return 'M'
    if ini == 'f':
        return 'F'
    if fin in ('a', 'ia', 'ua', 'ao', 'iao', 'ai', 'uai', 'an', 'ang', 'ian', 'iang', 'uan', 'uang'):
        return 'A'
    if fin in ('o', 'u', 'uo', 'ou', 'iu', 'iou', 'ong', 'iong', 'v', 'ü'):
        return 'O'
    if fin in ('i', 'ei', 'ui', 'uei', 'in', 'ing', 'ie', 've', 'üe'):
        return 'I'
    return 'E'


out, k, last = [], 0, 0.0
for i, x in enumerate(lines):
    text = ''.join(c for c in x["word"] if c not in P)
    pys = [p[0] for p in pinyin(text, style=Style.NORMAL)]
    ini = [p[0] for p in pinyin(text, style=Style.INITIALS, strict=False)]
    fin = [p[0] for p in pinyin(text, style=Style.FINALS, strict=False)]
    cs, j = [], 0
    for c in x["word"]:
        if c in P:
            cs.append({"c": c, "p": 1}); continue
        t = max(float(T[k]), last + 0.03); last = t
        cs.append({"c": c, "t": round(t, 3), "py": pys[j], "fin": fin[j], "v": vis(ini[j], fin[j])}); k += 1; j += 1
    sung = [c for c in cs if not c.get("p")]
    out.append({"i": i, "text": x["word"], "t0": s if (s := x["start_ms"] / 1000) else 0, "t1": x["end_ms"] / 1000,
                "who": who[i], "rhyme": sung[-1]["fin"], "chars": cs})
flat = [c for L in out for c in L["chars"] if not c.get("p")]
for a, b in zip(flat, flat[1:]):
    a["e"] = round(min(b["t"], a["t"] + 0.35), 3)
flat[-1]["e"] = round(flat[-1]["t"] + 0.4, 3)

B = 60 / bpm
y, sr = librosa.load(f"{d}/instrumental.wav", sr=22050)
_, beats = librosa.beat.beat_track(y=y, sr=sr, units="time", start_bpm=bpm)
ph = float(np.median(beats % B))
S = np.abs(librosa.stft(y, n_fft=1024, hop_length=256)); f = librosa.fft_frequencies(sr=sr, n_fft=1024)


def ons(lo, hi):
    e = S[(f >= lo) & (f < hi)].sum(0); e = np.maximum(0, np.diff(e, prepend=e[0])); e /= e.max()
    return [round(float(v), 3) for v in librosa.onset.onset_detect(onset_envelope=e, sr=sr, hop_length=256, units="time", delta=0.12, wait=6)]


back = [ph + q * B for q in range(400) if q % 4 in (1, 3)]
snares = [s for s in ons(1800, 6000) if any(abs(s - b) < 0.07 for b in back)]
yv, _ = librosa.load(f"{d}/vocals.wav", sr=22050); hop = int(22050 / 48)
rms = librosa.feature.rms(y=yv, frame_length=hop * 2, hop_length=hop)[0]; rms = rms / np.percentile(rms, 98)
dur = librosa.get_duration(path=f"{d}/battle.wav")
json.dump({"bpm": bpm, "beat": B, "phase": ph, "dur": round(dur, 3), "lines": out, "kicks": ons(30, 140), "snares": snares,
           "env": {"rate": 48, "v": [round(float(min(1, v)), 3) for v in rms]}},
          open(f"{d}/timing.json", "w"), ensure_ascii=False, indent=1)
print("dur %.2f phase %.3f kicks %d snares %d" % (dur, ph, len(ons(30, 140)), len(snares)))
for L in out:
    s = [c["t"] for c in L["chars"] if not c.get("p")]
    print(L["who"], L["text"][:8].ljust(10), round(s[0], 2), round(s[-1], 2), L["rhyme"])
