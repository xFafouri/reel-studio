# Small 3D title sting, built fully in code (Blender 4.2+ / 5.x, Eevee): paper backdrop, a real-font title extruded
# with a bevel that springs up into place, a bar that wipes in under it, a slow camera push, soft light.
# A starting point: copy it, change the story/colours, keep the method (scene in code, baked easing, stills first).
#
#   blender -b --factory-startup -noaudio -P title_sting.py -- --out out/sting --stills 12,40,90 --res 50   (preview)
#   blender -b --factory-startup -noaudio -P title_sting.py -- --out out/sting                             (frames)
#   ffmpeg -framerate 30 -i out/sting/frames/%04d.png -c:v libx264 -crf 18 -pix_fmt yuv420p out/sting.mp4
# Options: --text "TITLE" --font /path/font.ttf --size 1080x1920 --seconds 3.5 --fps 30
# Latin text only: Blender's text objects do NOT shape Arabic (letters come out separate and left to right). For an
# Arabic title, set it in HTML/SVG (real font, Playwright screenshot with a transparent background) and put that PNG
# on a plane, or bring an SVG in with bpy.ops.import_curve.svg.
import bpy, math, os, sys

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default
OUT = os.path.abspath(arg('--out', 'out/sting'))
STILLS = [int(x) for x in arg('--stills', '').split(',') if x]
RES = int(arg('--res', '100'))
TEXT = arg('--text', 'TITLE')
FONT = arg('--font')  # a .ttf/.otf; none = Blender's built-in font
W, H = (int(v) for v in arg('--size', '1080x1920').split('x'))
FPS, SECONDS = int(arg('--fps', '30')), float(arg('--seconds', '3.5'))
PAPER, INK, ACCENT = '#EFE6D2', '#1D2B4A', '#C4472D'

