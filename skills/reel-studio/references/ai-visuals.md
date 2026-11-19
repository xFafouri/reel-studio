# Art, AI clips, real footage, GPU clean-up

## Hard rules
- **No text drawn by image or video models**: titles, labels, numbers and logos are set in real fonts by code.
  Every image prompt ends with "No text, no letters, no numbers."
- Ask before spending paid credits; check the balance first (Flow: avatar → credits).
- Real people / real footage: credit the source on screen and in the caption; Wikimedia Commons photos keep their
  licence line (e.g. «CC BY-SA 4.0»).
- AI-made realistic people/scenes: turn the platform's AI label on (YouTube "altered or synthetic", TikTok AI label,
  Facebook `is_ai_generated`). No reach penalty seen for the label.

## Still art (image models)
- Keep ONE chat/project per video and reuse the previous video's chat for the same style (no re-uploading refs).
- Style reference: attach 2 images from the last video + "same cut-paper collage style, transparent background,
  square: <subject>". Characters: attach a character frame as reference for every new pose.
- Hook art: a **full-frame vertical 2:3 scene with a calm, low-detail upper area** for the title. Not a plain band
  (the seam shows). Put a soft paper-coloured shade under the title for contrast.
- Props on solid green (#00FF00 asked, ~#07F805 received) when transparency is unreliable → `scripts/greenkey.sh`
  (samples the real green, colorkey + despill), then trim the empty border.
- Edits ("keep everything, only close his mouth") are stored as new VERSIONS of the same tile: download the version
  you want and re-upload it as a new asset, or the agent may pick the first version.
- Download at 1K–2K; upscale in code only if needed.

## AI video clips (Google Flow: Veo / Omni)
- Plan ≤ 2–3 clips per Reel. Omni ≈ 10 credits/clip (takes a first-frame image, can make two characters talk in one
  6–8 s clip with the timeline in the prompt, keeps the same character voice); Veo ≈ 15. Failed ones are refunded.
- **Extend** works only on Veo clips. To continue any clip: cut its last frame
  (`ffmpeg -sseof -0.1 -i clip.mp4 -frames:v 1 last.jpg`), upload, "use the attached image as its exact FIRST FRAME".
  One image as first AND last frame → a clip that loops.
- Ask for simple motion: "nobody touches anybody", "the glass never leaves his hand". Seen glitches: objects
  vanishing between hands, tangled hands, black bars near the end → cut around them or punch in.
- Child voices in Arabic often fail ("Audio generation failed"): Settings → Return silent videos, then voice with TTS.
- A family-friendly wording passes filters («paper-craft illustration… sits on his bed»).
- Download 720p original or 1080p upscaled (~1 min). Check speech without listening: transcribe with a free model
  and align words (`align_words.py`).

## Lips must match sound (no silent talking)
1. Tile the mouth region at 5–8 fps: `bash scripts/mouth-tiles.sh clip.mp4 260:180:410:620 6 0 4`.
2. Cut the parts where a non-speaking character's mouth moves.
3. Fit the speaker's talking span to our line with a small picture rate change (×0.95–1.2 is invisible).
4. End on a closed-mouth frame. Cut between two clips at (lips start − 0.27 s) for a seamless hook.
**Dubbing a wrong clip voice:** TTS the line in the right voice (director's notes with the emotion, pauses where the
lips pause), map lip runs on an 8 fps tile, retime video per phrase (`setpts`, 0.95–1.5), place each phrase on its
lip run (`atempo` 0.85–1.06 + `adelay`), then check open-mouth frames against 1/8 s loudness.

## Real footage
Download with `yt-dlp` only what you may use (own clips, licensed, or short fair-use excerpts with credit). Hook on
the raw moment, then freeze/slow. Grab the key frame for the thumbnail BEFORE the result shows.

## GPU clean-up (free, local, Vulkan: NVIDIA/AMD/Intel)
- **Upscale** 720p → 1080 with Real-ESRGAN ncnn-vulkan, model `realesr-animevideov3` ×2: ~0.5 s/frame on a GTX 1060
  (~2 min for an 8 s clip). For ART only: real faces turn waxy. `realesrgan-x4plus` = ~20 s/frame (too slow).
  Steps: frames out (`ffmpeg -i clip.mp4 -fps_mode passthrough in/%06d.png`) →
  `realesrgan-ncnn-vulkan -g 0 -m <dir>/models -n realesr-animevideov3 -s 2 -i in -o out -f png` →
  frames back to mp4 at the original fps, sound copied from the original (`-map 1:a? -c:a copy -shortest`).
- **Slow motion** with RIFE ncnn-vulkan (~1 min / 8 s clip):
  `rife-ncnn-vulkan -g 0 -m <dir>/rife-v4.6 -n <frames × 2> -i in -o out -f %06d.png`, then encode at the SAME fps
  (twice as long). Sound dropped (slowed sound is useless).
- `-g 0` = first GPU; device 1 is often a CPU fallback (5× slower). One GPU job at a time.
