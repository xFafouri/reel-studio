#!/usr/bin/env bash
# Lip check for AI clips (Veo / Omni / any talking character): tiles one region of the clip (the mouth) at N frames a
# second with the time on each tile, so you can SEE when the lips move without listening — then make sure no mouth
# moves where there is no voice (cut it, retime it, or end on a closed-mouth frame).
#   bash mouth-tiles.sh clip.mp4 <w:h:x:y crop> [fps=6] [from=0] [to=end] [out=clip.mouth.jpg]
#   e.g. bash mouth-tiles.sh clips/hook.mp4 260:180:410:620 6 0 4
# Find the crop on one frame first:  ffmpeg -ss 1 -i clip.mp4 -frames:v 1 f.jpg  (then read x/y off the picture).
set -euo pipefail
IN=${1:?usage: mouth-tiles.sh clip.mp4 w:h:x:y [fps] [from] [to] [out]}
CROP=${2:?crop w:h:x:y}
FPS=${3:-6}; FROM=${4:-0}; TO=${5:-}; OUT=${6:-${IN%.*}.mouth.jpg}
FF=${FFMPEG:-$(node -e 'try{console.log(require("ffmpeg-static"))}catch{console.log("ffmpeg")}' 2>/dev/null || echo ffmpeg)}
FP=${FFPROBE:-$(node -e 'try{console.log(require("ffprobe-static").path)}catch{console.log("ffprobe")}' 2>/dev/null || echo ffprobe)}
END=${TO:-$("$FP" -v error -show_entries format=duration -of csv=p=0 "$IN")}
N=$(awk -v a="$FROM" -v b="$END" -v f="$FPS" 'BEGIN{n=int((b-a)*f); if(n<1)n=1; print n}')
COLS=8; ROWS=$(( (N + COLS - 1) / COLS ))
"$FF" -hide_banner -loglevel error -y -ss "$FROM" -to "$END" -i "$IN" \
  -vf "fps=$FPS,crop=$CROP,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=16:fontcolor=white:box=1:boxcolor=black@0.6,tile=${COLS}x${ROWS}:padding=3:color=white" \
  -frames:v 1 "$OUT" 2>/dev/null \
|| "$FF" -hide_banner -loglevel error -y -ss "$FROM" -to "$END" -i "$IN" -vf "fps=$FPS,crop=$CROP,tile=${COLS}x${ROWS}:padding=3:color=white" -frames:v 1 "$OUT"
echo "$N tiles ($FPS per second from ${FROM}s) → $OUT"
