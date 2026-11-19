# QA checklist (before anyone else watches)

Run these yourself, fix, and only then show the video. Report honestly what was checked and what wasn't.

## Before rendering the full video
- [ ] Script approved; the author's version backed up; every change explained.
- [ ] Every fact matches a named, opened source; numbers copied exactly; verdict = the evidence.
- [ ] Voice approved by ear (listen file); no repeats, stretched words or level jumps between lines.
- [ ] Stills of every scene at its fullest moment (`--stills` or `--sheet 1`) → LOOK at each one:
  - text inside the safe zone (top ≥ 120 px under the badge, nothing important below ~1570 px or in the right ~120 px);
  - captions zone (y ≈ 1250–1500) clear of art; no overlaps; no text touching the edges;
  - nothing visible before its entrance or after its exit;
  - one hero element per frame; contrast readable on a phone at arm's length;
  - screen Arabic without harakat; English terms spelled as in the script.

## After rendering
- [ ] `bash scripts/qa.sh video.mp4 1`: 1080×1920 (or 1920×1080), 30 fps, h264 yuv420p + aac 48 kHz,
      ≈ −14 LUFS (−13.5 … −15.5 OK), true peak ≤ −1 dBFS, size under the route's cap.
- [ ] Look at the contact sheet: rhythm (a new visual every ~3 s), no frozen stretch, no black/blank frames.
- [ ] Frame 0 already shows the hook; something moves within 0.5 s.
- [ ] AI clips: mouth tiles checked — no lips moving without sound; ends on closed mouth.
- [ ] Sound: voice always on top; music ducks and comes back; effects land on their frames; no click at the end.
- [ ] Story Reels: last frame ≈ first frame (loop). Explainers: outro/CTA as planned.
- [ ] Watch it once fully, start to end, with sound, at phone size.
- [ ] Thumbnail frame chosen (best frame inside the first 3 s, see `thumbnails-and-platforms.md`).

## Showing it
Open it locally (`xdg-open` / `open video.mp4`) when it's above a chat upload limit. Say what changed since the last
version in a few lines. Wait for an explicit "post it" before anything goes online.
