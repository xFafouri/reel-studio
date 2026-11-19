# reel-studio

**Agent skills for making videos from code, with free tools.** Reels, YouTube Shorts and TikToks, explainer
animations, real-footage breakdowns, motion-graphics promos, logo intros / 3D stings and presentation videos.

The idea is simple: **the voice drives the picture**. You write a script and record the voice. A forced aligner gives
the time of every word, and each animation starts on the word it illustrates. Captions light up word by word, sound
effects land on the beats, and the music ducks under the voice. Every frame is rendered on purpose, so the video
comes out the same on every run.

Works with **Claude Code** (as a plugin or plain skills), **Codex** and any agent that reads `SKILL.md` files.

## What's inside

```
skills/
├── reel-studio/              the whole short-video workflow + engine choice
│   ├── SKILL.md              start here: rules, formats, engines, the 10-step pipeline
│   ├── references/           one focused guide per topic (read only what the task needs)
│   │   ├── formats.md              story Reel, explainer, real footage, demo, motion graphics, logo sting…
│   │   ├── script-and-hooks.md     facts, hook in the first 3 s, length, script layout
│   │   ├── voice.md                Gemini TTS, own voice, edge-tts, ElevenLabs, takes, voice FX
│   │   ├── timing-and-captions.md  forced alignment, word helpers, caption rules, SRT
│   │   ├── html-engine.md          seekable HTML/CSS → MP4 renderer and its building blocks
│   │   ├── motion-design.md        easing, timing, stagger, holds, camera, avoiding the "AI video" look
│   │   ├── sound-design.md         SFX choice, music bed, ducking, loudness
│   │   ├── ffmpeg-cookbook.md      tested commands: cut, speed, vertical, Ken Burns, keys, mixes, delivery
│   │   ├── ai-visuals.md           image/video models, green-screen props, lip sync, real footage, GPU upscale/slow-mo
│   │   ├── remotion.md · hyperframes.md · blender.md   the other engines
│   │   ├── arabic.md               Arabic TTS spelling + RTL pages (example of a language guide)
│   │   ├── qa-checklist.md         what to check before anyone watches
│   │   └── thumbnails-and-platforms.md
│   ├── scripts/              tested tools (Node 22 ES modules + bash + Python)
│   └── templates/            html-reel/reel.html (9:16 demo page), blender/title_sting.py (3D title)
└── presentation-video/       slides + voice + screen recordings → 16:9 or 9:16 video (its own small kit)
```

| Script | What it does |
|---|---|
| `doctor.sh` | Shows which tools your machine has and what to install |
| `render-html.mjs` | Any seekable HTML page → MP4 (`--stills`, `--sheet`, `--audio`) |
| `sfx.mjs` | 31 sound effects generated from math (no samples, no licence questions) |
| `mix.mjs` | Cue sheet → voice + effects + ducked music at −14 LUFS, onto the video |
| `gemini-tts.mjs` | Gemini voice take with director's notes (free tier) |
| `align_words.py` | Time of every word in a recording whose text you know |
| `qa.sh` | Length, size, codecs, loudness + a contact sheet |
| `mouth-tiles.sh` | Lip-sync check for AI clips |
| `greenkey.sh` | Green background → transparent PNG |

## Install

**Claude Code plugin**
```
/plugin marketplace add xFafouri/reel-studio
/plugin install reel-studio@reel-studio
```
**Plain skills (Claude Code, any project or global)**
```bash
git clone https://github.com/xFafouri/reel-studio
cp -r reel-studio/skills/* ~/.claude/skills/          # or <project>/.claude/skills/
```
**Codex and other agents**: copy or link `skills/*` into your agent's skills folder (for example `~/.agents/skills/`),
or point your `AGENTS.md` at `skills/reel-studio/SKILL.md`.

## Requirements
- Node.js 22, and in the video project: `npm i playwright ffmpeg-static ffprobe-static && npx playwright install chromium`
- For word timing: Python 3.10+ with `torch`, `torchaudio`, `uroman` (CPU only, ~1.2 GB model, ~3.7 GB RAM while running)
- Optional: a free Gemini API key (voices), Blender (3D), Remotion or HyperFrames, SoX, a Vulkan GPU for upscaling/slow motion

Run `bash skills/reel-studio/scripts/doctor.sh` from your project to see what's missing.

## Try it in one minute
```bash
mkdir demo && cd demo && npm init -y && npm i playwright ffmpeg-static ffprobe-static && npx playwright install chromium
S=../reel-studio/skills/reel-studio
node $S/scripts/render-html.mjs $S/templates/html-reel/reel.html --sheet 1 --outdir out      # contact sheet
node $S/scripts/render-html.mjs $S/templates/html-reel/reel.html --out out/picture.mp4        # 7 s video
node $S/scripts/sfx.mjs all out/sfx                                                           # hear the effects
```
Then ask your agent: *"make a 30-second Reel explaining X, use the reel-studio skill"*.

## Principles the skills enforce
- Facts come from named sources; nothing invented. Approval gates: script → voice → stills → video.
- Image and video models never draw text: every word on screen is set in a real font by code.
- Free tools first, free quotas respected. Nothing is uploaded or published without an explicit go.
- Look at rendered frames before calling anything done.

## Licences
The code and docs here are MIT. Tools the skills call have their own licences. One matters most: **the default
word-timing model (Meta MMS) is non-commercial**, so use Whisper timestamps for commercial work. See
[THIRD_PARTY.md](THIRD_PARTY.md).
