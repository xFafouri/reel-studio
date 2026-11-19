# The HTML engine (default for Reels and explainers)

Scenes are HTML/CSS; a headless Chromium (Playwright) shows the page; for every frame we SET the clock and take a
screenshot; ffmpeg encodes the JPEGs. Nothing plays in real time, so the result is exact and repeatable.
`scripts/render-html.mjs` is the generic renderer; `templates/html-reel/reel.html` is a working 9:16 example.

## The one rule: motion must be seekable
- Use CSS animations / transitions / WAAPI whose **delay is a time in seconds on the whole video**
  (`style="--d:3.2s"` + `animation: pop .5s ease var(--d) both`). The renderer pauses every animation
  (`document.getAnimations()`) and sets `currentTime = ms` each frame.
- `fill-mode: both` on entrances (hidden before, kept after). Infinite loops (`boil`, `bob`) work too.
- Counting numbers: `<span data-count="42.5" data-at="3" data-for="0.8" data-unit="%">`.
- Video inside the page: cut the clip into JPG frames at the video fps once (`ffmpeg -ss A -to B -i clip.mp4 -vf fps=30 -q:v 2 dir/f-%05d.jpg`), then `<img data-clip="dir" data-n="N" data-at="2" data-rate="1">`
  (negative rate = rewind). Its sound is mixed separately (cut, `atempo` like the picture).
- Anything else (canvas, GSAP, Lottie): expose `window.seek = async (ms) => …` and draw that exact moment.
- **Never** `setTimeout`, `setInterval`, `requestAnimationFrame`, `Date.now()`, CSS `transition` triggered by JS, or
  `<video>` playback for motion: they follow the wall clock, not the render clock.
- Wait for `document.fonts.ready` and `img.decode()` before the first frame (the renderer does).

## Page structure
- 1080×1920 body, `overflow:hidden`, everything inside a `.stage { position:absolute; inset:0; overflow:hidden }`
  (in an RTL page anything that sticks out scrolls the view: a bare strip appears on the left).
- One `<section class="sc" style="--s:4.1s;--e:9.6s">` per scene: enter `scIn .35s` (opacity + scale 1.05→1),
  leave `scOut .25s` before `--e`. A scene that continues the previous layout cuts with no transition (`cut`).
- Logo/badge bar at the top (y ≈ 120), captions at y ≈ 1250–1500, nothing important below ~1570.
- Fonts from `@fontsource/*` files via `@font-face` (never system defaults for display text).
- Generate the page from a JS spec (`scenes: [{ voice, html(T), show, caption, hold, lead, cut, dur }]`), so times come
  from `T.at()` and nothing is typed by hand.

## Building blocks that worked (CSS)
| Piece | How |
|---|---|
| pop / rise / fade / drop | `cubic-bezier(.3,1.5,.5,1)` (overshoot) for pop/drop, `(.2,.8,.2,1)` for rise, `ease-out` fade |
| stop-motion boil | `boil .5s steps(1) infinite` (rotate ±0.5°, translate 1 px): paper feels hand-animated |
| hand-drawn line/circle/arrow | SVG `path` with `pathLength="1"`, `stroke-dasharray:1; stroke-dashoffset:1→0`, **opacity 0 until drawn** (the round cap shows as a dot) |
| stamp | scale 2.4 → 1 with rotate, `(.2,1.6,.4,1)`, + a `.shake` jolt on the wrapper + SFX stamp/sting |
| taped scraps / notes | off-white card, uneven border-radius, rotate ±2°, a semi-transparent tape strip `::before`; content in `<span>` if it has `<br>` |
| comparison bars | both start empty and rise at the same speed; the smaller one stops first |
| countdown / timer | `data-count` with a clock format, or one span per number with stepped delays |
| Ken Burns on stills | `scale 1.1 → 1` over the scene (linear is OK for camera drift only) |
| title words on the beat | each word a `span.tw` with `--d = T.at(word)` |
| paper + grain | SVG `feTurbulence` data-URIs: paper texture + STILL grain layer (`mix-blend-mode:multiply; opacity:.16`) |
| complex motion (walk cycles, camera) | compute values per frame in JS at build time and emit `@keyframes` stops (only where values change) |

## Speed and commands
≈ 5 s of work per second of 1080×1920 video at 30 fps on a laptop (screenshot-bound). Check layout with stills first:
`node render-html.mjs page.html --stills 1,4.5,9` or a contact sheet `--sheet 1`, then render the full video.
Encode the picture at crf 18, mux the sound separately (`mix.mjs`), re-encode the final at crf 20–22 `-preset slow`
when a size cap matters.

## Gotchas met in production
- Never name a scene CSS class like an engine class (`.caps`, `.blue` broke layouts).
- `T.at()` lookups use the voice spelling and letters only.
- A clip shown before its `at` holds its first frame; after `to`, its last frame.
- Images with transparent edges need `drop-shadow()` (not `box-shadow`) for a paper-cut shadow.
