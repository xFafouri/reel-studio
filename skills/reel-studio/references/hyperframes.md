# HyperFrames (HTML + GSAP → video, by HeyGen)

Open source (Apache-2.0), github.com/heygen-com/hyperframes, docs hyperframes.heygen.com. Same idea as our HTML
engine: a composition is an HTML page, headless Chrome seeks every frame, FFmpeg encodes. Built for agents: a
non-interactive CLI, lint/check commands, a catalog of ready blocks, and its own agent skills.
Run `npx hyperframes doctor` after installing, and always read `npx hyperframes <command> --help`: flags change
between versions. (This page was written from its docs; the other engines here were tested end to end.)

**Use it when:** you want ready-made blocks (charts, transitions, social cards), GSAP timelines, Lottie/Three.js,
a browser preview with live reload, or a website captured into video. **Prefer the HTML engine here** for voice-driven
Reels (word timing, captions, SFX and mix are already wired there).

## Start (Node ≥ 22 + FFmpeg)
```bash
npx hyperframes init my-video && cd my-video   # a valid starter project + its agent skills
npx hyperframes preview                        # Studio in the browser, live reload
npx hyperframes lint                           # HTML structure
npx hyperframes check                          # browser, layout, motion and contrast checks
npx hyperframes snapshot --at 0,2,5            # review frames (LOOK at them)
npx hyperframes render --output out.mp4
npx hyperframes add <block>                    # catalog block, e.g. data-chart
npx hyperframes timeline --json                # tracks and clips
npx hyperframes tts <script> / transcribe <file> / capture <url>   # extra helpers (check --help)
```
Agent skills: `npx skills add heygen-com/hyperframes` (pick **Core Skills**), or as a Claude Code plugin:
`claude plugin marketplace add heygen-com/hyperframes` then `claude plugin install hyperframes@hyperframes`; read
`/hyperframes` first. Some skills (`reverse-any-video`, `style-sampling`) need the paid Pro plan: don't use them.

## Composition format (from the docs; `init` gives the exact current version)
- Root element: `data-composition-id`, `data-width`, `data-height`, `data-start`.
- Clips: `class="clip"` + `data-start`, `data-duration`, `data-track-index`; `<video>` (muted, playsinline) and
  `<audio>` with the same attributes, `data-volume` for level.
- Animation: a **paused** GSAP timeline registered on `window.__timelines` so the renderer can seek it:
  `const tl = gsap.timeline({ paused: true }); tl.from('#title', { opacity: 0, y: 40, duration: 0.8 }, 1);`
  CSS animations, WAAPI, Lottie, Three.js and Anime.js are supported through adapters.
- Deterministic only: no wall-clock timers or random values without a seed.

## Bringing our pieces in
- Voice + word times: put the takes in the project, run `align_words.py`, and use the word times as GSAP positions
  (`tl.from('.w3', {...}, 2.41)`).
- Our taste rules still apply (`motion-design.md`), our SFX (`sfx.mjs all`) can be dropped in as `<audio>` clips,
  or render silent and mix with `scripts/mix.mjs`.
- Gotcha from its README: don't run project-local skill installs inside a HyperFrames checkout (they can overwrite
  edits in `skills/`); `npx hyperframes skills update` pulls skills matching the CLI version.
