#!/usr/bin/env bash
# What your machine can do right now: every tool the reel-studio skill uses, found or missing, plus free RAM.
#   bash doctor.sh            (run it from the video project folder, so its node_modules are checked)
ok() { printf '  \033[32m✓\033[0m %-22s %s\n' "$1" "$2"; }
no() { printf '  \033[31m✗\033[0m %-22s %s\n' "$1" "$2"; }
has() { command -v "$1" >/dev/null 2>&1; }
nodemod() { node -e "require.resolve('$1')" >/dev/null 2>&1; }

echo "core"
if has node; then ok node "$(node -v)"; else no node "install Node 22 (nvm install 22)"; fi
if nodemod ffmpeg-static; then ok ffmpeg-static "$(node -e 'console.log(require("ffmpeg-static"))')";
elif has ffmpeg; then ok ffmpeg "$(ffmpeg -version | head -1 | cut -d' ' -f1-3)"; else no ffmpeg "npm i ffmpeg-static ffprobe-static"; fi
if nodemod ffprobe-static || has ffprobe; then ok ffprobe "found"; else no ffprobe "npm i ffprobe-static"; fi
if nodemod playwright; then ok playwright "found (npx playwright install chromium once)"; else no playwright "npm i playwright && npx playwright install chromium"; fi
if nodemod @fontsource/cairo || nodemod @fontsource/readex-pro || nodemod @fontsource/inter; then ok fonts "@fontsource/* found"; else no fonts "npm i @fontsource/inter @fontsource/cairo"; fi

echo "voice + timing"
PY=${PYTHON:-.venv/bin/python}; [ -x "$PY" ] || PY=python3
if "$PY" -c 'import torch, torchaudio, uroman' 2>/dev/null; then ok "align (torch/uroman)" "$PY"; else no "align (torch/uroman)" "python3 -m venv .venv && .venv/bin/pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu && .venv/bin/pip install uroman numpy"; fi
if [ -n "${GEMINI_API_KEY:-}" ] || grep -qs '^GEMINI_API_KEY=' .env; then ok "Gemini key" "set (not shown)"; else no "Gemini key" "GEMINI_API_KEY=… in .env (free at aistudio.google.com)"; fi
if "$PY" -c 'import edge_tts' 2>/dev/null || has edge-tts || [ -x .venv/bin/edge-tts ]; then ok edge-tts "found"; else no edge-tts "optional: .venv/bin/pip install edge-tts"; fi

echo "other engines (optional)"
if has blender; then ok blender "$(blender --version 2>/dev/null | head -1)"; else no blender "3D: snap install blender --classic"; fi
if nodemod remotion || nodemod @remotion/cli; then ok remotion "in this project"; else no remotion "npm i remotion @remotion/cli react react-dom (when a video needs it)"; fi
if nodemod hyperframes; then ok hyperframes "in this project"; else no hyperframes "npx hyperframes init <name> (Node 22 + ffmpeg)"; fi
if has sox; then ok sox "$(sox --version 2>/dev/null | head -1)"; else no sox "optional synth sounds: sudo apt install sox"; fi
if has yt-dlp || [ -x .venv/bin/yt-dlp ]; then ok yt-dlp "found"; else no yt-dlp "study reference videos: .venv/bin/pip install yt-dlp"; fi
if has realesrgan-ncnn-vulkan; then ok realesrgan "GPU upscale"; else no realesrgan "optional GPU upscale (Real-ESRGAN ncnn-vulkan)"; fi
if has rife-ncnn-vulkan; then ok rife "GPU slow motion"; else no rife "optional GPU slow motion (RIFE ncnn-vulkan)"; fi

echo "machine"
if has free; then
  AV=$(free -g | awk '/Mem:/{print $7}')
  if [ "${AV:-0}" -ge 3 ]; then ok "free RAM" "${AV} GB available"; else no "free RAM" "${AV} GB available: run no heavy job (alignment ≈ 3.7 GB, render ≈ 1 GB)"; fi
fi
if has nvidia-smi; then ok GPU "$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null | head -1)"; fi
