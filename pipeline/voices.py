#!/usr/bin/env python3
"""voices.py <dir> <seed>: median F0 of A and B lines on the vocal stem; ok = lines on the right side of the midpoint."""
import json, subprocess, sys
import librosa, numpy as np
d, s = sys.argv[1], sys.argv[2]; WHO = 'BBAAHHAAAABBBBAABBXXAABBAABBAABBXXAABBBBAAXX'
subprocess.run(f'ffmpeg -loglevel error -y -i {d}/st_{s}/vocals.mp3 -ar 16000 -ac 1 {d}/st_{s}/v16.wav', shell=True, check=True)
W = json.load(open(f'{d}/meta_{s}.json'))["words_timestamps"]; y, sr = librosa.load(f'{d}/st_{s}/v16.wav', sr=16000); row = []
for x, w in zip(W, WHO):
    seg = y[int(x["start_ms"] / 1000 * sr):int(x["end_ms"] / 1000 * sr)]
    f0, _, _ = librosa.pyin(seg, fmin=70, fmax=500, sr=sr)
    row.append((w, float(np.nanmedian(f0)) if np.any(~np.isnan(f0)) else 0.0))
A = [f for w, f in row if w == 'A' and f]; B = [f for w, f in row if w == 'B' and f]
a, b = float(np.median(A)), float(np.median(B)); thr = (a + b) / 2
ok = sum(1 for w, f in row if (w == 'A' and 0 < f < thr) or (w == 'B' and f > thr))
print(json.dumps({"a": int(a), "b": int(b), "ok": ok, "of": 36}))
