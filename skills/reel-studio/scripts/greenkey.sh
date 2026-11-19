#!/usr/bin/env bash
# Green background → transparent PNG (props / characters drawn by an image model on solid green, then keyed here).
# The green is SAMPLED from the picture's top-left corner: models never give pure #00FF00 (seen: #07F805, #06FA05).
#   bash greenkey.sh in.png [out.png] [similarity=0.32] [blend=0.06]
# Too much eaten from the subject → lower similarity (0.25); green fringe left → raise it (0.38).
# Works on videos too (out.webm / out.mov with an alpha codec) but check the edges frame by frame.
set -euo pipefail
IN=${1:?usage: greenkey.sh in.png [out.png] [similarity] [blend]}
OUT=${2:-${IN%.*}.key.png}
SIM=${3:-0.32}; BLEND=${4:-0.06}
FF=${FFMPEG:-$(node -e 'try{console.log(require("ffmpeg-static"))}catch{console.log("ffmpeg")}' 2>/dev/null || echo ffmpeg)}
HEX=$("$FF" -hide_banner -loglevel error -i "$IN" -vf "crop=4:4:4:4,scale=1:1:flags=area,format=rgb24" -frames:v 1 -f rawvideo - | od -An -tx1 | tr -d ' \n')
echo "sampled green: #$HEX"
"$FF" -hide_banner -loglevel error -y -i "$IN" -vf "format=rgba,colorkey=0x$HEX:$SIM:$BLEND,despill=type=green" -frames:v 1 "$OUT"
echo "→ $OUT"
