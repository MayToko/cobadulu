#!/usr/bin/env bash
# make_video.sh <build.py> <workdir>   (workdir berisi vo_raw.mp3 + words.json)
# → story.json, video_silent.mp4, mix.wav, FINAL.mp4
set -e
BUILD="$(realpath "$1")"; W="$(realpath "$2")"; D="$(cd "$(dirname "$0")" && pwd)"
TEMPO="${TEMPO:-1.25}"
cd "$W"
[ -e "$D/node_modules/three" ] || (cd "$D" && npm install --silent)
python3 "$BUILD" words.json story.json
node "$D/render.js" story.json video_silent.mp4
python3 "$D/audio.py" vo_raw.mp3 story.json mix.wav --tempo "$TEMPO"
ffmpeg -v error -y -i video_silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart FINAL.mp4
ffprobe -v error -show_entries format=duration:stream=width,height,r_frame_rate -of compact FINAL.mp4
