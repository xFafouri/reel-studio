# Third-party tools and licences

This repository contains only original code and docs (MIT). It does **not** bundle any third-party code or model.
The skills tell the agent to install or call these tools; their own licences apply:

| Tool | Used for | Licence / terms |
|---|---|---|
| [FFmpeg](https://ffmpeg.org) / [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static) | Encoding, mixing, effects | LGPL/GPL (static builds are GPL) |
| [Playwright](https://playwright.dev) | Headless Chromium for frame rendering | Apache-2.0 |
| [torchaudio MMS_FA](https://docs.pytorch.org/audio/stable/generated/torchaudio.pipelines.MMS_FA.html) | Word timing (forced alignment) | Code BSD-2; **model weights CC-BY-NC 4.0 (non-commercial)** |
| [uroman](https://github.com/isi-nlp/uroman) | Romanizing text for alignment | see its repo |
| [Whisper](https://github.com/openai/whisper) / [faster-whisper](https://github.com/SYSTRAN/faster-whisper) | Commercial-safe word timing alternative | MIT |
| [Gemini API](https://ai.google.dev) | Text-to-speech (free tier) | Google API terms |
| [edge-tts](https://github.com/rany2/edge-tts) | Quick TTS drafts | GPL-family, see its repo (uses a Microsoft online service) |
| [Remotion](https://www.remotion.dev) | React video engine | Free for individuals and companies of ≤ 3 people; company licence above that |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | HTML + GSAP video engine | Apache-2.0 (some skills need a paid Pro plan) |
| [Blender](https://www.blender.org) | 3D stings | GPL |
| [Real-ESRGAN ncnn-vulkan](https://github.com/xinntao/Real-ESRGAN-ncnn-vulkan) | GPU upscaling | BSD-3-Clause |
| [RIFE ncnn-vulkan](https://github.com/nihui/rife-ncnn-vulkan) | GPU slow motion | MIT |
| [SoX](https://sourceforge.net/projects/sox/) | Optional sound synthesis | GPL/LGPL |
| [claude-motion](https://github.com/whaleyxbt/claude-motion) | Optional Remotion toolkit | MIT |

The 31 sound effects in `scripts/sfx.mjs` are generated from math formulas (no samples): use them freely.
Music, footage and photos you add have their own licences: keep a CREDITS file next to them.
