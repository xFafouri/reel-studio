# Remotion (React → video)

**Use it when:** a motion-graphics piece is mostly type, shapes, charts and transitions (promo, launch video, data
video, kinetic text), when a team already writes React, or when you want its Studio preview and component reuse.
**Prefer the HTML engine when:** the video is driven by a voice with word timing (Reels/explainers): the HTML
engine already does voice → word times → scenes → mix in one script.
**Licence:** free for individuals and companies of ≤ 3 people; bigger companies need a paid licence (check remotion.dev).

## Start
```bash
npx create-video@latest            # pick the blank or "Hello World" template, TypeScript
cd my-video && npm i
npx remotion studio                # live preview in the browser
npx remotion render src/index.ts <CompId> out/video.mp4 --codec h264 --crf 18
npx remotion still src/index.ts <CompId> out/f90.png --frame 90      # one frame to LOOK at
```
Structure: `src/index.ts` (registerRoot) → `src/Root.tsx` (`<Composition id fps durationInFrames width height>`) →
`src/scenes/*.tsx` → `src/components/*.tsx`; assets in `public/`, loaded with `staticFile()`.

## Rules (same taste rules as `motion-design.md`, in Remotion terms)
1. Never linear: `interpolate(frame, [a, b], [0, 1], { easing: Easing.bezier(.2,.8,.2,1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })`;
   entrances prefer `spring({ frame, fps, config: { damping: 14 } })`. Always clamp.
2. Entrances move 2–3 properties; stagger 3–6 frames; exits ~10 frames vs ~20 for entrances.
3. All timing from `fps` (`useVideoConfig()`), no magic frame numbers; one `theme.ts` for colours, easings, fonts.
4. Stills get Ken Burns; videos use `<OffthreadVideo>` (not `<Video>`) for exact frames.
5. Layers: background → assets → type → grade → grain/vignette. Never a flat solid background.
6. Fonts: `@remotion/google-fonts` or `@font-face` + `staticFile()`; `gap`/`margin` in `px` around big type (`em`
   resolves against the parent).
7. Sound: `<Audio src={staticFile('voice.mp3')} />` per line at its `<Sequence from>`; or render silent and mix with
   `scripts/mix.mjs` (ducking + −14 LUFS) — usually simpler.
8. Word timing: run `align_words.py`, put the JSON in `public/`, convert seconds → frames (`Math.round(t * fps)`).

## Render problems
- Chromium download fails / "Old Headless mode has been removed": pass a headless shell,
  `--browser-executable=$(ls -d ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-linux/headless_shell | head -1)`.
- Forgetting `--overwrite` on stills → you look at an old file.
- `durationInFrames` shorter than the content → cut ending; longer → dead air.

## Useful extras
[claude-motion](https://github.com/whaleyxbt/claude-motion) (MIT): a Remotion toolkit with taste rules, a review loop
and a Python sound engine (`python3 -m sfx --list`: whoosh, riser, impact, chime, pop, pad…; cue sheet → WAV at
−14 LUFS).
