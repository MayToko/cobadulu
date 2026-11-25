#!/usr/bin/env bash
# preview.sh story.json outdir  → still tiap shot (60% durasi) + contact sheet berurutan
set -e
ST="$1"; OUT="$2"; D="$(cd "$(dirname "$0")" && pwd)"
T=$(python3 -c "
import json;s=json.load(open('$ST'));t=0;o=[]
for x in s['shots']: o.append(round(t+x['dur']*0.6,2)); t+=x['dur']
print(','.join(map(str,o)))")
rm -rf "$OUT"; node "$D/render.js" "$ST" "$OUT/raw" --stills "$T" 2>&1 | grep -v GPU || true
mkdir -p "$OUT/seq"; i=0
for f in $(ls "$OUT/raw" | sort -t_ -k2 -g); do cp "$OUT/raw/$f" "$OUT/seq/$(printf %03d $i).jpg"; i=$((i+1)); done
ffmpeg -v error -y -i "$OUT/seq/%03d.jpg" -vf "scale=180:320,tile=8x4" "$OUT/sheet_%d.jpg"
ls "$OUT"/sheet_*
