#!/usr/bin/env bash
# make_video.sh <build.py> <workdir>   (workdir berisi vo_raw.mp3 + words.json [+ foto produk])
# Alur: build.py → story.json → render 3D (render.js) → audio (audio.py) → finishing → FINAL.mp4
#   FINISH=hyperframes (default): caption, rumus & end card disusun HyperFrames (HTML+GSAP) → proyek hf/ bisa diedit di Studio
#   FINISH=engine               : caption & rumus dibakar langsung oleh engine (cara lama)
set -e
BUILD="$(realpath "$1")"; W="$(realpath "$2")"; D="$(cd "$(dirname "$0")" && pwd)"
TEMPO="${TEMPO:-1.25}"; FINISH="${FINISH:-hyperframes}"
export HYPERFRAMES_NO_UPDATE_CHECK=1 HYPERFRAMES_NO_TELEMETRY=1
cd "$W"
[ -e "$D/node_modules/three" ] && [ -e "$D/node_modules/hyperframes" ] || (cd "$D" && npm install --silent)
python3 "$BUILD" words.json story.json
if [ "$FINISH" = "hyperframes" ]; then
  python3 -c "import json;p='story.json';s=json.load(open(p));s['finish']='hyperframes';json.dump(s,open(p,'w'),indent=1)"
fi
node "$D/render.js" story.json video_silent.mp4
python3 "$D/audio.py" vo_raw.mp3 story.json mix.wav --tempo "$TEMPO"
if [ "$FINISH" = "hyperframes" ]; then
  rm -rf hf && python3 "$D/hf_compose.py" story.json video_silent.mp4 mix.wav hf
  "$D/node_modules/.bin/hyperframes" lint hf
  "$D/node_modules/.bin/hyperframes" render hf -o FINAL.mp4 --quality delivery --crf 23 --max-bitrate 3M --workers 2 --no-browser-gpu
else
  ffmpeg -v error -y -i video_silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 23 -maxrate 3M -bufsize 6M -pix_fmt yuv420p \
    -c:a aac -b:a 160k -shortest -movflags +faststart FINAL.mp4
fi
ffprobe -v error -show_entries format=duration,size:stream=width,height,r_frame_rate -of compact FINAL.mp4
