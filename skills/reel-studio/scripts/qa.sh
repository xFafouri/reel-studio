#!/usr/bin/env bash
# Quick check of a finished video before anyone watches it:
#   length, size (MiB), resolution, fps, codecs, loudness (LUFS) + true peak, and a contact sheet of frames.
#   bash qa.sh video.mp4 [every_seconds=2]     → prints the numbers, writes video.sheet.jpg next to the video
# Targets for Reels/Shorts: 1080x1920, 30 fps, h264 + aac, about -14 LUFS, peak under -1 dBTP, size as small as
# the platform or upload route needs.
set -euo pipefail
IN=${1:?usage: qa.sh video.mp4 [every_seconds]}
EVERY=${2:-2}
FF=${FFMPEG:-$(node -e 'try{console.log(require("ffmpeg-static"))}catch{console.log("ffmpeg")}' 2>/dev/null || echo ffmpeg)}
FP=${FFPROBE:-$(node -e 'try{console.log(require("ffprobe-static").path)}catch{console.log("ffprobe")}' 2>/dev/null || echo ffprobe)}

DUR=$("$FP" -v error -show_entries format=duration -of csv=p=0 "$IN")
SIZE=$(stat -c %s "$IN" 2>/dev/null || stat -f %z "$IN")
V=$("$FP" -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -of csv=p=0 "$IN")
A=$("$FP" -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels -of csv=p=0 "$IN" || true)
LOUD=$("$FF" -hide_banner -i "$IN" -af ebur128=framelog=quiet:peak=true -f null - 2>&1 | awk '/I:/{i=$2} /Peak:/{p=$2} END{print i" LUFS, true peak "p" dBFS"}')

printf 'length   %.2f s\n' "$DUR"
awk -v s="$SIZE" 'BEGIN{printf "size     %.1f MiB\n", s/1048576}'
echo "video    $V"
echo "audio    ${A:-NONE}"
echo "loudness $LOUD"

SHEET="${IN%.*}.sheet.jpg"
N=$(awk -v d="$DUR" -v e="$EVERY" 'BEGIN{n=int(d/e); if(n<1)n=1; print n}')
COLS=$(( N < 6 ? N : 6 )); ROWS=$(( (N + COLS - 1) / COLS ))
"$FF" -hide_banner -loglevel error -y -i "$IN" -vf "fps=1/$EVERY,scale=270:-2,drawtext=text='%{pts\:hms}':x=6:y=6:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=${COLS}x${ROWS}:padding=4:color=white" -frames:v 1 "$SHEET" 2>/dev/null \
  || "$FF" -hide_banner -loglevel error -y -i "$IN" -vf "fps=1/$EVERY,scale=270:-2,tile=${COLS}x${ROWS}:padding=4:color=white" -frames:v 1 "$SHEET"
echo "sheet    $SHEET ($N frames, one every $EVERY s)"
