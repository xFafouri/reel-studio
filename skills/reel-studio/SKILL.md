---
name: reel-studio
description: >
  End-to-end video making from code with free tools: Reels / YouTube Shorts / TikToks, story and explainer
  animations, real-footage breakdowns, motion-graphics promos, logo intros / 3D stings and presentation videos.
  Covers the whole flow (script → voice → word timing → animated scenes → sound effects + music → mix → QA →
  thumbnail → platform export) and picks the engine: an HTML+Playwright frame renderer, Remotion, HyperFrames,
  Blender or plain ffmpeg. Use when asked to make, edit, fix or review a reel, short, explainer, animated or
  motion-design video, logo intro, captions, voice-over, sound effects, a thumbnail, or "which tool should I use for
  this video". For slide-based talks use the presentation-video skill.
---

# Reel Studio

One method for every short video: **the voice drives the picture**. Write the script, record the voice, get the time
of every word, place every animation on the word it illustrates, add sound design, mix to −14 LUFS, check frames
with your own eyes, then hand it over. Everything here is free and runs locally (Node 22, ffmpeg, Playwright,
Python CPU alignment, optional Blender and GPU tools).

## Ground rules
1. **Honest content**: every fact from a named source; imagined lines marked as such; never invent numbers or quotes.
2. **Review gates**: script → voice → stills → video. Show each and wait; "ok" to a question is not "build it".
3. **No text drawn by image/video models**: every title, label, number and logo is set in a real font by code.
4. **Free tools first**; respect free quotas (Gemini TTS ≈ 10 calls/day: on 429 stop and say so).
5. **Ask before anything outward** (upload, publish, delete, account settings). Building local files needs no OK.
6. **One heavy job at a time**: check free RAM (alignment ≈ 3.7 GB, render ≈ 1 GB, Blender/GPU jobs alone).
7. **Look before you deliver**: render stills/sheets and look at them; never describe a video you haven't seen.
8. **Brand rules live in the project**, not here: read the project's own style notes (palette, fonts, voices,
   logo) before designing, and ask when there are none.

## 1. Pick the format
| The ask | Recipe |
|---|---|
| A belief/rule told as a scene with characters | Character story Reel, 30–40 s |
| A study / mechanism explained | Explainer Reel, 45–75 s |
| A viral clip + "why?" | Real-footage breakdown |
| Product / tool demo | Demo, 30–40 s, loops |
| Slides + voice, talks, pitches | `presentation-video` skill |
| Promo, kinetic text, data video | Motion graphics (Remotion / HyperFrames) |
| Logo intro, 3D title | Blender sting, 3–7 s |
Structures and timings: `references/formats.md`.

## 2. Pick the engine
| Engine | Choose it when | Read |
|---|---|---|
| **HTML + Playwright** (`scripts/render-html.mjs`) | Default. Voice-driven Reels/explainers, any language incl. RTL, CSS/SVG animation, clips as frames, word-synced captions | `references/html-engine.md` |
| **HyperFrames** (HeyGen, HTML + GSAP) | Catalog blocks, GSAP/Lottie/Three.js, browser preview, website capture | `references/hyperframes.md` |
| **Remotion** (React) | Component-heavy motion graphics, data videos, React teams | `references/remotion.md` |
| **Blender** (Python, Eevee) | Real 3D: extruded type, light sweeps, depth, physical materials | `references/blender.md` |
| **ffmpeg only** | Cutting/assembling real footage, vertical conversions, quick edits | `references/ffmpeg-cookbook.md` |
All of them follow `references/motion-design.md` (easing, stagger, holds, no generic "AI video" look).

## 3. The pipeline
1. **Facts + script** → `references/script-and-hooks.md` (hook ≤ 5 words at frame 0, one claim, named source). Approve.
2. **Voice** → `references/voice.md` (+ `references/arabic.md` for Arabic). One batch call per speaker, takes cached
   by text hash: `node scripts/gemini-tts.mjs --voice Kore --file lines.txt --out take.mp3`. Listen and approve.
3. **Word times** → `python scripts/align_words.py <ffmpeg> take.mp3 < take.txt` → `references/timing-and-captions.md`.
4. **Visuals** → `references/ai-visuals.md` (style references, green-screen props `scripts/greenkey.sh`, AI clips,
   lip check `scripts/mouth-tiles.sh`, real footage credits, GPU upscale / slow motion).
5. **Scenes** in the chosen engine, every animation timed on the word it illustrates. Start from
   `templates/html-reel/reel.html` or `templates/blender/title_sting.py`.
6. **Stills first**: `node scripts/render-html.mjs page.html --sheet 1` → look → fix layout → show the stills.
7. **Render**: `node scripts/render-html.mjs page.html --out picture.mp4` (≈ 5 s of work per video second at 1080p).
8. **Sound** → `references/sound-design.md`: `node scripts/sfx.mjs list`, a cue sheet, then
   `node scripts/mix.mjs cues.json` (voice + SFX + ducked music → −14 LUFS, picture copied).
9. **QA** → `references/qa-checklist.md`: `bash scripts/qa.sh final.mp4 1` + watch it fully once.
10. **Thumbnail + platform** → `references/thumbnails-and-platforms.md` (best frame in the first 3 s, safe zones,
    covers, AI labels). Publish only on an explicit go.

## Numbers to remember
1080×1920 · 30 fps · h264 yuv420p crf 18 (master) / 20–22 (delivery) · AAC 160k 48 kHz · −14 LUFS, peak ≤ −1.5 dBTP ·
music bed ≈ −31 LUFS ducked · 0.25 s of picture before each line, 0.3 s after · captions 2–3 words at y ≈ 1250–1500 ·
safe area y ≈ 200–1570 with the right 120 px clear · a new visual every ~3 s · Instagram grid crop y ≈ 240–1680.

## Scripts (`scripts/`: Node 22 ES modules, packages resolved from the current project)
| Script | Does |
|---|---|
| `doctor.sh` | Which tools your machine has (ffmpeg, Playwright, alignment venv, Gemini key, Blender, GPU tools, RAM) |
| `render-html.mjs` | HTML page → MP4, frame-exact (`--stills`, `--sheet`, `--audio`) |
| `sfx.mjs` | 31 synthesized sound effects (`list`, `<name> out.wav`, `all dir/`) |
| `mix.mjs` | Cue sheet → final mix / MP4 (voice bus, SFX, ducked music, loudness) |
| `gemini-tts.mjs` | A Gemini voice take with director's notes (key from env or ./.env, never printed) |
| `align_words.py` | Word times by forced alignment (Meta MMS: **non-commercial licence**, see timing doc) |
| `qa.sh` | Length, size, streams, loudness + a contact sheet |
| `mouth-tiles.sh` | The mouth region tiled over time, for lip-sync checks |
| `greenkey.sh` | Green background → transparent PNG (samples the real green) |

Setup once in a project:
```bash
npm i playwright ffmpeg-static ffprobe-static @fontsource/inter && npx playwright install chromium
python3 -m venv .venv && .venv/bin/pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu \
  && .venv/bin/pip install uroman numpy          # only for word timing
bash <skill>/scripts/doctor.sh
```
