# Blender (3D stings, logo intros, real light)

**Use it when:** the piece needs real 3D (extruded type, objects folding, light sweeps, shadows, depth of field,
physical materials). 2D/paper looks are faster in the HTML engine. Template: `templates/blender/title_sting.py`
(tested on Blender 5.3, Eevee). The same method scales to a full logo intro (a chart folding into a badge, letters
flipping up, a light sweep: 6.5 s, 1080p 60 fps, ~250 lines).

## Method
1. **The whole scene in one Python file**, run headless: `blender -b --factory-startup -noaudio -P scene.py -- <args>`.
   `--factory-startup` = no user add-ons/prefs, so the result is the same on every machine.
2. **Bake the easing**: set `keyframe_new_interpolation_type = 'LINEAR'` and insert one key per frame from your own
   easing functions (`e_out`, `e_io`, `e_back`). Exact curves, motion blur still works, and no dependence on the
   F-curve API (it changed in Blender 4.4/5.0 with slotted actions).
3. **Previews first**: `--stills 12,40,90 --res 40` renders a few frames at 40% in seconds; LOOK at them; only then
   render all frames (`--out dir` → `dir/frames/0001.png…`) and encode with ffmpeg (`-framerate 30 -i %04d.png`).
4. **Re-render a part**: `--from 250 --to 305` into the same frames folder.
5. **Sound**: designed on the same timeline numbers (sox / ffmpeg synthesis), mixed with `scripts/mix.mjs`.

## Type
- Real fonts only: `bpy.data.fonts.load('/path/font.ttf')` on a FONT curve; extrude + small bevel.
- For per-letter animation with exact kerning: build the whole word once, read each letter's position, then make one
  object per letter at that place.
- **Arabic does not shape in Blender text objects** (letters come out separate, left to right). Set Arabic in
  HTML/SVG with a real font, screenshot it with a transparent background (Playwright `omitBackground: true`) and
  map it on a plane, or import an SVG outline (`bpy.ops.import_curve.svg`).

## Look
- `view_transform = 'Standard'` keeps brand colours exact (AgX/Filmic shift them). Light colours clip easily:
  **measure a pixel** of a still and scale sun/world strength until the paper reads as its hex (in linear light:
  ratio = lin(target)/lin(measured); #D7CBB4 → #EFE6D2 needed ×1.27).
- A backdrop plane close behind the subject gives a tight paper-cut shadow; far away = a blurry double.
- Fit to the camera: a 36 mm sensor fits the LONGER side, so a 9:16 frame sees only `36 × W/H` mm across
  (seen width = distance × sensor / focal length). A size that fills 16:9 overflows 9:16.
- Eevee: 32 TAA samples, AO, soft shadows, motion blur shutter ≈ 0.45. ~2–4 s per 1080p frame on a GTX 1060.
  Cycles (CUDA/OptiX) only for glass, caustics, real GI — minutes per frame.

## Install and hardware
blender.org, snap (`snap install blender --classic`) or your package manager. NVIDIA GPUs show in Cycles as CUDA/OptiX
(Preferences → System); Eevee uses the GPU automatically. One render at a time (RAM/GPU). Story in 3 beats, hold the
final frame ≥ 1 s.
