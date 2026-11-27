#!/bin/bash
# usage: render2.sh input.mp3 background.png output.mp4 [seconds]
IN="$1"; BG="$2"; OUT="$3"; T="${4:-}"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN"); [ -n "$T" ] && DUR=$T
TOPT=""; [ -n "$T" ] && TOPT="-t $T"
FR=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
ffmpeg -y -v error -stats $TOPT -i "$IN" -loop 1 -framerate 30 -i "$BG" -filter_complex "
[0:a]asplit=2[a1][aout];
[a1]volume=8,showfreqs=s=1600x200:mode=bar:fscale=log:ascale=cbrt:win_size=4096:averaging=3:colors=white:rate=30,drawgrid=w=10:h=2000:t=3:color=black,format=rgba,colorchannelmixer=rr=0.80:gg=1:bb=0.75,colorkey=black:0.05:0.1,split[b1][b2];
[b2]gblur=sigma=10,colorchannelmixer=rr=0.6:gg=1:bb=0.4:aa=0.8[glow];
[1:v]scale=1920:1080,setsar=1[bg];
[bg][glow]overlay=160:780[v0];[v0][b1]overlay=160:780[v1];
color=c=0xB8E986:s=1600x4:r=30,format=rgba[pg];color=c=black@0:s=1600x4:r=30,format=rgba[pt];[pg][pt]hstack,crop=w=1600:h=4:x='1600-1600*t/$DUR':y=0[pb];
[v1]drawbox=x=160:y=980:w=1600:h=2:color=white@0.6:t=fill,drawbox=x=160:y=1012:w=1600:h=4:color=white@0.2:t=fill[v2];
[v2][pb]overlay=160:1012:shortest=1,
 drawtext=fontfile=$FR:text='%{pts\:gmtime\:0\:%M\\\\\:%S}':fontsize=24:fontcolor=white@0.85:x=160:y=1028,
 format=yuv420p[vout]" \
 -map "[vout]" -map "[aout]" -t $DUR -c:v libx264 -preset medium -crf 22 -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT"
