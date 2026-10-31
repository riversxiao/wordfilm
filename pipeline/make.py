#!/usr/bin/env python3
"""Econ rap battle MV, end to end: make.py <script.json> [--takes 2] [--no-upload]

script.json (see scripts/*.json): slug, title, hookTag, A/B {name, title, side, badge}, street, bed, rounds?,
lines[44] {who, text, punch?, card?, gesture?}. The 44-line form is fixed (22 two-line chunks):
 0-1 B cold open · 2-3 A cold open · 4-5 narrator · 6-9 A verse · 10-13 B verse · 14-19 hook (A, B, both)
 20-27 trades A/B/A/B · 28-33 hook · 34-35 A trap · 36-37 B trap · 38-39 B breakdown · 40-41 A answer · 42-43 both.
Steps (each skipped when its output exists, so a rerun resumes): song takes → pick by lyric accuracy → stems →
male/female check on the vocal stem → per-char timing → render (template films/battle-tpl) → mux → push to the
`econ-battles` branch and append the index. Needs ELEVENLABS_API_KEY in the environment.
"""
import difflib, email, json, os, shutil, subprocess, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SB = '/projects/sandbox'; LIB = f'{SB}/wordfilm'; PY = f'{SB}/.venv-test/bin/python'
ENV = dict(os.environ, PATH=f'{SB}/.tools/ffmpeg:' + os.environ['PATH'], PLAYWRIGHT_BROWSERS_PATH=f'{SB}/.tools/pw', HF_HOME=f'{SB}/.tools/hf')
BPM = 92; BAR = 60 / BPM * 4 * 1000; D = int(round(2 * BAR))
WHO = 'BBAAHHAAAABBBBAABBXXAABBAABBAABBXXAABBBBAAXX'
KEY = os.environ['ELEVENLABS_API_KEY']


def sh(cmd, **kw):
    r = subprocess.run(cmd, shell=True, env=ENV, capture_output=True, text=True, **kw)
    if r.returncode:
        print(r.stdout[-2000:], r.stderr[-2000:]); raise SystemExit(f'failed: {cmd[:120]}')
    return r.stdout


def plan(S):
    boom = ["92 BPM", "4/4 time", "hard boom-bap", "punchy kick and cracking snare", "vinyl scratches", "catchy brass and piano sample", "deep sub bass"]
    trap = ["92 BPM", "4/4 time", "beat switch to hard trap", "booming 808 bass", "rapid hi-hat rolls"]
    hook = ["92 BPM", "4/4 time", "catchy anthem chorus beat", "big drums", "brass stabs", "crowd chanting"]
    neg = ["singing", "autotune", "English lyrics"]
    VA = ["Rapper A: deep low baritone MALE Mandarin rapper", "confident punchy delivery"]
    VB = ["Rapper B: bright high FEMALE Mandarin rapper", "cheeky sassy delivery"]
    def ch(tag, text, beat, voice, extra, negx, d=D):
        return {"text": f"[{tag}]\n" + text, "duration_ms": d, "positive_styles": voice + beat + extra + ["clear Mandarin diction", "rap, not singing"],
                "negative_styles": neg + negx, "context_adherence": "high", "conditioning_ref": None, "condition_strength": None}
    L = [l['text'] for l in S['lines']]; two = lambda k: L[2 * k] + '\n' + L[2 * k + 1]
    A = lambda k, beat=boom, ex=["on-beat flow"], tag="Verse - Rapper A": ch(tag, two(k), beat, VA, ex, ["female vocal", "high voice"])
    B = lambda k, beat=boom, ex=["on-beat flow"], tag="Verse - Rapper B": ch(tag, two(k), beat, VB, ex, ["male vocal", "low voice"])
    X = lambda k, ex=[]: ch("Chorus - both rappers together", two(k), hook, ["male and female rappers in unison", "crowd chanting along"], ex, [])
    bt = ["back-and-forth battle", "sharp comeback"]
    chunks = [B(0, boom, ["provocative shout", "sudden start"], "Cold open - Rapper B"), A(1, boom, ["punchline comeback"], "Cold open - Rapper A"),
              ch("Narrator - hype man", two(2), boom, ["hype man narrating", "DJ scratch", "crowd cheering"], [], []),
              A(3), A(4), B(5), B(6),
              A(7, hook, ["catchy chant flow"], "Chorus - Rapper A"), B(8, hook, ["catchy chant flow"], "Chorus - Rapper B"), X(9),
              A(10, boom, bt), B(11, boom, bt), A(12, boom, bt), B(13, boom, bt),
              A(14, hook, ["catchy chant flow"], "Chorus - Rapper A"), B(15, hook, ["catchy chant flow"], "Chorus - Rapper B"), X(16),
              A(17, trap, ["fast double-time flow"]), B(18, trap, ["fast double-time flow"]),
              ch("Breakdown - Rapper B", two(19), ["92 BPM", "drums drop out completely", "only soft piano and voice"], VB, ["vulnerable half-spoken delivery", "quiet"], ["male vocal", "drums"]),
              A(20, boom, ["beat drops back in hard", "warm confident delivery"]), X(21, ["big ending"]),
              ch("Outro end", "", ["final big hit", "reverb tail", "crowd cheering"], [], [], ["vocals", "rap"], 3200)]
    return {"positive_global_styles": ["Mandarin hip-hop rap battle music video", "a male rapper and a female rapper", "catchy hook", "92 BPM"],
            "negative_global_styles": ["singing", "autotune"], "chunks": chunks}


