#!/bin/bash
# usage: render.sh input.mp3 output.mp4 [seconds]
IN="$1"; OUT="$2"; T="${3:-}"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
[ -n "$T" ] && DUR=$T
TOPT=""; [ -n "$T" ] && TOPT="-t $T"
FB=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
FR=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
# static background
[ -f bg.png ] || ffmpeg -y -v error -f lavfi -i "color=c=black:s=1920x1080,format=rgb24" -frames:v 1 \
  -vf "geq=r='8+18*exp(-((X-960)^2+(Y-560)^2)/350000)':g='14+60*exp(-((X-960)^2+(Y-560)^2)/350000)':b='12+30*exp(-((X-960)^2+(Y-560)^2)/350000)',vignette=PI/4" bg.png
ffmpeg -y -v error -stats $TOPT -i "$IN" -loop 1 -framerate 30 -i bg.png -filter_complex "
[0:a]asplit=3[a1][a2][aout];
[a1]volume=4.5,showfreqs=s=1600x380:mode=bar:fscale=log:ascale=cbrt:win_size=4096:averaging=3:colors=0x7CFFB0:rate=30,drawgrid=w=10:h=2000:t=3:color=black,format=rgba,colorchannelmixer=rr=0.49:gg=1:bb=0.69,
  colorkey=black:0.05:0.1,split[bars][barsr];
[barsr]vflip,colorchannelmixer=aa=0.25,gblur=sigma=3[refl];
[a2]showwaves=s=1600x120:mode=p2p:colors=0xD8FFE6:rate=30:scale=sqrt,format=rgba,colorkey=black:0.05:0.1,colorchannelmixer=aa=0.6[wave];
[bars]split[b1][b2];[b2]gblur=sigma=12,colorchannelmixer=aa=0.7[glow];
[1:v][glow]overlay=160:240[v0];[v0][b1]overlay=160:240[v1];[v1][refl]overlay=160:622[v2];
[v2][wave]overlay=160:830[v3];
color=c=0x7CFFB0:s=1600x6:r=30,format=rgba[pg];color=c=black@0:s=1600x6:r=30,format=rgba[pt];[pg][pt]hstack,crop=w=1600:h=6:x='1600-1600*t/$DUR':y=0[pb];
[v3]drawbox=x=160:y=1000:w=1600:h=6:color=white@0.15:t=fill[v3b];[v3b][pb]overlay=160:1000:shortest=1[v4];
[v4]drawbox=x=160:y=620:w=1600:h=2:color=0xA8FFC8@0.8:t=fill,
 drawtext=fontfile=$FB:text='TULUS':fontsize=64:fontcolor=white:x=160:y=90,
 drawtext=fontfile=$FR:text='Teh Hijau':fontsize=40:fontcolor=0xA8FFC8:x=160:y=165,
 drawtext=fontfile=$FR:text='%{pts\:gmtime\:0\:%M\\\\\:%S}':fontsize=26:fontcolor=white@0.8:x=160:y=1018,
 format=yuv420p[vout]" \
 -map "[vout]" -map "[aout]" -t $DUR -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k -movflags +faststart -shortest "$OUT"
