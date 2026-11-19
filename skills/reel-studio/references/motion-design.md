# Motion design rules (any engine)

Untrained animation = linear easing, lone fades, everything at once, flat colours, no texture: the "generic AI video"
look. These rules prevent it. They apply to the HTML engine, Remotion, HyperFrames and Blender alike.

## Every animation has a job
Say what it does for the viewer: draw the eye, show cause → effect, count a number, connect two things, mark a
verdict. No job → don't animate. One hero element per moment; the rest waits or stays still.

## Easing (the biggest lever)
| Use | Curve |
|---|---|
| Entrance with personality (pop, stamp, sticker) | `cubic-bezier(.3,1.5,.5,1)` overshoot, or a spring (damping ≈ 12–15) |
| Calm entrance (rise, slide) | `cubic-bezier(.2,.8,.2,1)` (fast start, gentle settle) |
| Exit | `ease-in`, ≈ 60% of the entrance time (exits are faster than entrances) |
| Moving across the frame / camera | ease-in-out (`cubic-bezier(.65,0,.35,1)`) |
| Linear | only for constant things: drift, rotation of a wheel, Ken Burns, a progress bar |

## Timing
- Entrances 0.3–0.6 s; small UI pops 0.15–0.3 s; exits 0.15–0.25 s; scene transitions 0.25–0.35 s.
- Stagger groups 3–6 frames (0.1–0.2 s) apart: words, list items, bars, icons. Nothing important enters at once.
- Rhythm: HIT → hold (0.5–0.7 s still) → build → HIT. Something must move in the first 0.5 s. Never more than
  ~3 s without a new visual event on a Reel.
- Hold long enough to read: ≈ 0.3 s per word on a card after it lands; + ~1 s after a definitions scene.
- Animate 2–3 properties together on entrances (opacity + translate + scale/rotate), never opacity alone.
- Anything on screen > 2 s gets a little life: boil, bob, slow drift, Ken Burns.

## Look (not AI-looking)
- Handmade textures: paper, still grain, uneven cut edges, tape, hand-drawn strokes, stop-motion boil.
- No neon glows, floating nodes, purple/indigo gradients, glassmorphism, emoji as icons (they ignore the palette).
- One accent colour for the hero element per frame; a fixed palette in tokens (CSS variables / one theme object).
- Real fonts set by code for every word; image/video models never draw text, labels or logos.
- Layer stack, bottom to top: background (paper / mesh) → art → graphics/type → grade → grain + vignette.
- Full-frame art for hooks (2:3 scene with a calm upper area for the title); never a plain colour band (seams show).

## Camera
A slow push (scale 1 → 1.05) during holds; a punch-in (scale 1.15–1.3 on a face) for reactions and to hide clip
glitches; whip/whoosh only on scene changes. Parallax: background moves less than foreground.

## Numbers and data
Count up with ease-out (0.8–1.2 s) and land on a sound (pop/ding). Bars start from zero together. Show the unit.
Big number + a 3–6 word note under it; the source on screen in small type.

## Review loop (mandatory)
Render stills at the key moments → LOOK at them → fix → re-render. Check: text inside safe zones, nothing visible
before its entrance, overlaps, contrast, one hero per frame, captions not covering art. Never describe a video you
haven't looked at.