def compose(S, seed, out):
    if os.path.exists(f'{out}/take_{seed}.mp3'): return
    body = {"composition_plan": plan(S), "model_id": "music_v2_5", "with_timestamps": True, "seed": seed}
    req = urllib.request.Request("https://api.elevenlabs.io/v1/music/detailed?output_format=mp3_44100_192", data=json.dumps(body).encode(),
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=1500); ct = resp.headers.get("Content-Type"); raw = resp.read()
    for p in email.message_from_bytes(b"Content-Type: " + ct.encode() + b"\r\n\r\n" + raw).walk():
        if p.is_multipart(): continue
        d = p.get_payload(decode=True)
        open(f'{out}/meta_{seed}.json' if 'json' in p.get_content_type() else f'{out}/take_{seed}.mp3', 'wb').write(d)


def normalize(S, seed, out):
    # ElevenLabs sometimes splits one lyric line into two timestamp entries: merge them back to the script's 44 lines
    p = f'{out}/meta_{seed}.json'; M = json.load(open(p)); W = M['words_timestamps']
    if len(W) == 44: return
    strip = lambda x: ''.join(c for c in x if c not in "，。、！？ ,.!?")
    out_w, k = [], 0
    for L in S['lines']:
        want = strip(L['text']); acc = None
        while k < len(W):
            x = W[k]; k += 1
            acc = dict(x) if acc is None else {'word': acc['word'] + x['word'], 'start_ms': acc['start_ms'], 'end_ms': x['end_ms']}
            if len(strip(acc['word'])) >= len(want): break
        out_w.append(acc)
    if len(out_w) == 44 and all(o for o in out_w):
        M['words_timestamps'] = out_w; json.dump(M, open(p, 'w'), ensure_ascii=False); print('normalized', len(W), '-> 44')


def stems(seed, out):
    d = f'{out}/st_{seed}'
    if os.path.exists(f'{d}/vocals.mp3'): return d
    os.makedirs(d, exist_ok=True)
    sh(f'curl -sf -o {d}/z.zip -X POST "https://api.elevenlabs.io/v1/music/stem-separation?output_format=mp3_44100_192" -H "xi-api-key: $ELEVENLABS_API_KEY" -F "file=@{out}/take_{seed}.mp3" -F "stem_variation_id=two_stems_v1" && cd {d} && unzip -o -q z.zip')
    return d


def credits():
    req = urllib.request.Request("https://api.elevenlabs.io/v1/user/subscription", headers={"xi-api-key": KEY})
    d = json.load(urllib.request.urlopen(req)); return d['character_count'], d['character_limit']


