#!/usr/bin/env python3
"""score.py <dir> <seed>: pinyin match of Whisper on the full mix against the lyric → {"acc": 0..1}"""
import difflib, json, subprocess, sys
from faster_whisper import WhisperModel
from opencc import OpenCC
from pypinyin import lazy_pinyin
d, s = sys.argv[1], sys.argv[2]; P = "，。、！？ ,.!?\ufffd"; cc = OpenCC('t2s')
subprocess.run(f'ffmpeg -loglevel error -y -i {d}/take_{s}.mp3 -ar 16000 -ac 1 {d}/take_{s}.wav', shell=True, check=True)
W = json.load(open(f'{d}/meta_{s}.json'))["words_timestamps"]
ref = ''.join(c for x in W for c in x["word"] if c not in P)
segs, _ = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8").transcribe(f'{d}/take_{s}.wav', language="zh")
hyp = ''.join(c for sg in segs for c in cc.convert(sg.text) if c not in P)
sm = difflib.SequenceMatcher(None, lazy_pinyin(ref), lazy_pinyin(hyp), autojunk=False)
print(json.dumps({"acc": sum(b.size for b in sm.get_matching_blocks()) / max(1, len(ref)), "lines": len(W)}))
