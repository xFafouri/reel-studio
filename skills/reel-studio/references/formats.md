# Formats: which video, which recipe

| Format | Length | Engine | Picture comes from | Voice |
|---|---|---|---|---|
| **Character story Reel** (a line someone hears every day → an answer → explain → verdict) | 30–40 s | HTML engine | 1–3 AI clips + drawn/cut-out scenes | Clip voices + TTS narrator |
| **Explainer Reel** (a study, a mechanism, a "how does it work") | 45–75 s | HTML engine | Image-model art on transparent PNG + drawn CSS/SVG pieces | One TTS narrator |
| **Real-footage breakdown** (a clip + "why?") | 30–55 s | HTML engine (clip as frames) | The real clip (credited), real photos (credited) | TTS narrator |
| **Code-drawn character** (stick figure, cartoon) | 30–50 s | HTML engine, poses sampled into CSS keyframes | Drawn 100% in code | TTS |
| **Tool / product demo** | 30–40 s, loops, no outro | HTML engine or presentation kit | Screen recordings, screenshots | Upbeat TTS or own voice |
| **Presentation video** (slides + voice) | 1–5 min, 16:9 or 9:16 | `presentation-video` skill | Slides in HTML, screenshots, recordings | Own voice or TTS |
| **Motion-graphics promo / kinetic text / data video** | 10–60 s | Remotion or HyperFrames | Type, shapes, charts, footage | Music-led, optional voice |
| **Logo intro / 3D sting** | 3–7 s | Blender (Eevee) + synthesized sound | 3D scene built in code, real-font type | None (designed sound) |
| **Long narrated slideshow** (stories, documentaries) | 10–60 min | ffmpeg (Ken Burns stills + ambience bed) or presentation kit | Stills, archive photos | Calm TTS, one take per paragraph |

## Character story Reel
1. **Frame 0: a sentence people really hear** (a parent's rule, a common belief), ≤ 5 words, on screen from 0.0 s.
   No logo, no intro card.
2. The other character answers within 3 s, with a question or a quick "that's not true".
3. Dive into an object (the glass, the phone…) → 3–4 drawn scenes explain ONE claim with a named source and one number.
4. Verdict to camera; the last line leads back into the first one and the last frame ≈ the first frame (a loop).
5. Plan clips before writing: AI clips cost credits. Two clips is often enough (a hook clip and a verdict clip; the
   same clip re-zoomed works as a reaction shot).

## Explainer Reel
9–10 scenes (≈ 60–70 s): hook (the title IS the voice, word by word, on full-frame art) → why people believe it → the
study (journal + year on screen, first author small) → results (counted numbers, bars that rise together) → the
twist → the key number → verdict (stamp + sound) → limits as one small note → takeaway → call to action.
Every key fact also on screen; technical terms explained on screen in a few words.

## Real-footage breakdown
The raw clip IS the hook (no text card before it). Freeze or slow it (RIFE) at the key moment, then ask "why?".
Explain with a diagram drawn over or beside the frame. Credit the footage on screen and in the description.
Thumbnail = the raw action frame just before the key moment, never the result.

## Code-drawn character
A character built from SVG/CSS parts whose joints follow pose functions of time; sample them at the frame rate into
CSS `@keyframes` (a stop only where a value changes) so the renderer can seek. A camera helper (pan/zoom on a
wrapper) makes it cinematic. Feet stay ON the ground line: compute hip height from leg length.

## Tool / product demo
Show the result first, then 3 steps, each a real screen recording sped up (×1.5–3, no sound), cropped to what
matters and zoomed on the click. 30–40 s, loops to the first frame.

## Logo intro / sting
Three beats (build → transform → lock), 3–7 s, the final frame held ≥ 1 s. Sound designed beat by beat on the same
timeline numbers as the animation. See `blender.md` and `motion-design.md`.