def main():
    sp = sys.argv[1]; S = json.load(open(sp)); slug = S['slug']
    takes = int(sys.argv[sys.argv.index('--takes') + 1]) if '--takes' in sys.argv else 2
    assert len(S['lines']) == 44 and ''.join(l['who'] for l in S['lines']) == WHO, 'line form'
    out = f'{SB}/rap/runs/{slug}'; os.makedirs(out, exist_ok=True)
    c0 = credits(); print('credits before', c0)
    seeds = [1601 + 911 * k for k in range(4)]
    tried = []
    for seed in seeds:
        if len(tried) >= takes and any(x['acc'] >= 0.9 for x in tried): break
        compose(S, seed, out); normalize(S, seed, out)
        sc = json.loads(sh(f'{PY} {HERE}/score.py {out} {seed}'))
        sc['seed'] = seed; tried.append(sc); print('take', sc)
    tried.sort(key=lambda x: (-x['acc'] if x['acc'] >= 0.88 else 9, ))
    best = None
    for sc in tried:
        if sc['acc'] < 0.85: continue
        d = stems(sc['seed'], out)
        v = json.loads(sh(f'{PY} {HERE}/voices.py {out} {sc["seed"]}'))
        print('voices', sc['seed'], v)
        if v['ok'] >= 27 and v['b'] - v['a'] >= 50: best = (sc, v); break
    if not best: raise SystemExit('no usable take; rerun to try more seeds')
    sc, v = best; seed = sc['seed']; sel = f'{out}/sel'
    if not os.path.exists(f'{sel}/timing.json'):
        os.makedirs(sel, exist_ok=True); shutil.copy(f'{out}/meta_{seed}.json', f'{sel}/meta.json')
        st = f'{out}/st_{seed}'
        sh(f'ffmpeg -loglevel error -y -i {st}/vocals.mp3 -ar 44100 -ac 1 {sel}/vocals.wav && ffmpeg -loglevel error -y -i {st}/instrumental.mp3 -ar 44100 -ac 1 {sel}/instrumental.wav && ffmpeg -loglevel error -y -i {out}/take_{seed}.mp3 -ar 44100 -ac 2 {sel}/battle.wav')
        print(sh(f'{PY} {SB}/rap/build_timing.py {sel} {BPM} {WHO}').splitlines()[0])
    data = f'{LIB}/films/battle-data/{slug}'; os.makedirs(data, exist_ok=True)
    for f in ('timing.json', 'battle.wav'): shutil.copy(f'{sel}/{f}', data)
    shutil.copy(sp, f'{data}/script.json')
    vid = f'{LIB}/films/battle-tpl/out/{slug}.mp4'; final = f'{SB}/rap/out/econ/{slug}.mp4'; os.makedirs(os.path.dirname(final), exist_ok=True)
    if not os.path.exists(final):
        sh(f"cd {LIB} && node core/render/video.mjs films/battle-tpl --size 1080x1920 --fps 24 --workers 5 --q 'd=/films/battle-data/{slug}' --out {vid}")
        print(sh(f'cd {LIB} && sh core/render/mux.sh {vid} {data}/battle.wav {final} 24 0').strip().splitlines()[-3:])
        os.remove(vid)
    c1 = credits(); print('credits after', c1)
    rec = {'slug': slug, 'title': S['title'], 'seed': seed, 'acc': round(sc['acc'], 3), 'voiceA': v['a'], 'voiceB': v['b'], 'credits': c1[0] - c0[0], 'dur': round(json.load(open(f'{sel}/timing.json'))['dur'], 1)}
    json.dump(rec, open(f'{out}/result.json', 'w'), ensure_ascii=False)
    if '--no-upload' not in sys.argv:
        sh(f'{PY} {HERE}/upload.py {sp} {final} {out}/result.json')
    print('DONE', json.dumps(rec, ensure_ascii=False))


if __name__ == '__main__':
    main()
