#!/usr/bin/env python3
"""upload.py <script.json> <video.mp4> <result.json>: add the film to the econ-battles branch (orphan) and its index."""
import json, os, shutil, subprocess, sys
S = json.load(open(sys.argv[1])); vid = sys.argv[2]; R = json.load(open(sys.argv[3]))
LIB = '/projects/sandbox/wordfilm'; WT = '/projects/sandbox/.wt-econ'; HERE = os.path.dirname(os.path.abspath(__file__))
run = lambda c, cwd=LIB: subprocess.run(c, shell=True, cwd=cwd, check=True, capture_output=True, text=True).stdout
has = subprocess.run('git ls-remote --exit-code --heads origin econ-battles', shell=True, cwd=LIB, capture_output=True).returncode == 0
shutil.rmtree(WT, ignore_errors=True); run('git worktree prune')
if has:
    run('git fetch -q origin econ-battles'); run(f'git worktree add -q --detach {WT} origin/econ-battles')
else:
    run(f'git worktree add -q --detach {WT}'); run('git checkout -q --orphan econ-battles && git rm -rq --cached . && find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +', WT)
os.makedirs(f'{WT}/videos', exist_ok=True); os.makedirs(f'{WT}/scripts', exist_ok=True); os.makedirs(f'{WT}/pipeline', exist_ok=True)
shutil.copy(vid, f'{WT}/videos/{S["slug"]}.mp4'); shutil.copy(sys.argv[1], f'{WT}/scripts/{S["slug"]}.json')
for f in ('make.py', 'score.py', 'voices.py', 'upload.py'): shutil.copy(f'{HERE}/{f}', f'{WT}/pipeline/{f}')
for f in ('film.js', 'cards.js', 'index.html'): shutil.copy(f'{LIB}/films/battle-tpl/{f}', f'{WT}/pipeline/{f}')
shutil.copy('/projects/sandbox/rap/build_timing.py', f'{WT}/pipeline/build_timing.py')
idx = f'{WT}/index.json'; I = json.load(open(idx)) if os.path.exists(idx) else []
I = [x for x in I if x['slug'] != S['slug']] + [R]; I.sort(key=lambda x: x['slug']); json.dump(I, open(idx, 'w'), ensure_ascii=False, indent=1)
rows = '\n'.join(f"| {x['slug'][:2]} | [{x['title']}](videos/{x['slug']}.mp4) | {x['dur']} s | {round(x['acc']*100,1)}% | [歌词与卡片](scripts/{x['slug']}.json) |" for x in I)
open(f'{WT}/README.md', 'w').write(f"""# 经济学说唱对战（CFA / FRM 术语系列）

每部约 2 分钟、9:16 竖屏的动画 MV：两个角色各持一方观点对战，副歌引导「你站哪边」，每句配一张解释卡。音乐用 ElevenLabs Music v2.5 生成，每部挑歌词识别率最高、男女声分得开的一版。

点视频名，再点 **View raw** 或下载按钮观看。

| # | 对战 | 时长 | 歌词识别率 | 脚本 |
|---|---|---|---|---|
{rows}

`pipeline/` 是生成用的代码（模板 film.js / cards.js 和流水线 make.py），`scripts/` 是每部片的脚本。
""")
run('git add -A && git commit -qm "econ battle: ' + S['slug'] + '" && git push -q origin HEAD:econ-battles', WT)
run(f'git worktree remove --force {WT}')
print('uploaded', S['slug'])
