# rap-common

battle 模板（`film.js` / `index.html`）引用的公共文件，渲染前放到库里的 `films/rap-common/`：

```sh
mkdir -p films/rap-common/fonts
cp pipeline/rap-common/lyric.js films/rap-common/
cp pipeline/rap-common/fonts/fonts.css films/rap-common/fonts/
curl -fL -o films/rap-common/fonts/NotoSansSC.ttf "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
```

- `lyric.js`：读 `build_timing.py` 生成的 timing.json，提供 `TM`、`loadTiming`、`kickAt`、`snareAt`、`beatOf`、`envAt`、`clamp`、`lerp`、`seg`。每行补上 `s0`（第一个字的时间）和 `halves`（按第一个逗号分成两行歌词）。
- `fonts/fonts.css`：Noto Sans SC 可变字重（字体文件 OFL 授权，太大不入库，用上面的命令下载）。