def lin(hexc, a=1.0):  # sRGB hex → linear RGBA (what Blender's colour inputs expect)
    c = [int(hexc[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    f = lambda v: v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    return (*[f(v) for v in c], a)

# ---------- easing, baked: one LINEAR key per frame = the exact curve, no fcurve API differences between versions ----------
def e_io(u): return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
def e_out(u): return 1 - (1 - u) ** 3
def e_back(u, s=1.9): return 1 + (s + 1) * (u - 1) ** 3 + s * (u - 1) ** 2
TRACKS = []
def track(target, path, keys):  # keys = [(seconds, value, easing into this key)]
    TRACKS.append((target, path, keys))
def lerp(a, b, u):
    return tuple(x + (y - x) * u for x, y in zip(a, b)) if isinstance(a, (tuple, list)) else a + (b - a) * u
def value_at(keys, t):
    if t <= keys[0][0]: return keys[0][1]
    for i in range(1, len(keys)):
        (t0, v0), (t1, v1) = keys[i - 1][:2], keys[i][:2]
        if t <= t1:
            ease = keys[i][2] if len(keys[i]) > 2 else e_io
            return lerp(v0, v1, ease((t - t0) / (t1 - t0)) if t1 > t0 else 1)
    return keys[-1][1]
def bake(frames):
    for f in range(1, frames + 1):
        for target, path, keys in TRACKS:
            setattr(target, path, value_at(keys, (f - 1) / FPS))
            target.keyframe_insert(path, frame=f)

# ---------- scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.edit.keyframe_new_interpolation_type = 'LINEAR'
sc = bpy.context.scene
FRAMES = round(SECONDS * FPS)
sc.frame_start, sc.frame_end, sc.render.fps = 1, FRAMES, FPS
sc.render.engine = 'BLENDER_EEVEE'  # Eevee: ~2–4 s a 1080p frame on a GTX 1060; Cycles only for real glass/caustics
sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = W, H, RES
sc.render.image_settings.file_format = 'PNG'
# 'Standard' keeps brand colours exact (AgX/Filmic shift them); light colours clip easily: measure a pixel of a still
# and lower the light / world strength until the paper reads as its hex
sc.view_settings.view_transform = 'Standard'
for k, v in dict(taa_render_samples=32, use_shadows=True, use_gtao=True).items():
    try: setattr(sc.eevee, k, v)
    except Exception: pass

world = bpy.data.worlds.new('W'); sc.world = world
try: world.use_nodes = True
except Exception: pass
world.node_tree.nodes['Background'].inputs[0].default_value = lin(PAPER)
world.node_tree.nodes['Background'].inputs[1].default_value = 0.45

def material(name, hexc, rough=0.6):
    m = bpy.data.materials.new(name)
    try: m.use_nodes = True
    except Exception: pass
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = lin(hexc)
    p.inputs['Roughness'].default_value = rough
    return m

def link(ob):
    sc.collection.objects.link(ob)
    return ob

# backdrop: a big paper plane behind everything
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0.7, 0), rotation=(math.radians(90), 0, 0))  # close behind: a tight, paper-cut shadow
bpy.context.object.data.materials.append(material('paper', PAPER, 0.9))

# the title: real type, extruded + bevelled, centred
cu = bpy.data.curves.new('title', 'FONT')
if FONT: cu.font = bpy.data.fonts.load(FONT)
cu.body = TEXT
cu.align_x, cu.align_y = 'CENTER', 'CENTER'
cu.size, cu.extrude, cu.bevel_depth, cu.bevel_resolution = 1.0, 0.12, 0.02, 3
title = link(bpy.data.objects.new('title', cu))
title.rotation_euler = (math.radians(90), 0, 0)
title.data.materials.append(material('ink', INK, 0.45))
# fit the title to 80% of what the camera sees across: a 36 mm sensor fits the LONGER side of the frame, so a vertical
# frame sees only 36 * W/H mm across (a fixed size that fills 16:9 overflows 9:16)
bpy.context.view_layer.update()
LENS, DIST = 50, 9.5
seen = DIST * 36 * (min(1, W / H)) / LENS
span = max(title.dimensions.x, 0.01)
fit = 0.8 * seen / span
title.scale = (fit, fit, fit)

bar = link(bpy.data.objects.new('bar', bpy.data.meshes.new('bar')))
import bmesh
bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1.0); bm.to_mesh(bar.data); bm.free()
bar.data.materials.append(material('accent', ACCENT, 0.5))
bar.location = (0, 0, -0.7 * fit)

# camera + light
cam = link(bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))); sc.camera = cam
cam.data.lens = LENS
cam.rotation_euler = (math.radians(90), 0, 0)
sun = link(bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')))
sun.data.energy, sun.data.angle = 2.8, math.radians(6)
sun.rotation_euler = (math.radians(55), math.radians(-25), math.radians(-20))

# ---------- the motion (seconds) ----------
# title: rises and tips up into place with a back ease (a little overshoot), then holds
track(title, 'location', [(0, (0, 0, -1.4 * fit)), (0.15, (0, 0, -1.4 * fit)), (0.85, (0, 0, 0), e_back)])
track(title, 'rotation_euler', [(0, (math.radians(30), 0, 0)), (0.15, (math.radians(30), 0, 0)), (0.85, (math.radians(90), 0, 0), e_back)])
# bar: wipes in under the title once it has landed (faster than the title: support moves quicker than the hero)
track(bar, 'scale', [(0, (0.001, 0.08, 0.13)), (0.8, (0.001, 0.08, 0.13)), (1.25, (span * fit * 0.7, 0.08, 0.13), e_out)])
# camera: a slow push for the whole sting so the hold never feels frozen
track(cam, 'location', [(0, (0, -DIST * 1.08, 0.1)), (SECONDS, (0, -DIST, 0), e_out)])
bake(FRAMES)

os.makedirs(OUT, exist_ok=True)
if STILLS:
    for f in STILLS:
        sc.frame_set(f)
        sc.render.filepath = os.path.join(OUT, f'still-{f:04d}.png')
        bpy.ops.render.render(write_still=True)
else:
    sc.render.filepath = os.path.join(OUT, 'frames', '')
    bpy.ops.render.render(animation=True)
